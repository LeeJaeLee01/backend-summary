package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"deadlock-demo"
)

func main() {
	fmt.Println("=== Lock ordering fix ===")
	demoLockOrder()

	fmt.Println("\n=== Buffered channel fix ===")
	demoBufferedChannel()

	fmt.Println("\n=== Context cancel worker ===")
	demoContextWorker()
}

func demoLockOrder() {
	a := &deadlock.Account{ID: 1, Balance: 500}
	b := &deadlock.Account{ID: 2, Balance: 500}

	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(2)
		go func() {
			defer wg.Done()
			deadlock.TransferOrdered(a, b, 1)
		}()
		go func() {
			defer wg.Done()
			deadlock.TransferOrdered(b, a, 1)
		}()
	}
	wg.Wait()
	fmt.Printf("A=%d B=%d total=%d\n", a.Balance, b.Balance, a.Balance+b.Balance)
}

func demoBufferedChannel() {
	ch := make(chan int, 2)
	ch <- 1
	ch <- 2
	fmt.Printf("buffered recv: %d %d\n", <-ch, <-ch)
}

func demoContextWorker() {
	jobs := make(chan int)
	done := make(chan struct{})

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	go deadlock.WorkerWithContext(ctx, jobs, done)

	select {
	case <-done:
		fmt.Println("worker exited cleanly")
	case <-time.After(time.Second):
		fmt.Println("worker did not exit")
	}
}
