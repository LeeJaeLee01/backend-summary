package main

import (
	"context"
	"fmt"
	"sync"

	"race-condition-demo"
)

func main() {
	fmt.Println("=== Mutex counter (100 goroutine x 1000) ===")
	var muCounter racecondition.CounterMutex
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 1000; j++ {
				muCounter.Inc()
			}
		}()
	}
	wg.Wait()
	fmt.Println("result:", muCounter.Val())

	fmt.Println("\n=== Atomic counter ===")
	var atCounter racecondition.CounterAtomic
	wg = sync.WaitGroup{}
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 1000; j++ {
				atCounter.Inc()
			}
		}()
	}
	wg.Wait()
	fmt.Println("result:", atCounter.Val())

	fmt.Println("\n=== Worker pool (max 3 workers, 10 jobs) ===")
	items := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	_ = racecondition.ProcessBatch(context.Background(), items, 3, func(ctx context.Context, n int) error {
		fmt.Println("  process job", n)
		return nil
	})

	fmt.Println("\n=== LazyCache (check-then-act) ===")
	cache := racecondition.NewLazyCache()
	loads := 0
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			cache.GetOrLoad("user:1", func() int {
				loads++
				return 100
			})
		}()
	}
	wg.Wait()
	fmt.Println("cache value:", func() int { v, _ := cache.Get("user:1"); return v }())
	fmt.Println("loader runs once per key (see test for assertion)")

	fmt.Println("\nChạy race detector: go test -race -run TestCounterRace ./...")
}
