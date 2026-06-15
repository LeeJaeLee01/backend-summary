package racecondition_test

import (
	"sync"
	"testing"

	"race-condition-demo"
)

// TestCounterMutex — fix Read-modify-write bằng sync.Mutex.
//
// Trường hợp: nhiều goroutine cùng tăng counter / sửa struct có nhiều field.
// Layer: in-process Go.
// Dùng khi: cần bọc critical section (check + update nhiều bước).
func TestCounterMutex(t *testing.T) {
	var c racecondition.CounterMutex
	const goroutines = 100
	const perG = 1000

	var wg sync.WaitGroup
	wg.Add(goroutines)
	for i := 0; i < goroutines; i++ {
		go func() {
			defer wg.Done()
			for j := 0; j < perG; j++ {
				c.Inc() // Mutex trong Inc() — an toàn
			}
		}()
	}
	wg.Wait()

	want := goroutines * perG
	if got := c.Val(); got != want {
		t.Fatalf("got %d want %d", got, want)
	}
}
