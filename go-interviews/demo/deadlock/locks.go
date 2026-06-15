package deadlock

import "sync"

// Account — ví dụ transfer tiền giữa 2 tài khoản.
type Account struct {
	ID      int
	Balance int
	mu      sync.Mutex
}

// TransferUnsafe — ANTI-PATTERN: lock theo thứ tự from→to.
// Nếu A→B và B→A đồng thời → deadlock AB-BA.
func TransferUnsafe(from, to *Account, amount int) {
	from.mu.Lock()
	to.mu.Lock()

	from.Balance -= amount
	to.Balance += amount

	to.mu.Unlock()
	from.mu.Unlock()
}

// DeadlockDemo — goroutine lock `first`, báo `entered`, rồi chờ `second`.
// Hai goroutine gọi với (a,b) và (b,a) → AB-BA deadlock chắc chắn.
func DeadlockDemo(first, second *Account, entered chan struct{}) {
	first.mu.Lock()
	entered <- struct{}{}
	second.mu.Lock() // block khi bên kia giữ second
	_ = first
	_ = second
}

// TransferOrdered — lock theo ID nhỏ trước → không có vòng chờ.
func TransferOrdered(a, b *Account, amount int) {
	first, second := a, b
	if a.ID > b.ID {
		first, second = b, a
	}

	first.mu.Lock()
	second.mu.Lock()

	if a.ID < b.ID {
		a.Balance -= amount
		b.Balance += amount
	} else {
		b.Balance -= amount
		a.Balance += amount
	}

	second.mu.Unlock()
	first.mu.Unlock()
}
