// ✅ AFTER: Clean Architecture - Application Use Case
// Orchestrates the order creation business flow

package application.usecases;

import domain.entities.Order;
import domain.valueobjects.*;
import domain.repositories.OrderRepository;
import domain.repositories.ProductRepository;
import application.services.PaymentService;
import application.services.NotificationService;
import application.services.InventoryService;
import application.ports.CreateOrderCommand;
import application.ports.CreateOrderResponse;
import java.util.List;
import java.util.ArrayList;

/**
 * Create Order Use Case
 * 
 * This use case orchestrates the complete order creation flow:
 * 1. Validate inventory availability
 * 2. Process payment
 * 3. Create order entity
 * 4. Reserve inventory
 * 5. Save order
 * 6. Send notifications
 * 
 * Note: This is application logic, not business logic.
 * Business rules are in the Order entity.
 */
public class CreateOrderUseCase {
    
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final InventoryService inventoryService;
    
    public CreateOrderUseCase(OrderRepository orderRepository,
                             ProductRepository productRepository,
                             PaymentService paymentService,
                             NotificationService notificationService,
                             InventoryService inventoryService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
        this.inventoryService = inventoryService;
    }
    
    /**
     * Execute the create order use case
     * 
     * This method coordinates multiple domain services and repositories
     * to fulfill the complete order creation business process
     */
    public CreateOrderResponse execute(CreateOrderCommand command) {
        try {
            // Step 1: Validate and reserve inventory
            List<OrderItem> orderItems = validateAndReserveInventory(command.getItems());
            
            // Step 2: Process payment
            PaymentId paymentId = processPayment(command, calculateTotal(orderItems));
            
            // Step 3: Create order entity (domain logic)
            Order order = Order.create(
                new CustomerId(command.getCustomerId()),
                new CustomerEmail(command.getCustomerEmail()),
                orderItems,
                mapToShippingAddress(command.getShippingAddress())
            );
            
            // Step 4: Confirm payment on order (business rule)
            order.confirmPayment(paymentId);
            
            // Step 5: Save order (persistence)
            orderRepository.save(order);
            
            // Step 6: Send confirmation notification (side effect)
            notificationService.sendOrderConfirmation(order);
            
            // Step 7: Return success response
            return CreateOrderResponse.success(
                order.getId().getValue(),
                order.getTotalAmount().getAmount(),
                paymentId.getValue()
            );
            
        } catch (InsufficientInventoryException e) {
            // Step 8a: Handle inventory failure
            return CreateOrderResponse.failure("INSUFFICIENT_INVENTORY", e.getMessage());
            
        } catch (PaymentProcessingException e) {
            // Step 8b: Handle payment failure (restore inventory)
            restoreInventory(command.getItems());
            return CreateOrderResponse.failure("PAYMENT_FAILED", e.getMessage());
            
        } catch (Exception e) {
            // Step 8c: Handle unexpected errors (restore inventory)
            restoreInventory(command.getItems());
            return CreateOrderResponse.failure("INTERNAL_ERROR", "Order creation failed");
        }
    }
    
    /**
     * Validate inventory and create order items
     * This is application-level coordination, not business logic
     */
    private List<OrderItem> validateAndReserveInventory(List<CreateOrderCommand.OrderItemCommand> itemCommands) {
        List<OrderItem> orderItems = new ArrayList<>();
        
        for (CreateOrderCommand.OrderItemCommand itemCommand : itemCommands) {
            // Get product details
            ProductId productId = new ProductId(itemCommand.getProductId());
            Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product not found: " + productId));
            
            // Check inventory availability
            int requestedQuantity = itemCommand.getQuantity();
            if (!inventoryService.isAvailable(productId, requestedQuantity)) {
                throw new InsufficientInventoryException(
                    "Insufficient inventory for product: " + product.getName()
                );
            }
            
            // Reserve inventory
            inventoryService.reserve(productId, requestedQuantity);
            
            // Create order item (domain object)
            OrderItem orderItem = OrderItem.create(
                productId,
                product.getName(),
                product.getPrice(),
                requestedQuantity
            );
            
            orderItems.add(orderItem);
        }
        
        return orderItems;
    }
    
    /**
     * Process payment through payment service
     * This delegates to the payment service (external boundary)
     */
    private PaymentId processPayment(CreateOrderCommand command, Money totalAmount) {
        PaymentRequest paymentRequest = PaymentRequest.builder()
            .customerId(command.getCustomerId())
            .amount(totalAmount.getAmount())
            .paymentToken(command.getPaymentToken())
            .description("Order payment for " + command.getCustomerEmail())
            .build();
        
        PaymentResult result = paymentService.processPayment(paymentRequest);
        
        if (!result.isSuccessful()) {
            throw new PaymentProcessingException(result.getErrorMessage());
        }
        
        return new PaymentId(result.getTransactionId());
    }
    
    /**
     * Calculate total amount from order items
     * Simple utility method for coordination
     */
    private Money calculateTotal(List<OrderItem> items) {
        return items.stream()
            .map(OrderItem::getLineTotal)
            .reduce(Money.ZERO, Money::add);
    }
    
    /**
     * Map command DTO to domain value object
     * Translation between application and domain layers
     */
    private ShippingAddress mapToShippingAddress(CreateOrderCommand.ShippingAddressCommand addressCommand) {
        return ShippingAddress.create(
            addressCommand.getStreet(),
            addressCommand.getCity(),
            addressCommand.getState(),
            addressCommand.getZipCode()
        );
    }
    
    /**
     * Compensating action: restore inventory on failure
     * This ensures consistency when the process fails
     */
    private void restoreInventory(List<CreateOrderCommand.OrderItemCommand> items) {
        try {
            for (CreateOrderCommand.OrderItemCommand item : items) {
                ProductId productId = new ProductId(item.getProductId());
                inventoryService.release(productId, item.getQuantity());
            }
        } catch (Exception e) {
            // Log error but don't fail the original operation
            // In real systems, this would trigger a compensating process
            System.err.println("Failed to restore inventory: " + e.getMessage());
        }
    }
}

/**
 * Supporting Exception Classes
 * These represent specific failure modes in the use case
 */
class InsufficientInventoryException extends RuntimeException {
    public InsufficientInventoryException(String message) {
        super(message);
    }
}

class PaymentProcessingException extends RuntimeException {
    public PaymentProcessingException(String message) {
        super(message);
    }
}

class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(String message) {
        super(message);
    }
}

/**
 * ✅ BENEFITS OF THIS APPROACH:
 * 
 * 1. SINGLE RESPONSIBILITY: Only orchestrates order creation flow
 * 2. DEPENDENCY INVERSION: Depends on abstractions (repositories, services)
 * 3. BUSINESS FLOW CLARITY: Easy to understand the complete process
 * 4. ERROR HANDLING: Specific exception types for different failure modes
 * 5. COMPENSATION: Handles rollback scenarios (inventory restoration)
 * 6. TESTABLE: Can be tested with mock implementations
 * 7. TRANSACTION BOUNDARY: Clear scope of what happens in one operation
 * 8. SEPARATION OF CONCERNS: Application logic separate from business logic
 * 9. DOMAIN PROTECTION: Business rules stay in domain entities
 * 10. COORDINATED: Orchestrates multiple services without knowing their implementation
 * 
 * This use case is the "conductor" that orchestrates the business process
 * while keeping business rules in domain entities where they belong.
 */
