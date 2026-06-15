package consistency_test

import (
	"testing"

	c "microservice-consistency-demo"
)

func TestSagaSuccess(t *testing.T) {
	orders := c.NewOrderStore()
	inv := c.NewInventory(map[string]int{"sku-1": 10})
	pay := c.NewPayment()

	saga := &c.PlaceOrderSaga{Orders: orders, Inventory: inv, Payment: pay}
	if err := saga.Run("ord-1", "sku-1", 2, 100); err != nil {
		t.Fatal(err)
	}

	o, ok := orders.Get("ord-1")
	if !ok || o.Status != c.OrderCompleted {
		t.Fatalf("order status = %v, want completed", o.Status)
	}
	if !pay.Charged("ord-1") {
		t.Fatal("payment not charged")
	}
}
