package deadlock_test

import (
	"context"
	"testing"
	"time"

	"deadlock-demo"
)

// TestContextTimeout — worker thoát khi ctx cancel thay vì block trên jobs.
func TestContextTimeout(t *testing.T) {
	jobs := make(chan int)
	done := make(chan struct{})

	ctx, cancel := context.WithCancel(context.Background())
	go deadlock.WorkerWithContext(ctx, jobs, done)

	cancel()

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("worker should exit on context cancel")
	}
}

// TestContextTimeoutOnSlowOp — mô phỏng RPC chậm, timeout trả lỗi.
func TestContextTimeoutOnSlowOp(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	slow := make(chan struct{})
	go func() {
		time.Sleep(200 * time.Millisecond)
		close(slow)
	}()

	select {
	case <-slow:
		t.Fatal("slow op finished — should have timed out")
	case <-ctx.Done():
		if ctx.Err() != context.DeadlineExceeded {
			t.Fatalf("got %v want DeadlineExceeded", ctx.Err())
		}
	}
}
