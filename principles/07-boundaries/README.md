# Principle 7: Boundaries and Integration

> *"Code at the boundaries needs clear separation of concerns."* - Robert C. Martin

## 🧭 **Navigation**
← **[Previous: Error Handling](../06-error-handling/README.md)** | **[Learning Path](../../LEARNING_PATH.md)** | **[Next: Unit Tests →](../08-unit-tests/README.md)**

**This Principle:** [Examples](../../examples/before-after/boundaries-examples/README.md) | [Exercises](../../exercises/principle-practice/07-boundaries/README.md) | [Checklist](./checklist.md)

## 🎯 Overview

Managing boundaries between your code and external systems is crucial for building maintainable, testable applications. Whether integrating with third-party APIs, databases, or frameworks, clean boundary management isolates your core business logic from external dependencies, making your system more resilient to change and easier to test.

## 📚 Core Guidelines

### 1. **Use Adapters for Third-Party Libraries**
Wrap external libraries behind your own interfaces to control their usage and protect against changes.

**❌ Bad (Direct Third-Party Usage):**
```java
// Direct dependency on Apache HttpClient throughout the codebase
public class OrderService {
    private HttpClient httpClient = HttpClientBuilder.create().build();
    
    public void notifyShipping(Order order) {
        HttpPost request = new HttpPost("https://shipping-api.com/notify");
        StringEntity entity = new StringEntity(order.toJson());
        request.setEntity(entity);
        request.setHeader("Content-Type", "application/json");
        
        try {
            HttpResponse response = httpClient.execute(request);
            if (response.getStatusLine().getStatusCode() != 200) {
                throw new ShippingException("Failed to notify shipping");
            }
        } catch (IOException e) {
            throw new ShippingException("Network error", e);
        }
    }
    
    public Customer getCustomerData(String customerId) {
        HttpGet request = new HttpGet("https://customer-api.com/customers/" + customerId);
        // More HttpClient-specific code scattered everywhere...
    }
}
```

**✅ Good (Adapter Pattern):**
```java
// Clean interface hiding implementation details
public interface HttpClient {
    HttpResponse post(String url, String body, Map<String, String> headers) throws NetworkException;
    HttpResponse get(String url, Map<String, String> headers) throws NetworkException;
}

// Adapter wrapping Apache HttpClient
public class ApacheHttpClientAdapter implements HttpClient {
    private final org.apache.http.client.HttpClient apacheClient;
    
    public ApacheHttpClientAdapter() {
        this.apacheClient = HttpClientBuilder.create().build();
    }
    
    @Override
    public HttpResponse post(String url, String body, Map<String, String> headers) throws NetworkException {
        try {
            HttpPost request = new HttpPost(url);
            request.setEntity(new StringEntity(body));
            headers.forEach(request::setHeader);
            
            org.apache.http.HttpResponse response = apacheClient.execute(request);
            return new HttpResponse(
                response.getStatusLine().getStatusCode(),
                EntityUtils.toString(response.getEntity())
            );
        } catch (IOException e) {
            throw new NetworkException("HTTP request failed", e);
        }
    }
    
    @Override
    public HttpResponse get(String url, Map<String, String> headers) throws NetworkException {
        // Similar implementation for GET requests
    }
}

// Clean service using the adapter
public class OrderService {
    private final HttpClient httpClient;
    private final ShippingApiConfig config;
    
    public OrderService(HttpClient httpClient, ShippingApiConfig config) {
        this.httpClient = httpClient;
        this.config = config;
    }
    
    public void notifyShipping(Order order) throws ShippingException {
        try {
            Map<String, String> headers = Map.of(
                "Content-Type", "application/json",
                "Authorization", "Bearer " + config.getApiKey()
            );
            
            HttpResponse response = httpClient.post(
                config.getShippingNotifyUrl(),
                order.toJson(),
                headers
            );
            
            if (!response.isSuccess()) {
                throw new ShippingException("Shipping notification failed: " + response.getBody());
            }
        } catch (NetworkException e) {
            throw new ShippingException("Failed to notify shipping service", e);
        }
    }
}
```

### 2. **Define Clear Integration Contracts**
Establish explicit contracts for external integrations using interfaces and data transfer objects.

**✅ Good Contract Design:**
```typescript
// Clear contract for payment processing
interface PaymentProcessor {
    processPayment(request: PaymentRequest): Promise<PaymentResult>;
    refundPayment(transactionId: string, amount: number): Promise<RefundResult>;
    getPaymentStatus(transactionId: string): Promise<PaymentStatus>;
}

// Data transfer objects with validation
interface PaymentRequest {
    readonly amount: number;
    readonly currency: string;
    readonly paymentMethod: PaymentMethod;
    readonly customerInfo: CustomerInfo;
    readonly merchantTransactionId: string;
}

interface PaymentResult {
    readonly success: boolean;
    readonly transactionId?: string;
    readonly errorCode?: string;
    readonly errorMessage?: string;
    readonly processingFee?: number;
}

// Multiple implementations for different providers
class StripePaymentProcessor implements PaymentProcessor {
    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        try {
            const stripeRequest = this.convertToStripeFormat(request);
            const stripeResponse = await this.stripeClient.charges.create(stripeRequest);
            return this.convertFromStripeFormat(stripeResponse);
        } catch (error) {
            return this.handleStripeError(error);
        }
    }
    
    private convertToStripeFormat(request: PaymentRequest): StripeChargeRequest {
        // Convert our format to Stripe's format
    }
    
    private convertFromStripeFormat(response: StripeCharge): PaymentResult {
        // Convert Stripe's format to our format
    }
}

class PayPalPaymentProcessor implements PaymentProcessor {
    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        // PayPal-specific implementation
    }
}
```

### 3. **Isolate External Dependencies**
Keep external dependencies at the edges of your system and prevent them from leaking into your core business logic.

**✅ Good Dependency Isolation:**
```python
# Core business logic with no external dependencies
class InventoryService:
    def __init__(self, inventory_repository: InventoryRepository, 
                 notification_service: NotificationService):
        self._repository = inventory_repository
        self._notifications = notification_service
    
    def reserve_items(self, items: List[InventoryItem]) -> ReservationResult:
        # Pure business logic - no external dependencies
        available_items = []
        unavailable_items = []
        
        for item in items:
            current_stock = self._repository.get_stock_level(item.product_id)
            if current_stock >= item.quantity:
                available_items.append(item)
            else:
                unavailable_items.append(item)
        
        if available_items:
            reservation_id = self._repository.create_reservation(available_items)
            self._notifications.send_reservation_confirmation(reservation_id)
        
        return ReservationResult(
            reservation_id=reservation_id if available_items else None,
            reserved_items=available_items,
            unavailable_items=unavailable_items
        )

# External dependencies isolated in adapters
class DatabaseInventoryRepository(InventoryRepository):
    def __init__(self, database_connection: DatabaseConnection):
        self._db = database_connection
    
    def get_stock_level(self, product_id: str) -> int:
        # Database-specific implementation
        query = "SELECT stock_level FROM inventory WHERE product_id = %s"
        result = self._db.execute_query(query, [product_id])
        return result[0]['stock_level'] if result else 0
    
    def create_reservation(self, items: List[InventoryItem]) -> str:
        # Database transaction handling
        with self._db.transaction():
            reservation_id = self._generate_reservation_id()
            for item in items:
                self._db.execute_update(
                    "UPDATE inventory SET reserved = reserved + %s WHERE product_id = %s",
                    [item.quantity, item.product_id]
                )
            return reservation_id

class EmailNotificationService(NotificationService):
    def __init__(self, email_client: EmailClient):
        self._email_client = email_client
    
    def send_reservation_confirmation(self, reservation_id: str) -> None:
        # Email-specific implementation
        message = self._build_confirmation_message(reservation_id)
        self._email_client.send_email(message)
```

### 4. **Use Anti-Corruption Layers**
Protect your domain model from external system concepts that don't belong in your business logic.

**✅ Good Anti-Corruption Layer:**
```csharp
// External system has different concepts and data structure
public class LegacyCustomerSystemAdapter 
{
    private readonly LegacyCustomerService _legacyService;
    
    public LegacyCustomerSystemAdapter(LegacyCustomerService legacyService)
    {
        _legacyService = legacyService;
    }
    
    public Customer GetCustomer(CustomerId customerId)
    {
        // Legacy system uses different data structure
        var legacyCustomer = _legacyService.GetCustomerRecord(customerId.Value);
        
        // Anti-corruption layer translates legacy concepts to our domain
        return new Customer(
            id: new CustomerId(legacyCustomer.CUST_ID),
            name: new CustomerName(
                firstName: legacyCustomer.FNAME, 
                lastName: legacyCustomer.LNAME
            ),
            email: new EmailAddress(legacyCustomer.EMAIL_ADDR),
            status: TranslateCustomerStatus(legacyCustomer.STATUS_CODE),
            addresses: TranslateAddresses(legacyCustomer.ADDR_LIST),
            loyaltyLevel: CalculateLoyaltyLevel(legacyCustomer.POINTS, legacyCustomer.YEARS)
        );
    }
    
    private CustomerStatus TranslateCustomerStatus(string statusCode)
    {
        // Translate legacy status codes to our domain concepts
        return statusCode switch
        {
            "A" => CustomerStatus.Active,
            "I" => CustomerStatus.Inactive,
            "S" => CustomerStatus.Suspended,
            "D" => CustomerStatus.Deleted,
            _ => CustomerStatus.Unknown
        };
    }
    
    private LoyaltyLevel CalculateLoyaltyLevel(int points, int years)
    {
        // Business logic to determine loyalty level from legacy data
        if (years >= 5 && points >= 10000) return LoyaltyLevel.Platinum;
        if (years >= 3 && points >= 5000) return LoyaltyLevel.Gold;
        if (years >= 1 && points >= 1000) return LoyaltyLevel.Silver;
        return LoyaltyLevel.Bronze;
    }
}
```

### 5. **Create Facade Interfaces**
Simplify complex external APIs by creating clean, focused interfaces that expose only what you need.

**✅ Good Facade Design:**
```java
// Complex external API with many methods and configurations
public class AmazonS3Facade implements FileStorage {
    private final AmazonS3 s3Client;
    private final String bucketName;
    private final String region;
    
    public AmazonS3Facade(AmazonS3Config config) {
        this.s3Client = AmazonS3ClientBuilder.standard()
            .withRegion(config.getRegion())
            .withCredentials(config.getCredentialsProvider())
            .build();
        this.bucketName = config.getBucketName();
        this.region = config.getRegion();
    }
    
    @Override
    public String uploadFile(String fileName, InputStream fileContent, String contentType) 
            throws FileStorageException {
        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(contentType);
            metadata.setServerSideEncryption(ObjectMetadata.AES_256_SERVER_SIDE_ENCRYPTION);
            
            String key = generateFileKey(fileName);
            PutObjectRequest request = new PutObjectRequest(bucketName, key, fileContent, metadata);
            s3Client.putObject(request);
            
            return generatePublicUrl(key);
        } catch (AmazonServiceException e) {
            throw new FileStorageException("Failed to upload file: " + fileName, e);
        }
    }
    
    @Override
    public InputStream downloadFile(String fileUrl) throws FileStorageException {
        try {
            String key = extractKeyFromUrl(fileUrl);
            S3Object object = s3Client.getObject(bucketName, key);
            return object.getObjectContent();
        } catch (AmazonServiceException e) {
            throw new FileStorageException("Failed to download file: " + fileUrl, e);
        }
    }
    
    @Override
    public void deleteFile(String fileUrl) throws FileStorageException {
        try {
            String key = extractKeyFromUrl(fileUrl);
            s3Client.deleteObject(bucketName, key);
        } catch (AmazonServiceException e) {
            throw new FileStorageException("Failed to delete file: " + fileUrl, e);
        }
    }
    
    // Private methods hide S3-specific complexity
    private String generateFileKey(String fileName) {
        return "uploads/" + UUID.randomUUID() + "/" + fileName;
    }
    
    private String generatePublicUrl(String key) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }
    
    private String extractKeyFromUrl(String url) {
        // Extract S3 key from public URL
        return url.substring(url.indexOf(".com/") + 5);
    }
}

// Simple interface exposed to the rest of the application
public interface FileStorage {
    String uploadFile(String fileName, InputStream fileContent, String contentType) 
        throws FileStorageException;
    InputStream downloadFile(String fileUrl) throws FileStorageException;
    void deleteFile(String fileUrl) throws FileStorageException;
}
```

### 6. **Handle External System Failures Gracefully**
Design for failure when dealing with external systems - they will fail, and your system should continue functioning.

**✅ Good Failure Handling:**
```typescript
class ResilientExternalServiceClient {
    private circuitBreaker: CircuitBreaker;
    private cache: CacheService;
    private fallbackService: FallbackService;
    
    constructor(
        private httpClient: HttpClient,
        private config: ServiceConfig
    ) {
        this.circuitBreaker = new CircuitBreaker({
            failureThreshold: 5,
            recoveryTimeout: 60000
        });
        this.cache = new CacheService();
        this.fallbackService = new FallbackService();
    }
    
    async getUserProfile(userId: string): Promise<UserProfile> {
        // Try cache first
        const cached = await this.cache.get(`user:${userId}`);
        if (cached) {
            return cached;
        }
        
        try {
            // Try external service with circuit breaker
            const result = await this.circuitBreaker.execute(async () => {
                const response = await this.httpClient.get(
                    `${this.config.baseUrl}/users/${userId}`,
                    { timeout: 5000 }
                );
                
                if (!response.isSuccess()) {
                    throw new ExternalServiceError(
                        `User service returned ${response.status}`,
                        response.status
                    );
                }
                
                return this.parseUserProfile(response.body);
            });
            
            // Cache successful result
            await this.cache.set(`user:${userId}`, result, 300);
            return result;
            
        } catch (error) {
            // Circuit breaker is open or service failed
            if (error instanceof CircuitBreakerOpenError) {
                console.warn(`User service circuit breaker open for user ${userId}`);
            } else {
                console.error(`User service error for user ${userId}:`, error);
            }
            
            // Try fallback service
            try {
                const fallbackResult = await this.fallbackService.getUserProfile(userId);
                if (fallbackResult) {
                    return { ...fallbackResult, degraded: true };
                }
            } catch (fallbackError) {
                console.error(`Fallback service also failed for user ${userId}:`, fallbackError);
            }
            
            // Return minimal user profile as last resort
            return this.createMinimalUserProfile(userId);
        }
    }
    
    private createMinimalUserProfile(userId: string): UserProfile {
        return {
            id: userId,
            name: 'Unknown User',
            email: '',
            degraded: true,
            available: false
        };
    }
    
    private parseUserProfile(responseBody: string): UserProfile {
        // Parse and validate external service response
        const data = JSON.parse(responseBody);
        return {
            id: data.id,
            name: data.full_name || data.name,
            email: data.email_address || data.email,
            avatar: data.profile_image_url,
            degraded: false,
            available: true
        };
    }
}
```

### 7. **Test Boundaries with Mocks and Stubs**
Create comprehensive tests for boundary integrations using mocks, stubs, and contract tests.

**✅ Good Boundary Testing:**
```python
# Contract tests to verify external service behavior
class PaymentServiceContractTest(unittest.TestCase):
    def setUp(self):
        self.payment_service = PaymentService(base_url=TEST_BASE_URL)
    
    def test_successful_payment_processing(self):
        """Test that payment service returns expected response format"""
        request = PaymentRequest(
            amount=100.00,
            currency='USD',
            payment_method=PaymentMethod.CREDIT_CARD,
            card_token='test_token_123'
        )
        
        result = self.payment_service.process_payment(request)
        
        # Verify contract - response should have these fields
        self.assertIsInstance(result, PaymentResult)
        self.assertIsInstance(result.transaction_id, str)
        self.assertIsInstance(result.success, bool)
        self.assertIn(result.status, ['approved', 'declined', 'pending'])
    
    def test_payment_service_error_handling(self):
        """Test that service handles errors appropriately"""
        invalid_request = PaymentRequest(
            amount=-100.00,  # Invalid amount
            currency='INVALID',
            payment_method=PaymentMethod.CREDIT_CARD,
            card_token='invalid_token'
        )
        
        with self.assertRaises(PaymentValidationError):
            self.payment_service.process_payment(invalid_request)

# Unit tests with mocks for business logic
class OrderProcessorTest(unittest.TestCase):
    def setUp(self):
        self.mock_payment_service = Mock(spec=PaymentService)
        self.mock_inventory_service = Mock(spec=InventoryService)
        self.mock_notification_service = Mock(spec=NotificationService)
        
        self.order_processor = OrderProcessor(
            payment_service=self.mock_payment_service,
            inventory_service=self.mock_inventory_service,
            notification_service=self.mock_notification_service
        )
    
    def test_successful_order_processing(self):
        """Test complete order processing flow with mocked services"""
        # Setup mocks
        self.mock_inventory_service.reserve_items.return_value = ReservationResult(
            reservation_id='res_123',
            success=True
        )
        self.mock_payment_service.process_payment.return_value = PaymentResult(
            transaction_id='txn_456',
            success=True,
            status='approved'
        )
        
        # Execute
        order = Order(items=[OrderItem('product_1', 2, 50.00)])
        result = self.order_processor.process_order(order)
        
        # Verify
        self.assertTrue(result.success)
        self.mock_inventory_service.reserve_items.assert_called_once()
        self.mock_payment_service.process_payment.assert_called_once()
        self.mock_notification_service.send_order_confirmation.assert_called_once()
    
    def test_payment_failure_releases_inventory(self):
        """Test that inventory is released when payment fails"""
        # Setup mocks
        self.mock_inventory_service.reserve_items.return_value = ReservationResult(
            reservation_id='res_123',
            success=True
        )
        self.mock_payment_service.process_payment.side_effect = PaymentDeclinedException(
            "Card declined"
        )
        
        # Execute
        order = Order(items=[OrderItem('product_1', 2, 50.00)])
        result = self.order_processor.process_order(order)
        
        # Verify compensation logic
        self.assertFalse(result.success)
        self.mock_inventory_service.release_reservation.assert_called_once_with('res_123')
```

## 🎨 Boundary Patterns

### 1. **Repository Pattern**
Isolate data access logic behind clean interfaces.

```java
public interface CustomerRepository {
    Optional<Customer> findById(CustomerId id);
    List<Customer> findByEmail(EmailAddress email);
    void save(Customer customer);
    void delete(CustomerId id);
}

public class JpaCustomerRepository implements CustomerRepository {
    private final EntityManager entityManager;
    
    @Override
    public Optional<Customer> findById(CustomerId id) {
        CustomerEntity entity = entityManager.find(CustomerEntity.class, id.getValue());
        return entity != null ? Optional.of(toDomainModel(entity)) : Optional.empty();
    }
    
    private Customer toDomainModel(CustomerEntity entity) {
        // Convert JPA entity to domain model
    }
    
    private CustomerEntity toEntity(Customer customer) {
        // Convert domain model to JPA entity
    }
}
```

### 2. **Gateway Pattern**
Create gateways for external service communication.

```csharp
public interface INotificationGateway
{
    Task SendEmailAsync(EmailMessage message);
    Task SendSmsAsync(SmsMessage message);
    Task SendPushNotificationAsync(PushMessage message);
}

public class TwilioNotificationGateway : INotificationGateway
{
    private readonly TwilioRestClient _client;
    private readonly IConfiguration _config;
    
    public async Task SendSmsAsync(SmsMessage message)
    {
        try
        {
            var messageOptions = new CreateMessageOptions(
                new PhoneNumber(message.ToPhoneNumber))
            {
                From = new PhoneNumber(_config["Twilio:FromNumber"]),
                Body = message.Content
            };
            
            await MessageResource.CreateAsync(messageOptions, _client);
        }
        catch (TwilioException ex)
        {
            throw new NotificationException("Failed to send SMS", ex);
        }
    }
}
```

### 3. **Event-Driven Integration**
Use events to loosely couple systems.

```python
class OrderEventPublisher:
    def __init__(self, event_bus: EventBus):
        self._event_bus = event_bus
    
    def publish_order_placed(self, order: Order) -> None:
        event = OrderPlacedEvent(
            order_id=order.id,
            customer_id=order.customer_id,
            total_amount=order.total_amount,
            items=[OrderItemEvent.from_order_item(item) for item in order.items],
            timestamp=datetime.utcnow()
        )
        self._event_bus.publish(event)

# External systems subscribe to events
class InventoryEventHandler:
    def handle_order_placed(self, event: OrderPlacedEvent) -> None:
        # Update inventory levels
        for item in event.items:
            self.inventory_service.reduce_stock(item.product_id, item.quantity)

class ShippingEventHandler:
    def handle_order_placed(self, event: OrderPlacedEvent) -> None:
        # Create shipping label
        shipping_request = ShippingRequest.from_order_event(event)
        self.shipping_service.create_shipment(shipping_request)
```

## 🛠️ Integration Testing Strategies

### 1. **Contract Testing**
Verify that your integrations match the expected contracts.

```python
@pytest.mark.contract
class PaymentServiceContractTest:
    def test_payment_request_contract(self):
        """Verify payment service accepts our request format"""
        client = PaymentServiceClient()
        
        request = {
            "amount": 100.00,
            "currency": "USD",
            "payment_method": {
                "type": "credit_card",
                "token": "test_token"
            }
        }
        
        # This should not raise validation errors
        response = client.validate_request(request)
        assert response.is_valid
    
    def test_payment_response_contract(self):
        """Verify payment service returns expected response format"""
        client = PaymentServiceClient()
        
        mock_response = {
            "transaction_id": "txn_123",
            "status": "approved",
            "amount_charged": 100.00,
            "processing_fee": 2.50
        }
        
        # Our parser should handle this format
        result = client.parse_response(mock_response)
        assert isinstance(result, PaymentResult)
        assert result.transaction_id == "txn_123"
```

### 2. **Integration Test Doubles**
Use test doubles that behave like real external services.

```java
@TestConfiguration
public class TestExternalServicesConfig {
    
    @Bean
    @Primary
    public PaymentService mockPaymentService() {
        PaymentService mock = Mockito.mock(PaymentService.class);
        
        // Configure realistic behavior
        when(mock.processPayment(any(PaymentRequest.class)))
            .thenAnswer(invocation -> {
                PaymentRequest request = invocation.getArgument(0);
                
                // Simulate different responses based on test data
                if (request.getCardToken().equals("declined_card")) {
                    throw new PaymentDeclinedException("Card declined");
                }
                if (request.getAmount().compareTo(BigDecimal.valueOf(10000)) > 0) {
                    throw new PaymentLimitExceededException("Amount too large");
                }
                
                return PaymentResult.success("txn_" + UUID.randomUUID());
            });
            
        return mock;
    }
}
```

## ⚠️ Common Boundary Anti-Patterns

### 1. **Leaky Abstractions**
```javascript
// ❌ BAD - Database concepts leak into business logic
class UserService {
    async getUser(id) {
        const result = await db.query(
            'SELECT u.*, p.name as profile_name FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.id = ?',
            [id]
        );
        return result[0]; // Raw database row returned
    }
}

// ✅ GOOD - Clean abstraction
class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    
    async getUser(id) {
        return await this.userRepository.findById(id);
    }
}
```

### 2. **God Interfaces**
```python
# ❌ BAD - Massive interface with everything
class ExternalApiClient:
    def get_user_data(self, user_id): pass
    def update_user_profile(self, user_id, data): pass
    def get_product_catalog(self): pass
    def search_products(self, query): pass
    def process_payment(self, payment_data): pass
    def refund_payment(self, transaction_id): pass
    def send_email(self, recipient, subject, body): pass
    def upload_file(self, file_data): pass
    # ... 50+ more methods

# ✅ GOOD - Focused interfaces
class UserApiClient:
    def get_user_data(self, user_id): pass
    def update_user_profile(self, user_id, data): pass

class ProductApiClient:
    def get_product_catalog(self): pass
    def search_products(self, query): pass

class PaymentApiClient:
    def process_payment(self, payment_data): pass
    def refund_payment(self, transaction_id): pass
```

### 3. **Tight Coupling to External Formats**
```java
// ❌ BAD - Business logic depends on external JSON format
public class OrderProcessor {
    public void processOrder(String externalOrderJson) {
        JSONObject json = new JSONObject(externalOrderJson);
        
        // Business logic tightly coupled to external format
        String customerId = json.getJSONObject("customer").getString("id");
        JSONArray items = json.getJSONArray("line_items");
        
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.getJSONObject(i);
            String sku = item.getString("product_sku");
            int quantity = item.getInt("qty");
            // Business logic mixed with parsing...
        }
    }
}

// ✅ GOOD - Translation at boundary, clean business logic
public class OrderProcessor {
    private final ExternalOrderTranslator translator;
    
    public void processOrder(String externalOrderJson) {
        Order order = translator.translate(externalOrderJson);
        processOrder(order); // Clean business logic with domain objects
    }
    
    private void processOrder(Order order) {
        // Pure business logic with no external dependencies
        validateOrder(order);
        reserveInventory(order.getItems());
        processPayment(order.getPayment());
        scheduleShipping(order);
    }
}
```

## 🎯 Key Takeaways

1. **Wrap third-party libraries** behind your own interfaces to protect against changes
2. **Define clear contracts** for external integrations using interfaces and DTOs
3. **Isolate external dependencies** at the edges of your system
4. **Use anti-corruption layers** to protect your domain model
5. **Create facade interfaces** to simplify complex external APIs
6. **Design for failure** when dealing with external systems
7. **Test boundaries comprehensively** with mocks, stubs, and contract tests
8. **Keep business logic pure** by preventing external concerns from leaking in

## 🔄 Refactoring Techniques

### From Tight Coupling to Clean Boundaries
1. **Identify direct external dependencies** in business logic
2. **Create interface abstractions** for external services
3. **Implement adapter pattern** to wrap third-party libraries
4. **Extract translation logic** to boundary components
5. **Add comprehensive boundary testing**

### From Leaky Abstractions to Clean Interfaces
1. **Analyze what external concepts** are leaking into your domain
2. **Design domain-focused interfaces** that hide implementation details
3. **Create translation layers** at system boundaries
4. **Implement anti-corruption patterns** for legacy systems
5. **Validate that business logic** has no external dependencies

---

## 🚀 **Next Steps**

**You've completed Principle 7: Boundaries and Integration! 🎉**

### **Immediate Next Actions:**
1. **[📝 Practice with Exercises →](../../exercises/principle-practice/07-boundaries/README.md)** - Master boundary patterns and integration
2. **[📋 Use the Daily Checklist](./checklist.md)** - Apply boundary management best practices  
3. **[👀 Study the Examples](../../examples/before-after/boundaries-examples/README.md)** - See clean integration patterns

### **Continue Your Learning Journey:**
- **[📖 Next: Principle 8 - Unit Tests →](../08-unit-tests/README.md)** - Learn clean testing practices *(coming soon)*
- **[📚 Back to Learning Path](../../LEARNING_PATH.md)** - Continue your clean code mastery
- **[🎯 Apply to Your Code](../../LEARNING_PATH.md#progress-tracking-and-assessment)** - Improve your external integrations

**Ready for advanced topics?** Continue building production-ready skills! **[Back to Learning Path →](../../LEARNING_PATH.md)**

---

Remember: Good boundary management makes your system resilient to external changes, easier to test, and simpler to understand!
