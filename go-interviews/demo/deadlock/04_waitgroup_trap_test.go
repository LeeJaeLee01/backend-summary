package deadlock_test

import (
	"sync"
	"testing"
	"time"
)

// TestWaitGroupTrap — Add bên trong goroutine, Wait có thể chạy trước → treo.
func TestWaitGroupTrap(t *testing.T) {
	var wg sync.WaitGroup

	done := make(chan struct{})
	go func() {
		wg.Add(1) // ← sai: Add sau khi parent có thể đã Wait
		defer wg.Done()
		time.Sleep(10 * time.Millisecond)
		close(done)
	}()

	// Race: đôi khi Wait trước Add → deadlock
	waitDone := make(chan struct{})
	go func() {
		wg.Wait()
		close(waitDone)
	}()

	select {
	case <-waitDone:
		t.Log("may pass due to scheduling — pattern vẫn là anti-pattern")
	case <-time.After(500 * time.Millisecond):
		t.Log("WaitGroup trap: Wait blocked (Add chưa chạy)")
	case <-done:
	}
}

// TestWaitGroupFix — Add trước go, Done trong goroutine.
func TestWaitGroupFix(t *testing.T) {
	const n = 10
	var wg sync.WaitGroup
	wg.Add(n)

	for i := 0; i < n; i++ {
		go func() {
			defer wg.Done()
		}()
	}

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("WaitGroup should complete")
	}
}
