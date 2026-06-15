package consistency

import (
	"sync"
)

type OutboxEvent struct {
	ID      int
	Type    string
	Payload string
	Sent    bool
}

// OutboxStore simulates business DB + outbox in one local transaction.
type OutboxStore struct {
	mu      sync.Mutex
	orders  []string
	outbox  []OutboxEvent
	nextID  int
	publish func(OutboxEvent) error
}

func NewOutboxStore(publish func(OutboxEvent) error) *OutboxStore {
	return &OutboxStore{publish: publish}
}

func (s *OutboxStore) CreateOrderWithOutbox(orderID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.orders = append(s.orders, orderID)
	s.nextID++
	s.outbox = append(s.outbox, OutboxEvent{
		ID:      s.nextID,
		Type:    "OrderCreated",
		Payload: orderID,
	})
	return nil
}

// RelayPending publishes unsent outbox rows (separate process in production).
func (s *OutboxStore) RelayPending() error {
	s.mu.Lock()
	pending := make([]OutboxEvent, 0)
	for i := range s.outbox {
		if !s.outbox[i].Sent {
			pending = append(pending, s.outbox[i])
		}
	}
	s.mu.Unlock()

	for _, ev := range pending {
		if err := s.publish(ev); err != nil {
			return err
		}
		s.mu.Lock()
		for i := range s.outbox {
			if s.outbox[i].ID == ev.ID {
				s.outbox[i].Sent = true
			}
		}
		s.mu.Unlock()
	}
	return nil
}

func (s *OutboxStore) OrderCount() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.orders)
}

func (s *OutboxStore) PendingOutboxCount() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	n := 0
	for _, e := range s.outbox {
		if !e.Sent {
			n++
		}
	}
	return n
}
