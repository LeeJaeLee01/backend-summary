package racecondition_test

import (
	"context"
	"sync"
	"testing"

	"race-condition-demo"
)

func TestWorkerPoolLimitsConcurrency(t *testing.T) {
	const maxWorkers = 3
	started := make(chan struct{}, maxWorkers+1)
	release := make(chan struct{})

	items := make([]int, 10)
	for i := range items {
		items[i] = i
	}

	done := make(chan struct{})
	go func() {
		_ = racecondition.ProcessBatch(context.Background(), items, maxWorkers, func(ctx context.Context, _ int) error {
			started <- struct{}{}
			<-release
			return nil
		})
		close(done)
	}()

	// Đợi đủ maxWorkers job bắt đầu — không được vượt quá
	for i := 0; i < maxWorkers; i++ {
		<-started
	}
	select {
	case <-started:
		t.Fatalf("more than %d workers ran at once", maxWorkers)
	default:
	}

	close(release)
	<-done
}
