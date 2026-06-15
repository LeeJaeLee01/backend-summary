package deadlock_test

import (
	"sync"
	"testing"
	"time"

	"deadlock-demo"
)

// TestMutexDeadlock — demo AB-BA deadlock (ANTI-PATTERN).
//
// Trường hợp: 2 goroutine cùng giữ lock account đầu, rồi chờ lock account còn lại.
// Kỳ vọng: treo → go test -timeout sẽ kill test.
//
// Chạy: go test -timeout 2s -run TestMutexDeadlock ./...
func TestMutexDeadlock(t *testing.T) {
	t.Skip("chạy thủ công: go test -timeout 2s -run TestMutexDeadlock ./...")

	a := &deadlock.Account{ID: 1, Balance: 1000}
	b := &deadlock.Account{ID: 2, Balance: 1000}
	entered := make(chan struct{}, 2)

	go deadlock.DeadlockDemo(a, b, entered)
	go deadlock.DeadlockDemo(b, a, entered)

	<-entered
	<-entered

	select {
	case <-time.After(300 * time.Millisecond):
		t.Log("deadlock: cả hai goroutine blocked (chạy không -timeout sẽ treo mãi)")
	default:
		t.Fatal("expected both goroutines blocked on second lock")
	}
}

// TestMutexDeadlockParallel — chạy nhiều transfer ngược chiều, vẫn deadlock.
func TestMutexDeadlockParallel(t *testing.T) {
	t.Skip("anti-pattern — minh họa trong tài liệu")

	a := &deadlock.Account{ID: 1, Balance: 10_000}
	b := &deadlock.Account{ID: 2, Balance: 10_000}

	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(2)
		go func() {
			defer wg.Done()
			deadlock.TransferUnsafe(a, b, 1)
		}()
		go func() {
			defer wg.Done()
			deadlock.TransferUnsafe(b, a, 1)
		}()
	}
	wg.Wait()
}
