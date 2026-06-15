package deadlock_test

import (
	"sync"
	"testing"

	"deadlock-demo"
)

// TestLockOrderFix — transfer đồng thời không deadlock nhờ lock theo ID.
func TestLockOrderFix(t *testing.T) {
	a := &deadlock.Account{ID: 1, Balance: 1000}
	b := &deadlock.Account{ID: 2, Balance: 1000}

	const n = 200
	var wg sync.WaitGroup
	wg.Add(n * 2)

	for i := 0; i < n; i++ {
		go func() {
			defer wg.Done()
			deadlock.TransferOrdered(a, b, 1)
		}()
		go func() {
			defer wg.Done()
			deadlock.TransferOrdered(b, a, 1)
		}()
	}

	wg.Wait()

	total := a.Balance + b.Balance
	if total != 2000 {
		t.Fatalf("balance invariant broken: got %d want 2000", total)
	}
}
