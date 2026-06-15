package goconcurrency

import "sync"

// Semaphore limits concurrent work to n (alternative to worker pool).
func RunWithSemaphore(n int, tasks []func()) {
	sem := make(chan struct{}, n)
	var wg sync.WaitGroup
	for _, task := range tasks {
		wg.Add(1)
		sem <- struct{}{} // acquire
		go func(fn func()) {
			defer wg.Done()
			defer func() { <-sem }() // release — defer runs when goroutine returns
			fn()
		}(task)
	}
	wg.Wait()
}
