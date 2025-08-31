# 🌐 Boundaries and Integration - Daily Checklist

Use this checklist to ensure clean boundaries and robust integrations in your daily coding.

## 📚 **Quick Navigation**
- **[🔙 Back to Principle 7](./README.md)** - Boundaries and Integration
- **[👀 Study Examples](../../examples/before-after/boundaries-examples/README.md)**
- **[📝 Practice Exercises](../../exercises/principle-practice/07-boundaries/README.md)**

---

## 🔍 **Pre-Commit Boundary Checklist**

### **🛡️ Interface Design**
- [ ] **Domain-focused interfaces** - Do interfaces express business intent, not technical details?
- [ ] **Minimal surface area** - Do interfaces expose only what business logic needs?
- [ ] **No vendor leakage** - Are external library types hidden from business code?
- [ ] **Clear contracts** - Do interfaces clearly define expected behavior and error conditions?
- [ ] **Testable design** - Can business logic be tested without external dependencies?

### **🔌 Adapter Implementation**
- [ ] **Single responsibility** - Does each adapter handle one external service only?
- [ ] **Error translation** - Are external errors converted to domain exceptions?
- [ ] **Configuration isolation** - Are API keys and URLs contained within adapters?
- [ ] **Retry logic** - Do adapters handle transient failures appropriately?
- [ ] **Resource management** - Are connections and resources properly cleaned up?

### **🏗️ Dependency Management**
- [ ] **Dependency injection** - Are external services injected rather than instantiated?
- [ ] **Interface dependency** - Does business logic depend on interfaces, not implementations?
- [ ] **Factory pattern** - Are complex adapter setups handled in factories?
- [ ] **Configuration externalized** - Are service configurations in external files/environment?

### **⚡ Resilience Patterns**
- [ ] **Circuit breaker** - Are failing external services isolated to prevent cascade failures?
- [ ] **Timeout handling** - Do all external calls have appropriate timeouts?
- [ ] **Graceful degradation** - Does the system continue operating when non-critical services fail?
- [ ] **Fallback mechanisms** - Are there backup plans for critical external services?

---

## 📋 **Code Review Guidelines**

### **🚨 Red Flags to Watch For**

#### **Direct External Dependencies**
```javascript
// ❌ BAD: Business logic directly using external SDK
class OrderService {
  processOrder(order) {
    const stripe = new Stripe(apiKey);  // Direct dependency
    return stripe.charges.create({...}); // Vendor-specific API
  }
}
```

#### **Mixed Concerns**
```python
# ❌ BAD: Business logic mixed with database queries
def create_user(email, password):
    # Business validation
    if not email or '@' not in email:
        raise ValueError("Invalid email")
    
    # Direct database access - should be in repository
    cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", 
                   (email, hash_password(password)))
```

#### **Configuration in Business Logic**
```java
// ❌ BAD: External service configuration in business code
public class PaymentService {
    private static final String STRIPE_URL = "https://api.stripe.com/v1/charges";
    private static final String API_KEY = "sk_test_..."; // Hardcoded!
}
```

### **✅ Positive Patterns to Recognize**

#### **Clean Adapter Pattern**
```typescript
// ✅ GOOD: Clean interface with adapter implementation
interface PaymentService {
  processPayment(amount: number, token: string): Promise<PaymentResult>;
}

class StripePaymentAdapter implements PaymentService {
  constructor(private config: PaymentConfig) {}
  
  async processPayment(amount: number, token: string): Promise<PaymentResult> {
    // Stripe-specific implementation isolated here
  }
}
```

#### **Repository Pattern**
```csharp
// ✅ GOOD: Business logic depends on interface, not implementation
public class UserService 
{
    private readonly IUserRepository _userRepository;
    
    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }
    
    public async Task<User> CreateUser(string email, string password)
    {
        // Pure business logic - no database concerns
    }
}
```

---

## 🎯 **Integration Pattern Guidelines**

### **📤 Outbound Integrations (Calling External Services)**

#### **Required Elements:**
- [ ] **Interface definition** - Clear contract for business logic
- [ ] **Adapter implementation** - Handles external service specifics
- [ ] **Error handling** - Translates external errors to domain exceptions
- [ ] **Retry logic** - Handles transient failures
- [ ] **Circuit breaker** - Prevents cascade failures
- [ ] **Monitoring** - Tracks integration health and performance
- [ ] **Configuration** - Externalized service endpoints and credentials

#### **Example Structure:**
```
domain/
├── services/
│   └── PaymentService.ts (interface)
infrastructure/
├── adapters/
│   ├── StripePaymentAdapter.ts
│   ├── PayPalPaymentAdapter.ts
│   └── MockPaymentAdapter.ts (for testing)
└── config/
    └── PaymentConfig.ts
```

### **📥 Inbound Integrations (Data Access)**

#### **Required Elements:**
- [ ] **Repository interface** - Defines data access contract
- [ ] **Domain models** - Pure business objects
- [ ] **Mapping layer** - Converts between domain and persistence models
- [ ] **Transaction management** - Handles data consistency
- [ ] **Query optimization** - Efficient data access patterns

#### **Example Structure:**
```
domain/
├── models/
│   ├── User.ts
│   └── Order.ts
├── repositories/
│   ├── UserRepository.ts (interface)
│   └── OrderRepository.ts (interface)
infrastructure/
├── persistence/
│   ├── DatabaseUserRepository.ts
│   ├── CacheUserRepository.ts
│   └── mappers/
│       └── UserMapper.ts
```

---

## 🧪 **Testing Strategies**

### **Unit Testing Boundaries**

#### **Business Logic Tests:**
- [ ] **Mock all external dependencies** - Use test doubles for all adapters
- [ ] **Test pure business logic** - Focus on domain rules and validation
- [ ] **Verify interface interactions** - Ensure correct adapter method calls
- [ ] **Test error scenarios** - Verify proper handling of adapter failures

```typescript
// ✅ GOOD: Unit test with mocked dependencies
describe('OrderService', () => {
  let orderService: OrderService;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockInventoryService: jest.Mocked<InventoryService>;

  beforeEach(() => {
    mockPaymentService = createMockPaymentService();
    mockInventoryService = createMockInventoryService();
    orderService = new OrderService(mockPaymentService, mockInventoryService);
  });

  it('should process order when inventory available', async () => {
    // Test focuses on business logic, not external services
  });
});
```

#### **Integration Tests:**
- [ ] **Test adapter implementations** - Verify external service interactions
- [ ] **Use test environments** - Real services in isolated test environment
- [ ] **Test error scenarios** - Network failures, service downtime, etc.
- [ ] **Verify data mapping** - Ensure correct transformation between systems

### **Contract Testing:**
- [ ] **API contract tests** - Verify external service contracts haven't changed
- [ ] **Schema validation** - Ensure data formats remain compatible
- [ ] **Consumer-driven contracts** - Document and verify service expectations

---

## 🚨 **Anti-Pattern Detection**

### **Vendor Lock-in Smells:**
- [ ] External library types in domain models
- [ ] Vendor-specific error types in business logic
- [ ] Configuration strings scattered throughout code
- [ ] Business logic that knows about HTTP status codes, SQL, etc.

### **Tight Coupling Indicators:**
- [ ] Direct instantiation of external service clients
- [ ] Business methods that include connection management
- [ ] Exception handling that references specific external errors
- [ ] Tests that require real external services to run

### **Poor Abstraction Signs:**
- [ ] Interfaces that mirror external APIs exactly
- [ ] Domain models that match database schemas exactly
- [ ] Business logic that includes retry, circuit breaker logic
- [ ] Services that know about multiple external systems

---

## 📊 **Metrics and Monitoring**

### **Integration Health Metrics:**
- [ ] **Response times** - Track latency for each external service
- [ ] **Error rates** - Monitor failure rates and types
- [ ] **Circuit breaker states** - Track when services are degraded
- [ ] **Retry attempts** - Monitor transient failure patterns

### **Business Impact Tracking:**
- [ ] **Feature availability** - Track which features are affected by outages
- [ ] **Fallback usage** - Monitor when degraded mode is active
- [ ] **User experience** - Measure impact on customer workflows

---

## 🔧 **Quick Fixes for Common Issues**

### **Problem: Direct External API Calls**
**Solution:** Extract interface, create adapter
```javascript
// Before: Direct call
const result = await axios.post(url, data);

// After: Through adapter
const result = await this.httpService.post(endpoint, payload);
```

### **Problem: Mixed Business Logic and Data Access**
**Solution:** Extract repository pattern
```python
# Before: Mixed concerns
def create_user(email):
    if not valid_email(email):  # Business logic
        raise ValueError()
    db.execute("INSERT...")     # Data access

# After: Separated
def create_user(email):
    if not valid_email(email):
        raise ValueError()
    return self.user_repository.save(user)
```

### **Problem: Configuration Scattered**
**Solution:** Centralize in config objects
```typescript
// Before: Scattered
const apiKey = "sk_test_...";
const baseUrl = "https://api.stripe.com";

// After: Centralized
class PaymentConfig {
  constructor(
    public readonly apiKey: string,
    public readonly baseUrl: string
  ) {}
}
```

---

## 🎯 **Daily Application Tips**

1. **Before adding external dependency:** Design the interface first
2. **When writing business logic:** Ensure it has no external imports
3. **During code review:** Look for abstraction leaks
4. **When testing:** Mock all external boundaries
5. **Before deployment:** Verify resilience patterns are in place

---

**Remember:** Good boundaries make your system resilient to change, easy to test, and simple to understand. When in doubt, add more abstraction rather than less!

---

**[🔙 Back to Boundaries Principle](./README.md)** | **[👀 Study Examples](../../examples/before-after/boundaries-examples/README.md)** | **[📝 Practice Exercises](../../exercises/principle-practice/07-boundaries/README.md)**
