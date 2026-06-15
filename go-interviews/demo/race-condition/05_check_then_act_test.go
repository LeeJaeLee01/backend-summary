package racecondition_test

import (
	"sync"
	"sync/atomic"
	"testing"

	"race-condition-demo"
)

func TestCheckThenActWithMutex(t *testing.T) {
	cache := racecondition.NewLazyCache()
	var loadCount atomic.Int64

	loader := func() int {
		loadCount.Add(1)
		return 42
	}

	const goroutines = 50
	var wg sync.WaitGroup
	wg.Add(goroutines)
	for i := 0; i < goroutines; i++ {
		go func() {
			defer wg.Done()
			v := cache.GetOrLoad("key", loader)
			if v != 42 {
				t.Errorf("got %d", v)
			}
		}()
	}
	wg.Wait()

	if loadCount.Load() != 1 {
		t.Fatalf("loader called %d times, want 1", loadCount.Load())
	}
}
