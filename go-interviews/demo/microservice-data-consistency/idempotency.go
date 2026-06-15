package consistency

import (
	"sync"
)

type PaymentResult struct {
	OrderID string
	Amount  int
}

// IdempotentPayment stores result per idempotency key.
type IdempotentPayment struct {
	mu      sync.Mutex
	seen    map[string]PaymentResult
	charges int
}

func NewIdempotentPayment() *IdempotentPayment {
	return &IdempotentPayment{seen: make(map[string]PaymentResult)}
}

func (p *IdempotentPayment) Charge(idempotencyKey, orderID string, amount int) PaymentResult {
	p.mu.Lock()
	defer p.mu.Unlock()

	if res, ok := p.seen[idempotencyKey]; ok {
		return res
	}

	p.charges++
	res := PaymentResult{OrderID: orderID, Amount: amount}
	p.seen[idempotencyKey] = res
	return res
}

func (p *IdempotentPayment) TotalCharges() int {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.charges
}
