package racecondition

import "sync"

// LazyCache — FIX pattern Check-then-act + map concurrent.
//
// Trường hợp: "Nếu chưa có trong cache thì load từ DB/API".
// Vấn đề không có lock:
//   - Goroutine A, B cùng thấy key chưa tồn tại → cả hai gọi loader (duplicate work)
//   - Ghi map từ nhiều goroutine → panic hoặc corrupt data
//
// Ví dụ thực tế: cache user profile, config, session in-memory.
// Cách xử lý: Mutex bọc CẢ bước check (đọc map) VÀ act (load + ghi map).
// Thay thế khác: sync.Map (read-mostly), singleflight package.
type LazyCache struct {
	mu   sync.Mutex // bảo vệ toàn bộ map — tránh check-then-act race
	data map[string]int
}

func NewLazyCache() *LazyCache {
	return &LazyCache{data: make(map[string]int)}
}

// GetOrLoad — check-then-act an toàn: check và ghi trong cùng critical section.
func (c *LazyCache) GetOrLoad(key string, loader func() int) int {
	c.mu.Lock()
	defer c.mu.Unlock()

	if v, ok := c.data[key]; ok {
		return v // đã có → không gọi loader
	}
	v := loader() // chỉ 1 goroutine vào đây cho mỗi key
	c.data[key] = v
	return v
}

func (c *LazyCache) Get(key string) (int, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	v, ok := c.data[key]
	return v, ok
}
