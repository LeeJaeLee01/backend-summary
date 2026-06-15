package goconcurrency_test

import (
	"sync/atomic"
	"testing"
	"time"

	gc "go-concurrency-demo"
)

func TestDeferRunsInGoroutine(t *testing.T) {
	var cleaned atomic.Bool
	done := make(chan struct{})

	go func() {
		defer func() { cleaned.Store(true) }()
		time.Sleep(10 * time.Millisecond)
		close(done)
	}()

	<-done
	time.Sleep(5 * time.Millisecond)
	if !cleaned.Load() {
		t.Fatal("defer in goroutine should run after function returns")
	}
}

func TestSemaphoreLimitsConcurrency(t *testing.T) {
	var current atomic.Int32
	var maxSeen atomic.Int32

	tasks := make([]func(), 20)
	for i := range tasks {
		tasks[i] = func() {
			c := current.Add(1)
			for {
				old := maxSeen.Load()
				if c <= old || maxSeen.CompareAndSwap(old, c) {
					break
				}
			}
			time.Sleep(20 * time.Millisecond)
			current.Add(-1)
		}
	}

	gc.RunWithSemaphore(5, tasks)
	if maxSeen.Load() > 5 {
		t.Fatalf("max concurrent = %d, want <= 5", maxSeen.Load())
	}
}
