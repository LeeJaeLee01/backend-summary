package deadlock_test

import (
	"testing"
	"time"

	"deadlock-demo"
)

// TestChannelBlock — gửi unbuffered không receiver → block (minh họa).
func TestChannelBlock(t *testing.T) {
	ch := make(chan int)

	sent := make(chan struct{})
	go func() {
		deadlock.SendUnbuffered(ch, 42)
		close(sent)
	}()

	select {
	case <-sent:
		t.Fatal("expected block on unbuffered send")
	case <-time.After(200 * time.Millisecond):
		t.Log("channel send blocked — không có receiver")
	}
}

// TestChannelBufferedFix — buffer cho phép gửi khi chưa có receiver ngay.
func TestChannelBufferedFix(t *testing.T) {
	ch := make(chan int, 1)
	deadlock.SendUnbuffered(ch, 42)

	v := <-ch
	if v != 42 {
		t.Fatalf("got %d want 42", v)
	}
}

// TestChannelTimeoutFix — select + context timeout khi không gửi được.
func TestChannelTimeoutFix(t *testing.T) {
	ch := make(chan int) // unbuffered, không ai nhận

	err := deadlock.SendWithTimeout(ch, 1, 50*time.Millisecond)
	if err == nil {
		t.Fatal("expected timeout error")
	}
}
