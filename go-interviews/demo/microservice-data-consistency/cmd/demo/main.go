package main

import (
	"fmt"
	"log"

	c "microservice-consistency-demo"
)

func main() {
	fmt.Println("=== Saga success ===")
	orders := c.NewOrderStore()
	inv := c.NewInventory(map[string]int{"phone": 5})
	pay := c.NewPayment()
	saga := &c.PlaceOrderSaga{Orders: orders, Inventory: inv, Payment: pay}
	if err := saga.Run("demo-1", "phone", 1, 500); err != nil {
		log.Fatal(err)
	}
	o, _ := orders.Get("demo-1")
	fmt.Printf("order %s: %s\n", o.ID, o.Status)

	fmt.Println("\n=== Saga compensation (payment fail) ===")
	orders2 := c.NewOrderStore()
	pay2 := c.NewPayment()
	pay2.SetFail(true)
	saga2 := &c.PlaceOrderSaga{Orders: orders2, Inventory: inv, Payment: pay2}
	if err := saga2.Run("demo-2", "phone", 1, 500); err != nil {
		fmt.Println("expected fail:", err)
	}
	o2, _ := orders2.Get("demo-2")
	fmt.Printf("order %s: %s (stock released)\n", o2.ID, o2.Status)

	fmt.Println("\n=== Outbox relay ===")
	var events []string
	store := c.NewOutboxStore(func(ev c.OutboxEvent) error {
		events = append(events, ev.Type+":"+ev.Payload)
		return nil
	})
	_ = store.CreateOrderWithOutbox("demo-3")
	_ = store.RelayPending()
	fmt.Println("published:", events)

	fmt.Println("\n=== Idempotent payment ===")
	ip := c.NewIdempotentPayment()
	ip.Charge("idem-1", "demo-4", 100)
	ip.Charge("idem-1", "demo-4", 100)
	fmt.Printf("total charges (duplicate key): %d\n", ip.TotalCharges())
}
