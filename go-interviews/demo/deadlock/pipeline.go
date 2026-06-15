package deadlock

import (
	"context"
	"time"
)

// SendUnbuffered — gửi vào unbuffered channel không có receiver → block mãi.
func SendUnbuffered(ch chan<- int, v int) {
	ch <- v
}

// SendWithTimeout — thoát nếu không gửi được trong deadline.
func SendWithTimeout(ch chan<- int, v int, d time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), d)
	defer cancel()

	select {
	case ch <- v:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// WorkerWithContext — worker thoát khi ctx cancel thay vì block trên channel.
func WorkerWithContext(ctx context.Context, jobs <-chan int, done chan<- struct{}) {
	defer close(done)
	for {
		select {
		case <-ctx.Done():
			return
		case job, ok := <-jobs:
			if !ok {
				return
			}
			_ = job
		}
	}
}
