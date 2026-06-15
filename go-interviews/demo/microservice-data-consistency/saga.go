package consistency

import (
	"errors"
	"fmt"
	"sync"
)

var (
	ErrPaymentDeclined = errors.New("payment declined")
	ErrOutOfStock      = errors.New("out of stock")
)

type OrderStatus string

const (
	OrderPending   OrderStatus = "pending"
	OrderCompleted OrderStatus = "completed"
	OrderCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID     string
	Status OrderStatus
}

type Inventory struct {
	mu    sync.Mutex
	stock map[string]int
	held  map[string]int // orderID -> qty reserved
}

func NewInventory(stock map[string]int) *Inventory {
	held := make(map[string]int)
	return &Inventory{stock: stock, held: held}
}

func (i *Inventory) Reserve(orderID, sku string, qty int) error {
	i.mu.Lock()
	defer i.mu.Unlock()
	if i.stock[sku] < qty {
		return ErrOutOfStock
	}
	i.stock[sku] -= qty
	i.held[orderID] = qty
	return nil
}

func (i *Inventory) Release(orderID, sku string) {
	i.mu.Lock()
	defer i.mu.Unlock()
	qty := i.held[orderID]
	delete(i.held, orderID)
	i.stock[sku] += qty
}

type Payment struct {
	mu      sync.Mutex
	charges map[string]int // orderID -> amount charged
	fail    bool
}

func NewPayment() *Payment {
	return &Payment{charges: make(map[string]int)}
}

func (p *Payment) SetFail(fail bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.fail = fail
}

func (p *Payment) Charge(orderID string, amount int) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.fail {
		return ErrPaymentDeclined
	}
	p.charges[orderID] = amount
	return nil
}

func (p *Payment) Refund(orderID string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	delete(p.charges, orderID)
}

func (p *Payment) Charged(orderID string) bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	_, ok := p.charges[orderID]
	return ok
}

type OrderStore struct {
	mu     sync.Mutex
	orders map[string]*Order
}

func NewOrderStore() *OrderStore {
	return &OrderStore{orders: make(map[string]*Order)}
}

func (s *OrderStore) CreatePending(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.orders[id] = &Order{ID: id, Status: OrderPending}
}

func (s *OrderStore) Complete(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.orders[id].Status = OrderCompleted
}

func (s *OrderStore) Cancel(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.orders[id].Status = OrderCancelled
}

func (s *OrderStore) Get(id string) (Order, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	o, ok := s.orders[id]
	if !ok {
		return Order{}, false
	}
	return *o, ok
}

// PlaceOrderSaga — orchestration: order → inventory → payment.
type PlaceOrderSaga struct {
	Orders    *OrderStore
	Inventory *Inventory
	Payment   *Payment
}

func (s *PlaceOrderSaga) Run(orderID, sku string, qty, amount int) error {
	s.Orders.CreatePending(orderID)

	if err := s.Inventory.Reserve(orderID, sku, qty); err != nil {
		s.Orders.Cancel(orderID)
		return err
	}

	if err := s.Payment.Charge(orderID, amount); err != nil {
		s.Inventory.Release(orderID, sku)
		s.Orders.Cancel(orderID)
		return fmt.Errorf("compensated after payment fail: %w", err)
	}

	s.Orders.Complete(orderID)
	return nil
}
