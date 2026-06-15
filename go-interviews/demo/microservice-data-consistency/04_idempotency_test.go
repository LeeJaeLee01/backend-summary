package consistency_test

import (
	"testing"

	c "microservice-consistency-demo"
)

func TestIdempotentPayment(t *testing.T) {
	p := c.NewIdempotentPayment()

	r1 := p.Charge("key-abc", "ord-5", 99)
	r2 := p.Charge("key-abc", "ord-5", 99)

	if r1 != r2 {
		t.Fatalf("duplicate key returned different results: %+v vs %+v", r1, r2)
	}
	if p.TotalCharges() != 1 {
		t.Fatalf("charges = %d, want 1", p.TotalCharges())
	}

	p.Charge("key-xyz", "ord-6", 10)
	if p.TotalCharges() != 2 {
		t.Fatalf("charges = %d, want 2", p.TotalCharges())
	}
}
