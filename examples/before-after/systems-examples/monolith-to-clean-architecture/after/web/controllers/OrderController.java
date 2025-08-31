// ✅ AFTER: Clean Architecture - Web Controller
// Handles HTTP concerns and delegates to use cases

package web.controllers;

import application.usecases.CreateOrderUseCase;
import application.usecases.GetOrderUseCase;
import application.usecases.CancelOrderUseCase;
import application.ports.CreateOrderCommand;
import application.ports.CreateOrderResponse;
import application.ports.GetOrderQuery;
import application.ports.GetOrderResponse;
import application.ports.CancelOrderCommand;
import application.ports.CancelOrderResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Order Controller - Web Layer
 * 
 * Responsibilities:
 * 1. HTTP request/response handling
 * 2. Input validation and mapping
 * 3. Delegating to use cases
 * 4. HTTP status code management
 * 5. Response formatting
 * 
 * This controller has NO business logic - it's purely about HTTP concerns
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    private final CreateOrderUseCase createOrderUseCase;
    private final GetOrderUseCase getOrderUseCase;
    private final CancelOrderUseCase cancelOrderUseCase;
    
    public OrderController(CreateOrderUseCase createOrderUseCase,
                          GetOrderUseCase getOrderUseCase,
                          CancelOrderUseCase cancelOrderUseCase) {
        this.createOrderUseCase = createOrderUseCase;
        this.getOrderUseCase = getOrderUseCase;
        this.cancelOrderUseCase = cancelOrderUseCase;
    }
    
    /**
     * Create a new order
     * 
     * This method:
     * 1. Validates HTTP input
     * 2. Maps HTTP request to command
     * 3. Delegates to use case
     * 4. Maps response to HTTP format
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody CreateOrderRequestDto request) {
        try {
            // Step 1: Validate HTTP input
            validateCreateOrderRequest(request);
            
            // Step 2: Map HTTP request to application command
            CreateOrderCommand command = mapToCreateOrderCommand(request);
            
            // Step 3: Execute use case (this is where business logic happens)
            CreateOrderResponse response = createOrderUseCase.execute(command);
            
            // Step 4: Map response and return appropriate HTTP status
            if (response.isSuccessful()) {
                return ResponseEntity.status(HttpStatus.CREATED)
                    .body(mapToSuccessResponse(response));
            } else {
                return ResponseEntity.status(getHttpStatusForError(response.getErrorCode()))
                    .body(mapToErrorResponse(response));
            }
            
        } catch (ValidationException e) {
            return ResponseEntity.badRequest()
                .body(createErrorResponse("VALIDATION_ERROR", e.getMessage()));
                
        } catch (Exception e) {
            // Log error for debugging but don't expose internal details
            System.err.println("Unexpected error in createOrder: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
        }
    }
    
    /**
     * Get an existing order
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrder(@PathVariable String orderId) {
        try {
            // Step 1: Create query object
            GetOrderQuery query = new GetOrderQuery(orderId);
            
            // Step 2: Execute use case
            GetOrderResponse response = getOrderUseCase.execute(query);
            
            // Step 3: Return appropriate response
            if (response.isSuccessful()) {
                return ResponseEntity.ok(mapToOrderResponse(response));
            } else if ("ORDER_NOT_FOUND".equals(response.getErrorCode())) {
                return ResponseEntity.notFound().build();
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(response.getErrorCode(), response.getErrorMessage()));
            }
            
        } catch (Exception e) {
            System.err.println("Unexpected error in getOrder: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
        }
    }
    
    /**
     * Cancel an existing order
     */
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(@PathVariable String orderId) {
        try {
            // Step 1: Create command object
            CancelOrderCommand command = new CancelOrderCommand(orderId);
            
            // Step 2: Execute use case
            CancelOrderResponse response = cancelOrderUseCase.execute(command);
            
            // Step 3: Return appropriate response
            if (response.isSuccessful()) {
                return ResponseEntity.ok(mapToCancelResponse(response));
            } else {
                return ResponseEntity.status(getHttpStatusForError(response.getErrorCode()))
                    .body(mapToErrorResponse(response));
            }
            
        } catch (Exception e) {
            System.err.println("Unexpected error in cancelOrder: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
        }
    }
    
    /**
     * HTTP Input Validation
     * This is web-layer validation, not business validation
     */
    private void validateCreateOrderRequest(CreateOrderRequestDto request) {
        if (request.getCustomerId() == null || request.getCustomerId().trim().isEmpty()) {
            throw new ValidationException("Customer ID is required");
        }
        
        if (request.getCustomerEmail() == null || request.getCustomerEmail().trim().isEmpty()) {
            throw new ValidationException("Customer email is required");
        }
        
        if (!isValidEmail(request.getCustomerEmail())) {
            throw new ValidationException("Invalid email format");
        }
        
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ValidationException("Order must contain at least one item");
        }
        
        if (request.getPaymentToken() == null || request.getPaymentToken().trim().isEmpty()) {
            throw new ValidationException("Payment token is required");
        }
        
        if (request.getShippingAddress() == null) {
            throw new ValidationException("Shipping address is required");
        }
        
        validateShippingAddress(request.getShippingAddress());
        validateOrderItems(request.getItems());
    }
    
    private void validateShippingAddress(CreateOrderRequestDto.ShippingAddressDto address) {
        if (address.getStreet() == null || address.getStreet().trim().isEmpty()) {
            throw new ValidationException("Street address is required");
        }
        if (address.getCity() == null || address.getCity().trim().isEmpty()) {
            throw new ValidationException("City is required");
        }
        if (address.getState() == null || address.getState().trim().isEmpty()) {
            throw new ValidationException("State is required");
        }
        if (address.getZipCode() == null || address.getZipCode().trim().isEmpty()) {
            throw new ValidationException("ZIP code is required");
        }
    }
    
    private void validateOrderItems(List<CreateOrderRequestDto.OrderItemDto> items) {
        for (CreateOrderRequestDto.OrderItemDto item : items) {
            if (item.getProductId() == null || item.getProductId().trim().isEmpty()) {
                throw new ValidationException("Product ID is required for all items");
            }
            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new ValidationException("Quantity must be positive for all items");
            }
        }
    }
    
    private boolean isValidEmail(String email) {
        // Simple email validation - in real system would use proper validator
        return email.contains("@") && email.contains(".");
    }
    
    /**
     * Mapping between HTTP DTOs and Application Commands
     */
    private CreateOrderCommand mapToCreateOrderCommand(CreateOrderRequestDto request) {
        CreateOrderCommand.ShippingAddressCommand shippingAddress = 
            new CreateOrderCommand.ShippingAddressCommand(
                request.getShippingAddress().getStreet(),
                request.getShippingAddress().getCity(),
                request.getShippingAddress().getState(),
                request.getShippingAddress().getZipCode()
            );
        
        List<CreateOrderCommand.OrderItemCommand> items = request.getItems().stream()
            .map(item -> new CreateOrderCommand.OrderItemCommand(
                item.getProductId(),
                item.getQuantity()
            ))
            .collect(Collectors.toList());
        
        return new CreateOrderCommand(
            request.getCustomerId(),
            request.getCustomerEmail(),
            items,
            shippingAddress,
            request.getPaymentToken()
        );
    }
    
    /**
     * HTTP Response Mapping
     */
    private Map<String, Object> mapToSuccessResponse(CreateOrderResponse response) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("orderId", response.getOrderId());
        result.put("totalAmount", response.getTotalAmount());
        result.put("paymentId", response.getPaymentId());
        result.put("message", "Order created successfully");
        return result;
    }
    
    private Map<String, Object> mapToOrderResponse(GetOrderResponse response) {
        Map<String, Object> result = new HashMap<>();
        result.put("order", response.getOrder());
        return result;
    }
    
    private Map<String, Object> mapToCancelResponse(CancelOrderResponse response) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("orderId", response.getOrderId());
        result.put("message", "Order cancelled successfully");
        return result;
    }
    
    private Map<String, Object> mapToErrorResponse(CreateOrderResponse response) {
        return createErrorResponse(response.getErrorCode(), response.getErrorMessage());
    }
    
    private Map<String, Object> mapToErrorResponse(CancelOrderResponse response) {
        return createErrorResponse(response.getErrorCode(), response.getErrorMessage());
    }
    
    private Map<String, Object> createErrorResponse(String errorCode, String errorMessage) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("errorCode", errorCode);
        result.put("errorMessage", errorMessage);
        return result;
    }
    
    /**
     * Map application error codes to HTTP status codes
     */
    private HttpStatus getHttpStatusForError(String errorCode) {
        switch (errorCode) {
            case "VALIDATION_ERROR":
            case "INSUFFICIENT_INVENTORY":
                return HttpStatus.BAD_REQUEST;
            case "ORDER_NOT_FOUND":
                return HttpStatus.NOT_FOUND;
            case "PAYMENT_FAILED":
                return HttpStatus.PAYMENT_REQUIRED;
            case "ORDER_CANNOT_BE_CANCELLED":
                return HttpStatus.CONFLICT;
            default:
                return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }
}

/**
 * HTTP Data Transfer Objects (DTOs)
 * These represent the HTTP request/response format
 */
class CreateOrderRequestDto {
    private String customerId;
    private String customerEmail;
    private List<OrderItemDto> items;
    private ShippingAddressDto shippingAddress;
    private String paymentToken;
    
    // Getters and setters...
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public List<OrderItemDto> getItems() { return items; }
    public void setItems(List<OrderItemDto> items) { this.items = items; }
    public ShippingAddressDto getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(ShippingAddressDto shippingAddress) { this.shippingAddress = shippingAddress; }
    public String getPaymentToken() { return paymentToken; }
    public void setPaymentToken(String paymentToken) { this.paymentToken = paymentToken; }
    
    static class OrderItemDto {
        private String productId;
        private Integer quantity;
        
        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
    
    static class ShippingAddressDto {
        private String street;
        private String city;
        private String state;
        private String zipCode;
        
        public String getStreet() { return street; }
        public void setStreet(String street) { this.street = street; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public String getZipCode() { return zipCode; }
        public void setZipCode(String zipCode) { this.zipCode = zipCode; }
    }
}

/**
 * Validation Exception for HTTP layer
 */
class ValidationException extends RuntimeException {
    public ValidationException(String message) {
        super(message);
    }
}

/**
 * ✅ BENEFITS OF THIS APPROACH:
 * 
 * 1. SINGLE RESPONSIBILITY: Only handles HTTP concerns
 * 2. THIN CONTROLLER: No business logic, just coordination
 * 3. CLEAR SEPARATION: Web concerns separate from business logic
 * 4. TESTABLE: Can test HTTP handling separately from business logic
 * 5. FLEXIBLE: Can change HTTP format without affecting business logic
 * 6. ERROR HANDLING: Appropriate HTTP status codes for different error types
 * 7. VALIDATION: HTTP-level validation separate from business validation
 * 8. MAPPING: Clean separation between HTTP DTOs and application commands
 * 9. DEPENDENCY INVERSION: Depends on use case abstractions
 * 10. MAINTAINABLE: Changes to business logic don't affect HTTP handling
 * 
 * This controller is now a thin adapter between HTTP and the application layer.
 * All business logic is in use cases and domain entities where it belongs.
 */
