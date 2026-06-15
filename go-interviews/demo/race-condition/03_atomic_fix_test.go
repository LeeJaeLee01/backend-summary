package racecondition_test

import (
	"sync"
	"testing"

	"race-condition-demo"
)

func TestCounterAtomic(t *testing.T) {
	var c racecondition.CounterAtomic
	const goroutines = 100
	const perG = 1000

	var wg sync.WaitGroup
	wg.Add(goroutines)
	for i := 0; i < goroutines; i++ {
		go func() {
			defer wg.Done()
			for j := 0; j < perG; j++ {
				c.Inc()
			}
		}()
	}
	wg.Wait()

	want := int64(goroutines * perG)
	if got := c.Val(); got != want {
		t.Fatalf("got %d want %d", got, want)
	}
}
