package consistency_test

import (
	"errors"
	"testing"

	c "microservice-consistency-demo"
)

func TestSagaCompensationOnPaymentFail(t *testing.T) {
	orders := c.NewOrderStore()
	inv := c.NewInventory(map[string]int{"sku-1": 10})
	pay := c.NewPayment()
	pay.SetFail(true)

	saga := &c.PlaceOrderSaga{Orders: orders, Inventory: inv, Payment: pay}
	err := saga.Run("ord-2", "sku-1", 3, 50)
	if !errors.Is(err, c.ErrPaymentDeclined) {
		t.Fatalf("err = %v, want payment declined", err)
	}

	o, _ := orders.Get("ord-2")
	if o.Status != c.OrderCancelled {
		t.Fatalf("order status = %v, want cancelled", o.Status)
	}
	if pay.Charged("ord-2") {
		t.Fatal("payment should not be charged")
	}

	// Stock restored after Release compensation.
	saga2 := &c.PlaceOrderSaga{Orders: c.NewOrderStore(), Inventory: inv, Payment: c.NewPayment()}
	if err := saga2.Run("ord-3", "sku-1", 3, 10); err != nil {
		t.Fatalf("stock not restored: %v", err)
	}
}
