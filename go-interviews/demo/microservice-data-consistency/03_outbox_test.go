package consistency_test

import (
	"sync"
	"testing"

	c "microservice-consistency-demo"
)

func TestOutboxRelay(t *testing.T) {
	var mu sync.Mutex
	var published []string

	store := c.NewOutboxStore(func(ev c.OutboxEvent) error {
		mu.Lock()
		published = append(published, ev.Payload)
		mu.Unlock()
		return nil
	})

	if err := store.CreateOrderWithOutbox("ord-10"); err != nil {
		t.Fatal(err)
	}
	if store.OrderCount() != 1 {
		t.Fatal("order not persisted")
	}
	if store.PendingOutboxCount() != 1 {
		t.Fatal("outbox row missing")
	}

	if err := store.RelayPending(); err != nil {
		t.Fatal(err)
	}
	if store.PendingOutboxCount() != 0 {
		t.Fatal("outbox still pending after relay")
	}
	if len(published) != 1 || published[0] != "ord-10" {
		t.Fatalf("published = %v", published)
	}
}
