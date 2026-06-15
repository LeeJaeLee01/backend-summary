// Package racecondition — demo xử lý race condition trong Go (in-process).
//
// Phân loại trường hợp:
//   - counter.go  → pattern Read-modify-write (counter++)
//   - cache.go    → pattern Check-then-act + map concurrent
//   - worker_pool → giới hạn concurrency, tránh spawn goroutine vô hạn
//
// Lưu ý: các công cụ ở đây chỉ sync trong 1 process.
// Nhiều pod/instance → xử lý ở tầng Postgres (xem race-condition.md).
package racecondition

import (
	"sync"
	"sync/atomic"
)

// CounterUnsafe — ANTI-PATTERN: demo race condition.
//
// Trường hợp: Read-modify-write (đọc n → tăng → ghi n).
// Ví dụ thực tế: metrics counter, biến đếm request trong memory.
// Vấn đề: nhiều goroutine gọi Inc() cùng lúc → lost update, kết quả < mong đợi.
// Chạy: go test -race -run TestCounterRace ./...
type CounterUnsafe struct {
	n int
}

func (c *CounterUnsafe) Inc()  { c.n++ } // ← DATA RACE khi concurrent
func (c *CounterUnsafe) Val() int { return c.n }

// CounterMutex — FIX bằng sync.Mutex.
//
// Trường hợp: Read-modify-write khi cần bảo vệ nhiều bước hoặc nhiều field.
// Ví dụ thực tế: struct có invariant phức tạp (check điều kiện rồi mới ghi).
// Khi dùng: logic không chỉ tăng 1 số — cần Lock/Unlock bọc critical section.
// Không dùng: lock lâu / gọi I/O trong lock (dễ nghẽn).
type CounterMutex struct {
	mu sync.Mutex
	n  int
}

func (c *CounterMutex) Inc() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.n++ // critical section — chỉ 1 goroutine vào tại một thời điểm
}

func (c *CounterMutex) Val() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.n
}

// CounterAtomic — FIX bằng sync/atomic.
//
// Trường hợp: Read-modify-write trên MỘT biến số đơn giản (counter, flag).
// Ví dụ thực tế: đếm request, in-flight gauge, request ID generator.
// Ưu điểm: nhẹ hơn Mutex, không block goroutine khác khi chỉ +/- 1 số.
// Không dùng: cập nhật nhiều field cùng lúc — dùng Mutex thay thế.
type CounterAtomic struct {
	n atomic.Int64
}

func (c *CounterAtomic) Inc()       { c.n.Add(1) }   // atomic, không race
func (c *CounterAtomic) Val() int64 { return c.n.Load() }
