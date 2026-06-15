package racecondition

import (
	"context"
	"sync"
)

// ProcessBatch — worker pool: giới hạn số goroutine chạy đồng thời.
//
// Trường hợp KHÔNG phải race trực tiếp trên shared variable, mà:
//   - Quá nhiều user/request → spawn goroutine vô hạn → OOM, hàng đợi phình to
//   - Cần kiểm soát tải: DB connection, API downstream, CPU
//
// Ví dụ thực tế:
//   - Export 1 triệu record — tối đa 5 worker xử lý song song
//   - Batch gửi email/notification
//   - Xử lý upload file nặng
//
// Cách xử lý: channel làm job queue + N worker cố định (không share memory giữa job).
// Biến thể khác: semaphore chan struct{} capacity N.
//
// Nhiều pod: dùng Postgres FOR UPDATE SKIP LOCKED thay in-memory queue.
func ProcessBatch(ctx context.Context, items []int, maxWorkers int, fn func(context.Context, int) error) error {
	if maxWorkers < 1 {
		maxWorkers = 1
	}
	jobs := make(chan int, len(items)) // job queue — mỗi item chỉ 1 worker nhận
	errCh := make(chan error, 1)

	var wg sync.WaitGroup
	worker := func() {
		defer wg.Done()
		for item := range jobs {
			if err := fn(ctx, item); err != nil {
				select {
				case errCh <- err:
				default:
				}
				return
			}
		}
	}

	wg.Add(maxWorkers)
	for i := 0; i < maxWorkers; i++ {
		go worker() // cố định maxWorkers goroutine — không spawn thêm theo số item
	}

	for _, item := range items {
		jobs <- item
	}
	close(jobs)
	wg.Wait()

	select {
	case err := <-errCh:
		return err
	default:
		return nil
	}
}
