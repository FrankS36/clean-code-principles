# Exercise 2: Parameter Design Challenges

Master the art of designing clean, intuitive function signatures that make your functions easy to use, understand, and maintain.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Design function parameters that are intuitive and minimal
- Apply parameter object patterns to reduce complexity
- Understand when to use dependency injection vs. direct dependencies
- Create function signatures that prevent common usage errors
- Practice parameter naming that reveals intent

## 📝 Exercise Format

Each problem presents functions with poorly designed parameters. Your job is to redesign the function signatures to be cleaner, more intuitive, and easier to use correctly.

---

## Problem 1: Configuration Overload

### Current Code (JavaScript)
```javascript
// ❌ Too many parameters, unclear order, mixed abstraction levels
function createUser(firstName, lastName, email, password, age, phone, 
                   street, city, state, zipCode, country, isEmailVerified, 
                   accountType, subscriptionLevel, referralCode, 
                   marketingOptIn, twoFactorEnabled, preferredLanguage) {
    
    // Validate inputs
    if (!firstName || firstName.length < 2) {
        throw new Error('First name must be at least 2 characters');
    }
    if (!lastName || lastName.length < 2) {
        throw new Error('Last name must be at least 2 characters');
    }
    if (!email || !isValidEmail(email)) {
        throw new Error('Valid email is required');
    }
    if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }
    
    // Create user object
    const user = {
        profile: {
            firstName,
            lastName,
            email,
            age,
            phone,
            preferredLanguage: preferredLanguage || 'en'
        },
        address: {
            street,
            city,
            state,
            zipCode,
            country: country || 'US'
        },
        account: {
            password: hashPassword(password),
            isEmailVerified: isEmailVerified || false,
            accountType: accountType || 'standard',
            subscriptionLevel: subscriptionLevel || 'free',
            referralCode,
            marketingOptIn: marketingOptIn || false,
            twoFactorEnabled: twoFactorEnabled || false,
            createdAt: new Date()
        }
    };
    
    return database.saveUser(user);
}

// Usage examples show the problem:
createUser('John', 'Doe', 'john@example.com', 'password123', 30, 
          '555-1234', '123 Main St', 'Anytown', 'CA', '12345', 'US', 
          false, 'premium', 'pro', 'REF123', true, true, 'en');

// Easy to make mistakes:
createUser('Jane', 'Smith', 'jane@example.com', 'password456', 25, 
          '555-5678', '456 Oak Ave', 'Somewhere', 'NY', '67890', 'US', 
          false, 'standard', 'basic', null, false, false); // Missing language parameter!
```

### Your Task
Redesign this function to use parameter objects and better organization.

### Requirements
- [ ] Group related parameters into logical objects
- [ ] Use default values appropriately
- [ ] Make required vs. optional parameters clear
- [ ] Ensure the function is hard to use incorrectly
- [ ] Consider using multiple functions for different use cases

### Focus Areas
- Parameter object design
- Required vs. optional parameter handling
- Logical grouping of related data
- Clear function signatures

---

## Problem 2: Boolean Parameter Trap

### Current Code (Python)
```python
# ❌ Boolean parameters make function calls unclear
def process_payment(amount, card_number, cvv, expiry_month, expiry_year, 
                   save_card, send_receipt, is_recurring, auto_retry, 
                   use_3d_secure, capture_immediately, send_notification):
    
    if save_card:
        # Save card for future use
        card_token = payment_service.save_card(card_number, cvv, expiry_month, expiry_year)
    else:
        card_token = None
    
    # Configure payment options
    payment_options = {
        'capture': capture_immediately,
        'retry': auto_retry,
        'secure_3d': use_3d_secure,
        'recurring': is_recurring
    }
    
    # Process the payment
    result = payment_service.charge(
        amount=amount,
        card_number=card_number if not card_token else None,
        card_token=card_token,
        options=payment_options
    )
    
    if result.success:
        if send_receipt:
            email_service.send_receipt(result.transaction_id, amount)
        
        if send_notification:
            notification_service.send_payment_confirmation(result.transaction_id)
        
        return result
    else:
        if auto_retry and result.retriable:
            # Retry payment
            return process_payment(amount, card_number, cvv, expiry_month, expiry_year,
                                 save_card, send_receipt, is_recurring, True, 
                                 use_3d_secure, capture_immediately, send_notification)
        
        return result

# Usage examples show the confusion:
# What do all these True/False values mean?
process_payment(100.00, '4111111111111111', '123', 12, 2025, 
               True, True, False, True, True, True, True)

# Easy to mix up the boolean parameters:
process_payment(50.00, '4000000000000002', '456', 6, 2024,
               False, True, True, False, False, True, True)  # Which boolean is which?
```

### Your Task
Eliminate boolean parameters and create a clearer API.

### Requirements
- [ ] Replace boolean parameters with more descriptive alternatives
- [ ] Use enums or constants where appropriate
- [ ] Group related options into configuration objects
- [ ] Make function calls self-documenting
- [ ] Consider splitting into multiple specialized functions

### Focus Areas
- Boolean parameter alternatives
- Configuration object design
- Self-documenting function calls
- Function specialization

---

## Problem 3: Dependency Injection Anti-patterns

### Current Code (Java)
```java
// ❌ Hidden dependencies and unclear parameter requirements
public class OrderService {
    
    public OrderResult processOrder(String customerId, List<OrderItem> items, 
                                   String shippingAddress, String billingAddress,
                                   String paymentMethod, boolean sendConfirmation,
                                   Database db, EmailService emailSvc, 
                                   PaymentGateway gateway, TaxService taxSvc,
                                   InventoryService invSvc, Logger log) {
        
        log.info("Processing order for customer: " + customerId);
        
        // Validate customer
        Customer customer = db.findCustomer(customerId);
        if (customer == null) {
            log.error("Customer not found: " + customerId);
            return OrderResult.failure("Customer not found");
        }
        
        // Calculate taxes
        BigDecimal taxAmount = taxSvc.calculateTax(items, shippingAddress);
        
        // Check inventory
        for (OrderItem item : items) {
            if (!invSvc.isAvailable(item.getProductId(), item.getQuantity())) {
                log.warn("Insufficient inventory for product: " + item.getProductId());
                return OrderResult.failure("Product unavailable: " + item.getProductId());
            }
        }
        
        // Calculate total
        BigDecimal subtotal = items.stream()
            .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal total = subtotal.add(taxAmount);
        
        // Process payment
        PaymentResult paymentResult = gateway.processPayment(
            customer.getId(), total, paymentMethod);
        
        if (!paymentResult.isSuccessful()) {
            log.error("Payment failed for customer: " + customerId);
            return OrderResult.failure("Payment failed: " + paymentResult.getErrorMessage());
        }
        
        // Update inventory
        for (OrderItem item : items) {
            invSvc.reserveProduct(item.getProductId(), item.getQuantity());
        }
        
        // Create order
        Order order = new Order(customerId, items, shippingAddress, 
                               billingAddress, subtotal, taxAmount, total);
        db.saveOrder(order);
        
        // Send confirmation
        if (sendConfirmation) {
            emailSvc.sendOrderConfirmation(customer.getEmail(), order);
        }
        
        log.info("Order processed successfully: " + order.getId());
        return OrderResult.success(order);
    }
}

// Usage shows the problem - too many dependencies to pass:
OrderService service = new OrderService();
OrderResult result = service.processOrder(
    "CUST123", 
    orderItems, 
    "123 Main St, City, State", 
    "456 Oak Ave, Town, State",
    "card_token_xyz",
    true,  // send confirmation
    database,
    emailService,
    paymentGateway,
    taxService,
    inventoryService,
    logger
);
```

### Your Task
Improve the dependency management and parameter design.

### Requirements
- [ ] Move dependencies out of method parameters
- [ ] Use constructor injection for services
- [ ] Group related parameters into value objects
- [ ] Separate data parameters from behavior parameters
- [ ] Make the function easier to test and use

### Focus Areas
- Constructor vs. method parameter injection
- Value object design for related data
- Separation of concerns in parameters
- Testability improvements

---

## Problem 4: Flag Parameter Anti-pattern

### Current Code (C#)
```csharp
// ❌ Flag parameters that change function behavior dramatically
public class ReportGenerator 
{
    public string GenerateReport(List<SalesData> data, string format, 
                                bool includeCharts, bool includeDetails, 
                                bool groupByProduct, bool groupByRegion,
                                bool sortAscending, bool includeSummary,
                                string dateFormat, bool useColors,
                                int maxRows, bool includeFooter)
    {
        var report = new StringBuilder();
        
        // Different behavior based on flags
        if (includeCharts && format == "HTML") {
            report.Append(GenerateChartSection(data, useColors));
        }
        
        // Conditional grouping logic
        if (groupByProduct && groupByRegion) {
            throw new ArgumentException("Cannot group by both product and region");
        }
        
        IEnumerable<SalesData> processedData = data;
        if (groupByProduct) {
            processedData = data.GroupBy(d => d.ProductId)
                               .Select(g => new SalesData { 
                                   ProductId = g.Key, 
                                   Revenue = g.Sum(x => x.Revenue) 
                               });
        } else if (groupByRegion) {
            processedData = data.GroupBy(d => d.Region)
                               .Select(g => new SalesData { 
                                   Region = g.Key, 
                                   Revenue = g.Sum(x => x.Revenue) 
                               });
        }
        
        // Conditional sorting
        if (sortAscending) {
            processedData = processedData.OrderBy(d => d.Revenue);
        } else {
            processedData = processedData.OrderByDescending(d => d.Revenue);
        }
        
        // Limit rows
        if (maxRows > 0) {
            processedData = processedData.Take(maxRows);
        }
        
        // Generate main content
        if (format == "HTML") {
            report.Append(GenerateHtmlReport(processedData, includeDetails, 
                                           dateFormat, useColors));
        } else if (format == "CSV") {
            report.Append(GenerateCsvReport(processedData, includeDetails, 
                                          dateFormat));
        } else {
            report.Append(GenerateTextReport(processedData, includeDetails, 
                                           dateFormat));
        }
        
        if (includeSummary) {
            report.Append(GenerateSummarySection(processedData, format));
        }
        
        if (includeFooter) {
            report.Append(GenerateFooterSection(format, DateTime.Now));
        }
        
        return report.ToString();
    }
}

// Usage is confusing and error-prone:
string htmlReport = generator.GenerateReport(salesData, "HTML", 
                                           true,   // include charts
                                           true,   // include details  
                                           true,   // group by product
                                           false,  // group by region
                                           false,  // sort ascending
                                           true,   // include summary
                                           "MM/dd/yyyy", // date format
                                           true,   // use colors
                                           100,    // max rows
                                           true);  // include footer
```

### Your Task
Replace flag parameters with better alternatives.

### Requirements
- [ ] Eliminate boolean flag parameters
- [ ] Create configuration objects for complex options
- [ ] Consider using the Strategy pattern for different behaviors
- [ ] Make function calls self-documenting
- [ ] Separate different types of report generation if needed

### Focus Areas
- Configuration object design
- Strategy pattern application
- Method extraction for different behaviors
- Self-documenting APIs

---

## Problem 5: Context Overload

### Current Code (Python)
```python
# ❌ Functions that need too much context information
def calculate_shipping_cost(weight, dimensions, origin_zip, destination_zip,
                          service_type, delivery_speed, insurance_amount,
                          signature_required, weekend_delivery, 
                          customer_type, customer_id, order_total,
                          shipping_discount_code, loyalty_level,
                          is_hazardous, is_fragile, packaging_type,
                          currency, exchange_rate, tax_exempt_number,
                          business_account, volume_discount_tier):
    
    # Base shipping calculation
    base_cost = shipping_rates[service_type][delivery_speed]
    
    # Weight-based calculation
    if weight > 50:
        base_cost += (weight - 50) * 0.50
    
    # Distance calculation
    distance = calculate_distance(origin_zip, destination_zip)
    distance_multiplier = 1.0 + (distance / 1000) * 0.1
    base_cost *= distance_multiplier
    
    # Service additions
    if signature_required:
        base_cost += 5.00
    if weekend_delivery:
        base_cost += 15.00
    if insurance_amount > 0:
        base_cost += insurance_amount * 0.01
    
    # Customer-specific adjustments
    if customer_type == 'premium':
        base_cost *= 0.9  # 10% discount
    elif customer_type == 'vip':
        base_cost *= 0.8  # 20% discount
    
    # Volume discounts
    if volume_discount_tier == 'bronze':
        base_cost *= 0.95
    elif volume_discount_tier == 'silver':
        base_cost *= 0.90
    elif volume_discount_tier == 'gold':
        base_cost *= 0.85
    
    # Order-based discounts
    if order_total > 100:
        base_cost *= 0.95
    if order_total > 500:
        base_cost *= 0.90
    
    # Apply discount codes
    if shipping_discount_code:
        discount = get_shipping_discount(shipping_discount_code, customer_id)
        base_cost = max(0, base_cost - discount)
    
    # Special handling fees
    if is_hazardous:
        base_cost += 25.00
    if is_fragile:
        base_cost += 10.00
    if packaging_type == 'custom':
        base_cost += 15.00
    
    # Tax calculations
    if not tax_exempt_number:
        shipping_tax = calculate_shipping_tax(base_cost, destination_zip)
        base_cost += shipping_tax
    
    # Currency conversion
    if currency != 'USD':
        base_cost *= exchange_rate
    
    return round(base_cost, 2)

# Function call is overwhelming:
cost = calculate_shipping_cost(
    weight=25.5,
    dimensions=(12, 8, 6),
    origin_zip='90210',
    destination_zip='10001',
    service_type='ground',
    delivery_speed='standard',
    insurance_amount=100.00,
    signature_required=True,
    weekend_delivery=False,
    customer_type='premium',
    customer_id='CUST123',
    order_total=250.00,
    shipping_discount_code='SHIP10',
    loyalty_level='gold',
    is_hazardous=False,
    is_fragile=True,
    packaging_type='standard',
    currency='USD',
    exchange_rate=1.0,
    tax_exempt_number=None,
    business_account=False,
    volume_discount_tier='silver'
)
```

### Your Task
Simplify this function by better parameter organization and reducing context requirements.

### Requirements
- [ ] Group related parameters into logical objects
- [ ] Extract business rules into separate functions
- [ ] Reduce the amount of context needed by the main function
- [ ] Use dependency injection for external data needs
- [ ] Create builder pattern for complex configuration

### Focus Areas
- Context object design
- Business rule extraction
- Builder pattern application
- Dependency management

---

## 🏆 Success Criteria

For each problem, your refactored solution should achieve:

### Parameter Design Quality
- **Minimal Parameters**: Functions have few, well-designed parameters
- **Logical Grouping**: Related parameters are grouped into objects
- **Clear Intent**: Parameter names and types reveal their purpose
- **Hard to Misuse**: Function signatures prevent common errors

### Usability Improvements
- **Self-Documenting Calls**: Function calls read like natural language
- **Type Safety**: Parameter types prevent runtime errors
- **Default Handling**: Sensible defaults reduce cognitive load
- **Consistent Patterns**: Similar functions use similar parameter patterns

### Maintainability Benefits
- **Easy Evolution**: Adding new parameters doesn't break existing code
- **Clear Dependencies**: Function dependencies are explicit and manageable
- **Testability**: Functions are easy to test with different parameter combinations
- **Reusability**: Functions can be reused in different contexts

---

## 💡 Parameter Design Patterns

### **1. Parameter Object Pattern**
```javascript
// Instead of many parameters:
function createUser(firstName, lastName, email, age, phone) { ... }

// Use parameter object:
function createUser(userProfile) {
    const { firstName, lastName, email, age, phone } = userProfile;
    // ...
}

// Usage becomes clearer:
createUser({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    age: 30,
    phone: '555-1234'
});
```

### **2. Configuration Object Pattern**
```javascript
// Instead of many boolean flags:
function processPayment(amount, retry, notify, save, secure) { ... }

// Use configuration object:
function processPayment(amount, options = {}) {
    const {
        autoRetry = false,
        sendNotification = true,
        saveCard = false,
        useSecure3D = true
    } = options;
    // ...
}

// Usage is self-documenting:
processPayment(100.00, {
    autoRetry: true,
    sendNotification: true,
    saveCard: false
});
```

### **3. Builder Pattern for Complex Configuration**
```javascript
class PaymentRequest {
    constructor(amount) {
        this.amount = amount;
        this.options = {};
    }
    
    withAutoRetry() {
        this.options.autoRetry = true;
        return this;
    }
    
    withNotification() {
        this.options.sendNotification = true;
        return this;
    }
    
    withCardSaving() {
        this.options.saveCard = true;
        return this;
    }
    
    build() {
        return { amount: this.amount, ...this.options };
    }
}

// Usage is fluent and clear:
const request = new PaymentRequest(100.00)
    .withAutoRetry()
    .withNotification()
    .build();
```

### **4. Method Specialization**
```javascript
// Instead of one function with many flags:
function generateReport(data, type, detailed, charts, summary) { ... }

// Create specialized methods:
function generateDetailedReport(data) { ... }
function generateSummaryReport(data) { ... }
function generateChartReport(data) { ... }
function generateFullReport(data) { ... }
```

### **5. Enum/Constant Pattern**
```javascript
// Instead of boolean parameters:
function sortData(data, ascending) { ... }

// Use descriptive constants:
const SortOrder = {
    ASCENDING: 'asc',
    DESCENDING: 'desc'
};

function sortData(data, sortOrder = SortOrder.ASCENDING) { ... }

// Usage is clearer:
sortData(myData, SortOrder.DESCENDING);
```

---

## 🔧 Common Parameter Problems & Solutions

### **Problem: Too Many Parameters**
```javascript
// ❌ Hard to remember parameter order
function createOrder(customerId, items, shipping, billing, payment, notes, priority, source) { ... }

// ✅ Group related parameters
function createOrder(orderRequest) {
    const { customer, items, addresses, payment, metadata } = orderRequest;
    // ...
}
```

### **Problem: Boolean Flags**
```javascript
// ❌ Unclear what booleans mean
processPayment(amount, true, false, true);

// ✅ Use descriptive objects
processPayment(amount, {
    autoRetry: true,
    saveCard: false,
    sendReceipt: true
});
```

### **Problem: Mixed Abstraction Levels**
```javascript
// ❌ Mixing high-level objects with primitives
function updateUser(user, firstName, lastName, addressObject, phone) { ... }

// ✅ Consistent abstraction level
function updateUser(userId, userUpdates) {
    const { profile, address, contactInfo } = userUpdates;
    // ...
}
```

### **Problem: Hidden Dependencies**
```javascript
// ❌ Dependencies passed as parameters
function processOrder(orderId, database, emailService, paymentGateway) { ... }

// ✅ Dependencies injected through constructor
class OrderProcessor {
    constructor(database, emailService, paymentGateway) {
        this.database = database;
        this.emailService = emailService;
        this.paymentGateway = paymentGateway;
    }
    
    processOrder(orderId) { ... }
}
```

---

## 🎯 Self-Assessment

After completing each problem, evaluate your solution:

### **Parameter Design (1-5 scale)**
- [ ] **Simplicity**: Are function signatures simple and intuitive?
- [ ] **Clarity**: Do parameter names clearly indicate their purpose?
- [ ] **Grouping**: Are related parameters logically grouped?
- [ ] **Safety**: Is it hard to use the function incorrectly?

### **Usability (1-5 scale)**
- [ ] **Self-Documentation**: Do function calls explain themselves?
- [ ] **Consistency**: Do similar functions use similar patterns?
- [ ] **Defaults**: Are sensible defaults provided where appropriate?
- [ ] **Flexibility**: Can the function handle different use cases cleanly?

**Target**: All scores should be 4 or 5. If any score is 3 or below, reconsider your parameter design.

---

## 🚀 Next Steps

Once you've completed all problems:

1. **Review the [solutions file](./exercise-2-solutions.md)** to see alternative approaches
2. **Apply to your current code** - Look for functions with poor parameter design
3. **Practice the patterns** - Use parameter objects and configuration patterns in your daily coding
4. **Move to [Exercise 3: Side Effect Management](./exercise-3-side-effects.md)** - Learn to separate pure functions from side effects

Remember: Good parameter design makes functions easier to use correctly and harder to use incorrectly. Invest time in designing intuitive function signatures - it pays dividends in code maintainability and developer experience!
