package racecondition_test

import (
	"sync"
	"testing"

	"race-condition-demo"
)

// TestCounterRace — demo race condition (ANTI-PATTERN).
//
// Trường hợp: Read-modify-write — pattern counter++ không sync.
// Layer: in-process Go (1 service, nhiều goroutine).
// Kỳ vọng: kết quả < 100_000 (lost update) hoặc go test -race báo DATA RACE.
//
// Chạy: go test -race -run TestCounterRace ./...
func TestCounterRace(t *testing.T) {
	var c racecondition.CounterUnsafe
	const goroutines = 100
	const perG = 1000

	var wg sync.WaitGroup
	wg.Add(goroutines)
	for i := 0; i < goroutines; i++ {
		go func() {
			defer wg.Done()
			for j := 0; j < perG; j++ {
				c.Inc() // ← race tại đây
			}
		}()
	}
	wg.Wait()

	want := goroutines * perG
	if c.Val() != want {
		t.Logf("lost updates: got %d want %d (chạy -race để thấy DATA RACE)", c.Val(), want)
	}
}
