// ✅ AFTER: Clean Architecture - Domain Entity
// Core business entity with business rules and validation

package domain.entities;

import domain.valueobjects.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;

/**
 * Order Entity - Contains core business rules and invariants
 * 
 * This entity represents the heart of our business domain.
 * All business rules related to orders are encapsulated here.
 */
public class Order {
    private final OrderId id;
    private final CustomerId customerId;
    private final CustomerEmail customerEmail;
    private final List<OrderItem> items;
    private final ShippingAddress shippingAddress;
    private final Money totalAmount;
    private final LocalDateTime createdAt;
    
    private OrderStatus status;
    private PaymentId paymentId;
    private LocalDateTime lastModifiedAt;
    
    // Private constructor to enforce creation through factory methods
    private Order(OrderId id, CustomerId customerId, CustomerEmail customerEmail,
                 List<OrderItem> items, ShippingAddress shippingAddress) {
        this.id = id;
        this.customerId = customerId;
        this.customerEmail = customerEmail;
        this.items = new ArrayList<>(items);
        this.shippingAddress = shippingAddress;
        this.totalAmount = calculateTotalAmount(items);
        this.createdAt = LocalDateTime.now();
        this.status = OrderStatus.PENDING;
        this.lastModifiedAt = LocalDateTime.now();
        
        validateOrder();
    }
    
    /**
     * Factory method to create a new order
     * Enforces business rules at creation time
     */
    public static Order create(CustomerId customerId, CustomerEmail customerEmail,
                              List<OrderItem> items, ShippingAddress shippingAddress) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }
        
        OrderId orderId = OrderId.generate();
        return new Order(orderId, customerId, customerEmail, items, shippingAddress);
    }
    
    /**
     * Factory method to reconstitute order from storage
     * Used by repositories when loading from database
     */
    public static Order reconstitute(OrderId id, CustomerId customerId, CustomerEmail customerEmail,
                                   List<OrderItem> items, ShippingAddress shippingAddress,
                                   OrderStatus status, PaymentId paymentId,
                                   LocalDateTime createdAt, LocalDateTime lastModifiedAt) {
        Order order = new Order(id, customerId, customerEmail, items, shippingAddress);
        order.status = status;
        order.paymentId = paymentId;
        order.lastModifiedAt = lastModifiedAt;
        return order;
    }
    
    /**
     * Business Rule: Confirm order after successful payment
     */
    public void confirmPayment(PaymentId paymentId) {
        if (this.status != OrderStatus.PENDING) {
            throw new IllegalStateException("Can only confirm payment for pending orders");
        }
        
        if (paymentId == null) {
            throw new IllegalArgumentException("Payment ID cannot be null");
        }
        
        this.paymentId = paymentId;
        this.status = OrderStatus.CONFIRMED;
        this.lastModifiedAt = LocalDateTime.now();
    }
    
    /**
     * Business Rule: Cancel order if not yet shipped
     */
    public void cancel() {
        if (!canBeCancelled()) {
            throw new IllegalStateException("Order cannot be cancelled in current status: " + status);
        }
        
        this.status = OrderStatus.CANCELLED;
        this.lastModifiedAt = LocalDateTime.now();
    }
    
    /**
     * Business Rule: Mark order as shipped
     */
    public void markAsShipped() {
        if (this.status != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Can only ship confirmed orders");
        }
        
        this.status = OrderStatus.SHIPPED;
        this.lastModifiedAt = LocalDateTime.now();
    }
    
    /**
     * Business Rule: Mark order as delivered
     */
    public void markAsDelivered() {
        if (this.status != OrderStatus.SHIPPED) {
            throw new IllegalStateException("Can only deliver shipped orders");
        }
        
        this.status = OrderStatus.DELIVERED;
        this.lastModifiedAt = LocalDateTime.now();
    }
    
    /**
     * Business Rule: Determine if order can be cancelled
     */
    public boolean canBeCancelled() {
        return status == OrderStatus.PENDING || status == OrderStatus.CONFIRMED;
    }
    
    /**
     * Business Rule: Determine if order requires payment
     */
    public boolean requiresPayment() {
        return status == OrderStatus.PENDING && paymentId == null;
    }
    
    /**
     * Business Rule: Check if order is in a final state
     */
    public boolean isFinal() {
        return status == OrderStatus.CANCELLED || 
               status == OrderStatus.DELIVERED;
    }
    
    /**
     * Domain Service: Calculate total amount from items
     */
    private Money calculateTotalAmount(List<OrderItem> items) {
        BigDecimal total = items.stream()
            .map(item -> item.getLineTotal().getAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return new Money(total);
    }
    
    /**
     * Domain invariant validation
     */
    private void validateOrder() {
        if (customerId == null) {
            throw new IllegalArgumentException("Customer ID cannot be null");
        }
        
        if (customerEmail == null) {
            throw new IllegalArgumentException("Customer email cannot be null");
        }
        
        if (shippingAddress == null) {
            throw new IllegalArgumentException("Shipping address cannot be null");
        }
        
        if (totalAmount.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Order total must be positive");
        }
    }
    
    // Getters (read-only access)
    public OrderId getId() { return id; }
    public CustomerId getCustomerId() { return customerId; }
    public CustomerEmail getCustomerEmail() { return customerEmail; }
    public List<OrderItem> getItems() { return Collections.unmodifiableList(items); }
    public ShippingAddress getShippingAddress() { return shippingAddress; }
    public Money getTotalAmount() { return totalAmount; }
    public OrderStatus getStatus() { return status; }
    public PaymentId getPaymentId() { return paymentId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getLastModifiedAt() { return lastModifiedAt; }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Order order = (Order) obj;
        return id.equals(order.id);
    }
    
    @Override
    public int hashCode() {
        return id.hashCode();
    }
    
    @Override
    public String toString() {
        return String.format("Order{id=%s, customerId=%s, status=%s, totalAmount=%s}", 
                           id, customerId, status, totalAmount);
    }
}

/**
 * ✅ BENEFITS OF THIS APPROACH:
 * 
 * 1. BUSINESS RULES CENTRALIZED: All order-related business logic is in one place
 * 2. INVARIANTS PROTECTED: Object cannot be created or modified in invalid state
 * 3. IMMUTABLE WHERE POSSIBLE: Core properties cannot be changed after creation
 * 4. FACTORY METHODS: Controlled object creation with validation
 * 5. DOMAIN LANGUAGE: Methods and properties use business terminology
 * 6. ENCAPSULATION: Internal state is protected from invalid modifications
 * 7. TESTABLE: Pure business logic can be tested without external dependencies
 * 8. EXPRESSIVE: Code reads like business requirements
 * 9. COHESIVE: All order-related behavior is contained within the entity
 * 10. INDEPENDENT: No dependencies on frameworks, databases, or external services
 */
