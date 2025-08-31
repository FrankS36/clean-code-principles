# 🌐 Boundaries and Integration - Practice Exercises

Master the art of managing external dependencies and creating clean system boundaries!

## 📚 **Quick Navigation**
- **[🔙 Back to Principle 7](../../../principles/07-boundaries/README.md)** - Boundaries and Integration
- **[👀 Study Examples](../../../examples/before-after/boundaries-examples/README.md)**
- **[📋 Daily Checklist](../../../principles/07-boundaries/checklist.md)**

---

## 🎯 **Learning Objectives**

By completing these exercises, you will:
- ✅ **Create clean adapter patterns** for external services
- ✅ **Design domain-focused interfaces** that hide implementation details
- ✅ **Implement repository patterns** for data access
- ✅ **Build resilient integration layers** with proper error handling
- ✅ **Master dependency injection** for flexible architectures

---

## 🏋️ **Exercise Progression**

### **📚 Beginner Level**

#### **Exercise 1: API Boundary Identification**
**Goal:** Learn to identify boundary violations in existing code

**Task:** Analyze the provided code samples and identify:
1. Direct external API calls in business logic
2. Vendor-specific code mixed with domain logic  
3. Hard-to-test external dependencies
4. Configuration scattered throughout code

**Files to Review:**
- `exercises/07-boundaries/01-boundary-analysis/tight-coupling-example.js`
- `exercises/07-boundaries/01-boundary-analysis/analysis-worksheet.md`

**Success Criteria:**
- [ ] Identified all 8+ boundary violations
- [ ] Explained why each violation is problematic
- [ ] Proposed clean boundary solutions

---

#### **Exercise 2: Simple Adapter Pattern**
**Goal:** Create your first adapter to wrap an external service

**Scenario:** You have a notification system that directly uses the Twilio SMS API. Create a clean adapter.

**Starting Code:**
```javascript
// Direct Twilio usage - needs adaptation
class OrderService {
  constructor() {
    this.twilio = require('twilio')(accountSid, authToken);
  }
  
  async notifyCustomer(phone, orderUpdate) {
    await this.twilio.messages.create({
      body: `Order update: ${orderUpdate}`,
      from: '+1234567890',
      to: phone
    });
  }
}
```

**Your Tasks:**
1. Create an `SMSService` interface
2. Implement `TwilioSMSAdapter` 
3. Refactor `OrderService` to use the interface
4. Add proper error handling
5. Make it testable with mocks

**Files to Create:**
- `exercises/07-boundaries/02-simple-adapter/sms-service.js`
- `exercises/07-boundaries/02-simple-adapter/twilio-adapter.js`
- `exercises/07-boundaries/02-simple-adapter/order-service.js`
- `exercises/07-boundaries/02-simple-adapter/tests/order-service.test.js`

---

### **🎯 Intermediate Level**

#### **Exercise 3: Repository Pattern Implementation**
**Goal:** Separate business logic from data access concerns

**Scenario:** Transform a user service that directly accesses a MongoDB database into a clean, testable architecture.

**Starting Point:**
```python
# Direct database access - needs repository pattern
class UserService:
    def __init__(self):
        self.db = pymongo.MongoClient()["myapp"]["users"]
    
    def create_user(self, email, password, profile_data):
        # Validation mixed with database operations
        if self.db.find_one({"email": email}):
            raise ValueError("Email exists")
        
        user_doc = {
            "_id": ObjectId(),
            "email": email,
            "password": bcrypt.hashpw(password.encode(), bcrypt.gensalt()),
            "profile": profile_data,
            "created_at": datetime.utcnow()
        }
        
        result = self.db.insert_one(user_doc)
        return str(result.inserted_id)
```

**Your Tasks:**
1. Design a `UserRepository` interface
2. Create domain models (`User`, `UserProfile`)
3. Implement `MongoUserRepository`
4. Refactor `UserService` for pure business logic
5. Add comprehensive unit tests
6. Create integration tests

**Success Criteria:**
- [ ] Business logic has zero database dependencies
- [ ] 100% unit test coverage without real database
- [ ] Repository can be swapped for different databases
- [ ] Domain models have behavior, not just data

---

#### **Exercise 4: Multi-Service Integration**
**Goal:** Coordinate multiple external services with clean boundaries

**Scenario:** Build an order processing system that integrates:
- Payment service (Stripe)
- Inventory service (REST API)
- Email service (SendGrid)
- Audit logging (CloudWatch)

**Requirements:**
1. Process payment only if inventory is available
2. Send confirmation email after successful payment
3. Log all events for audit purposes
4. Handle partial failures gracefully
5. Retry failed operations with backoff

**Architecture to Implement:**
```
OrderProcessor
├── PaymentService (interface)
│   └── StripePaymentAdapter
├── InventoryService (interface)  
│   └── RestInventoryAdapter
├── EmailService (interface)
│   └── SendGridEmailAdapter
└── AuditService (interface)
    └── CloudWatchAuditAdapter
```

**Your Tasks:**
1. Design clean interfaces for each service
2. Implement adapters for external systems
3. Create robust error handling strategy
4. Add retry logic with exponential backoff
5. Implement comprehensive logging
6. Create integration and unit tests

---

### **🚀 Advanced Level**

#### **Exercise 5: Anti-Corruption Layer**
**Goal:** Protect your domain from a messy legacy API

**Scenario:** You must integrate with a legacy inventory system that has:
- Inconsistent data formats (XML, JSON mixed)
- Non-standard error codes  
- Complex authentication flow
- Unreliable service availability

**Legacy API Example:**
```xml
<!-- Success response -->
<inventory_check>
  <status>OK</status>
  <product_id>ABC123</product_id>
  <qty_available units="each">45</qty_available>
  <last_updated>2023-10-15T14:30:00Z</last_updated>
</inventory_check>

<!-- Error response -->
<error>
  <code>PROD_NOT_FOUND</code>
  <msg>Product ABC123 not in system</msg>
</error>
```

**Your Tasks:**
1. Design a clean domain model for inventory
2. Create an anti-corruption layer that:
   - Translates XML to domain objects
   - Maps error codes to domain exceptions
   - Handles authentication complexity
   - Provides circuit breaker pattern
3. Implement caching for reliability
4. Add monitoring and alerting
5. Create comprehensive tests including failure scenarios

**Success Criteria:**
- [ ] Domain models never see XML or legacy concepts
- [ ] Business logic resilient to legacy API changes
- [ ] Circuit breaker prevents cascade failures
- [ ] Cache provides fallback for outages
- [ ] Monitoring alerts on integration issues

---

## 🎮 **Bonus Challenges**

### **Challenge 1: Event-Driven Boundaries**
Transform a synchronous integration into an event-driven architecture using:
- Domain events for decoupling
- Message queues for reliability
- Saga pattern for distributed transactions

### **Challenge 2: Multi-Tenant Boundaries**
Design boundaries that support multiple tenants with:
- Tenant-specific configurations
- Data isolation
- Service routing based on tenant

### **Challenge 3: Microservice Boundaries**
Split a monolithic service into microservices with:
- Clear service boundaries
- API gateway integration
- Inter-service communication patterns

---

## 📊 **Self-Assessment Checklist**

After completing each exercise, verify you can:

### **Understanding:**
- [ ] Explain the difference between adapters and facades
- [ ] Identify when to use repository vs gateway patterns
- [ ] Describe anti-corruption layer benefits

### **Implementation:**
- [ ] Create interfaces that hide external complexity
- [ ] Implement adapters without vendor lock-in
- [ ] Design error handling that doesn't leak implementation details

### **Testing:**
- [ ] Write unit tests that don't require external services
- [ ] Create integration tests for adapter implementations
- [ ] Mock external dependencies effectively

### **Architecture:**
- [ ] Design systems resilient to external service failures
- [ ] Implement proper separation of concerns
- [ ] Create maintainable integration layers

---

## 💡 **Tips for Success**

1. **Start Small:** Begin with simple adapters before complex anti-corruption layers
2. **Interface First:** Design your ideal interface, then adapt to it
3. **Think Domain:** Keep business concepts separate from technical implementations
4. **Test Everything:** Both unit tests (with mocks) and integration tests (with real services)
5. **Handle Failures:** Design for failure from the beginning

---

## 🚀 **Next Steps**

**Completed the exercises?** Great! Now you're ready to:

1. **[📋 Use the Daily Checklist](../../../principles/07-boundaries/checklist.md)** - Apply in your daily coding
2. **[🎯 Apply to Your Projects](../../../LEARNING_PATH.md#progress-tracking-and-assessment)** - Refactor existing integrations
3. **[📖 Continue Learning](../../../LEARNING_PATH.md)** - Move to advanced clean code topics

**Ready for more?** Check out the next principle in your learning path!

---

**[🔙 Back to Boundaries Principle](../../../principles/07-boundaries/README.md)** | **[👀 Study Examples](../../../examples/before-after/boundaries-examples/README.md)** | **[📋 Daily Checklist](../../../principles/07-boundaries/checklist.md)**
