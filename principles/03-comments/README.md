# Principle 3: Comments

> *"Don't comment bad code—rewrite it."* - Brian Kernighan and P.J. Plauger

## 🧭 **Navigation**
← **[Previous: Functions](../02-functions/README.md)** | **[Learning Path](../../LEARNING_PATH.md)** | **[Next: Formatting →](../04-formatting/README.md)**

**This Principle:** [Examples](../../examples/before-after/comment-examples/README.md) | [Exercises](../../exercises/principle-practice/03-comments/README.md) | [Checklist](./checklist.md)

## 🎯 Learning Objectives

By the end of this section, you will:
- Understand when comments help vs. when they hurt code quality
- Write self-documenting code that rarely needs comments
- Know when and how to write valuable comments
- Avoid common comment pitfalls and anti-patterns
- Maintain comments effectively as code evolves
- Choose between comments and code improvements

## 💡 The Truth About Comments

**The Controversial Truth**: Comments are often a sign of failure to express yourself clearly in code.

**The Goal**: Write code so clear that comments are rarely necessary.

**When Comments Help**:
- ✅ Explaining the "why" behind decisions
- ✅ Warning about consequences
- ✅ Clarifying complex business rules
- ✅ Legal/copyright requirements
- ✅ TODOs for future improvements

**When Comments Hurt**:
- ❌ Explaining what the code obviously does
- ❌ Misleading or outdated information
- ❌ Noise that clutters the code
- ❌ Compensating for poor naming
- ❌ Commenting out old code

---

## 📚 Core Guidelines

### 1. Comments Don't Make Up for Bad Code

If you feel compelled to write a comment, first try to improve the code itself.

**❌ Bad - Comment Explains Confusing Code:**
```javascript
// Check to see if the employee is eligible for full benefits
if ((employee.flags & HOURLY_FLAG) && (employee.age > 65)) {
    // Employee is hourly and over 65
    return true;
}
```

**✅ Good - Self-Documenting Code:**
```javascript
function isEligibleForFullBenefits(employee) {
    return isHourlyEmployee(employee) && isOver65(employee);
}

function isHourlyEmployee(employee) {
    return employee.flags & HOURLY_FLAG;
}

function isOver65(employee) {
    return employee.age > 65;
}

// Usage is clear without comments
if (isEligibleForFullBenefits(employee)) {
    return true;
}
```

### 2. Explain WHY, Not WHAT

Code should be self-explanatory about what it does. Comments should explain why you chose this approach.

**❌ Bad - Explains What (Obvious):**
```python
# Increment i by 1
i += 1

# Create a new user object
user = User()

# Loop through all items
for item in items:
    # Set the item status to active
    item.status = 'active'
```

**✅ Good - Explains Why (Valuable):**
```python
# Use exponential backoff to avoid overwhelming the external API
sleep_time = base_delay * (2 ** attempt_count)
time.sleep(sleep_time)

# Cache for 24 hours because product data changes once daily at midnight
cache.set(product_key, product_data, expire_seconds=86400)

# Start from index 1 because index 0 contains headers
for i in range(1, len(csv_rows)):
    process_row(csv_rows[i])
```

### 3. Don't Be Redundant

Avoid comments that simply restate what the code clearly expresses.

**❌ Bad - Redundant Comments:**
```java
public class User {
    private String name;  // The user's name
    private int age;      // The user's age
    private boolean active;  // Whether the user is active
    
    // Default constructor
    public User() {
    }
    
    // Getter for name
    public String getName() {
        return name;
    }
    
    // Setter for name
    public void setName(String name) {
        this.name = name;
    }
}
```

**✅ Good - Comments Only Where They Add Value:**
```java
public class User {
    private String name;
    private int age;
    private boolean active;  // Active users can log in; inactive users cannot
    
    public User() {
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    // Deactivating a user logs them out of all sessions immediately
    public void deactivate() {
        this.active = false;
        sessionManager.terminateAllSessions(this.id);
    }
}
```

### 4. Don't Comment Out Code

Version control systems exist for a reason. Delete dead code instead of commenting it out.

**❌ Bad - Commented Out Code:**
```javascript
function calculatePrice(items) {
    let total = 0;
    
    // Old pricing logic - keeping just in case
    // for (let item of items) {
    //     total += item.price * item.quantity;
    //     if (item.category === 'premium') {
    //         total *= 1.2;
    //     }
    // }
    
    // New pricing logic with discounts
    for (let item of items) {
        let itemTotal = item.price * item.quantity;
        itemTotal *= (1 - item.discount);
        total += itemTotal;
    }
    
    // TODO: Apply bulk discounts
    // if (total > 100) {
    //     total *= 0.9;
    // }
    
    return total;
}
```

**✅ Good - Clean Code with Proper TODOs:**
```javascript
function calculatePrice(items) {
    let total = 0;
    
    for (let item of items) {
        let itemTotal = item.price * item.quantity;
        itemTotal *= (1 - item.discount);
        total += itemTotal;
    }
    
    // TODO: Implement bulk discounts (ticket #1234)
    // Business rule: 10% discount for orders over $100
    
    return total;
}
```

### 5. Use Comments to Warn About Consequences

When code has important side effects or performance implications, warn future developers.

**✅ Good - Warning Comments:**
```python
def process_large_dataset(data):
    # WARNING: This function loads the entire dataset into memory
    # Use process_large_dataset_streaming() for files > 1GB
    return [transform_record(record) for record in data]

def clear_cache():
    # WARNING: This will impact performance for the next 5-10 minutes
    # as the cache rebuilds. Only call during maintenance windows.
    redis_client.flushall()

def calculate_fibonacci(n):
    # WARNING: Exponential time complexity O(2^n)
    # Use calculate_fibonacci_memoized() for n > 30
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)
```

### 6. TODO Comments

TODOs are acceptable if they describe what should be done and why it's not done now.

**❌ Bad TODOs:**
```javascript
// TODO: Fix this
function processData(data) {
    // TODO: Make this better
    return data.map(item => {
        // TODO: Optimize
        return item.value * 2;
    });
}
```

**✅ Good TODOs:**
```javascript
// TODO: Implement caching to improve performance (ticket #456)
// Current implementation acceptable for < 1000 items
function processData(data) {
    return data.map(item => transformItem(item));
}

// TODO: Add input validation once we decide on validation library
// See architecture decision record ADR-023
function createUser(userData) {
    return new User(userData);
}

// TODO: Refactor to use async/await after Node.js upgrade to v16
// Current callback style needed for Node.js v12 compatibility
function fetchUserData(userId, callback) {
    database.query('SELECT * FROM users WHERE id = ?', [userId], callback);
}
```

### 7. Amplify Important Information

Sometimes you need to emphasize something that might not be obvious.

**✅ Good - Amplification Comments:**
```java
// This trim is critical - spaces in the key will cause cache misses
String cacheKey = userInput.trim();

// Match exactly "2023-12-31" format - other formats will be rejected by API
String dateString = formatDate(date, "yyyy-MM-dd");

// Case sensitive comparison required by OAuth 2.0 specification
if (TOKEN_TYPE.equals(tokenType)) {
    // Process token...
}

// Retry count of 3 is the maximum allowed by the payment gateway
// Exceeding this will result in account suspension
final int MAX_RETRIES = 3;
```

### 8. Legal Comments

Sometimes you legally must include copyright, license, or authorship information.

**✅ Acceptable Legal Comments:**
```java
/*
 * Copyright (c) 2023 YourCompany Inc.
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license information.
 */

/**
 * This algorithm is based on the approach described in:
 * "Efficient Data Structures" by Johnson et al. (2019)
 * Used with permission under academic license agreement #2023-456
 */
public class OptimizedHashTable {
    // Implementation...
}
```

---

## 🎯 When Comments Are Valuable

### 1. Complex Business Rules

When business logic is inherently complex, comments can clarify the domain rules.

```python
def calculate_overtime_pay(employee, hours_worked):
    regular_hours = min(hours_worked, 40)
    overtime_hours = max(0, hours_worked - 40)
    
    # California law: overtime is 1.5x for hours 40-50, 2x for hours > 50
    moderate_overtime = min(overtime_hours, 10)  # Hours 41-50
    extreme_overtime = max(0, overtime_hours - 10)  # Hours 51+
    
    regular_pay = regular_hours * employee.hourly_rate
    moderate_overtime_pay = moderate_overtime * employee.hourly_rate * 1.5
    extreme_overtime_pay = extreme_overtime * employee.hourly_rate * 2.0
    
    return regular_pay + moderate_overtime_pay + extreme_overtime_pay
```

### 2. Non-Obvious Algorithms

When using a specific algorithm, explain why you chose it.

```javascript
// Using Fisher-Yates shuffle for unbiased random distribution
// Math.random() alone would create bias toward certain positions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Binary search requires sorted array - O(log n) vs O(n) for linear search
function findUser(sortedUsers, targetId) {
    let left = 0;
    let right = sortedUsers.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (sortedUsers[mid].id === targetId) {
            return sortedUsers[mid];
        }
        if (sortedUsers[mid].id < targetId) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return null;
}
```

### 3. External Dependencies and Workarounds

When working around limitations or bugs in external systems.

```python
def save_user_avatar(user_id, image_data):
    # Workaround for S3 bug where uploads > 5MB fail intermittently
    # Split large images into chunks - remove when AWS fixes issue
    if len(image_data) > 5 * 1024 * 1024:
        return save_avatar_in_chunks(user_id, image_data)
    
    return s3_client.upload(f"avatars/{user_id}", image_data)

def format_phone_number(phone):
    # Legacy API expects phone numbers in exact format: (123) 456-7890
    # Any deviation results in 400 error - cannot be changed until v2 API
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    raise ValueError("Phone number must have exactly 10 digits")
```

---

## ❌ Common Comment Anti-Patterns

### 1. Noise Comments

Comments that add no value and just clutter the code.

```java
// Bad examples of noise comments
public class Calculator {
    
    // Variables
    private int result;
    
    // Methods
    
    // Add two numbers
    public int add(int a, int b) {
        return a + b;  // Return the sum
    }
    
    // Subtract two numbers  
    public int subtract(int a, int b) {
        return a - b;  // Return the difference
    }
    
    // End of class
}
```

### 2. Misleading Comments

Comments that were once accurate but are now wrong.

```javascript
// Bad - Comment doesn't match the code
function calculateDiscountedPrice(price, discountPercent) {
    // Apply 10% discount to the price
    return price * (1 - discountPercent / 100);  // Actually applies variable discount
}

// Bad - Outdated comment
function processOrder(order) {
    // Send email confirmation to customer
    validateOrder(order);
    reserveInventory(order);
    processPayment(order);
    // Email sending was removed but comment remains
    return order;
}
```

### 3. Journal Comments

Comments that track change history (use version control instead).

```python
# Bad - Journal comments
def calculate_tax(amount):
    # 2023-01-15: Created by John Smith
    # 2023-02-20: Modified by Jane Doe to fix rounding issue
    # 2023-03-10: Updated by Bob Wilson to handle negative amounts
    # 2023-04-05: Optimized by Alice Johnson for better performance
    
    if amount < 0:
        return 0
    return round(amount * 0.08, 2)
```

### 4. Attribution Comments

Comments that claim ownership (use version control).

```java
// Bad - Attribution comments
public class UserService {
    
    /**
     * Created by: John Smith
     * Modified by: Jane Doe, Bob Wilson, Alice Johnson
     * Team: Backend Squad Alpha
     * Date: 2023-03-15
     */
    public User createUser(UserData userData) {
        // Implementation...
    }
}
```

### 5. Position Markers

Comments that mark sections of code (organize into functions instead).

```javascript
// Bad - Position markers
function processLargeDataset(data) {
    // ============================================
    // VALIDATION SECTION
    // ============================================
    if (!data || data.length === 0) {
        throw new Error('Data is required');
    }
    
    // ============================================
    // TRANSFORMATION SECTION  
    // ============================================
    const transformed = data.map(item => {
        return {
            id: item.id,
            value: item.value * 2,
            processed: true
        };
    });
    
    // ============================================
    // FILTERING SECTION
    // ============================================
    const filtered = transformed.filter(item => item.value > 0);
    
    return filtered;
}

// Good - Organized into functions
function processLargeDataset(data) {
    validateData(data);
    const transformed = transformData(data);
    return filterValidItems(transformed);
}
```

---

## 🛠️ Self-Documenting Code Techniques

### 1. Use Intention-Revealing Names

Let variable and function names explain the code.

```python
# Instead of comments, use better names
def process_user_data(data):
    # Bad approach with comments
    # Check if user is valid
    # if data['age'] >= 18 and data['status'] == 'A':
    
    # Good approach with intention-revealing names
    user_age = data['age']
    user_status = data['status']
    
    is_adult = user_age >= 18
    is_active_status = user_status == 'A'
    
    if is_adult and is_active_status:
        return create_valid_user(data)
    
    return None
```

### 2. Extract Methods to Reveal Intent

Replace comments with well-named functions.

```java
// Instead of inline comments, extract methods
public void processOrder(Order order) {
    // Bad - comments explain what's happening
    // if (order.getTotal() > 1000 && order.getCustomer().isPremium()) {
    //     // Apply premium discount
    //     order.applyDiscount(0.15);
    // }
    
    // Good - method names explain what's happening
    if (qualifiesForPremiumDiscount(order)) {
        applyPremiumDiscount(order);
    }
    
    if (requiresManagerApproval(order)) {
        sendManagerApprovalRequest(order);
    }
}

private boolean qualifiesForPremiumDiscount(Order order) {
    return order.getTotal() > 1000 && order.getCustomer().isPremium();
}

private void applyPremiumDiscount(Order order) {
    order.applyDiscount(0.15);
}
```

### 3. Use Explanatory Variables

Break complex expressions into well-named intermediate variables.

```javascript
// Instead of comments, use explanatory variables
function calculateShippingCost(order) {
    // Bad - comment explains complex condition
    // if (order.weight > 50 || order.dimensions.length > 100 || order.value > 1000) {
    //     // Requires special handling
    //     return calculateSpecialShipping(order);
    // }
    
    // Good - explanatory variables make intent clear
    const isHeavyPackage = order.weight > 50;
    const isOversizedPackage = order.dimensions.length > 100;
    const isHighValuePackage = order.value > 1000;
    
    const requiresSpecialHandling = isHeavyPackage || isOversizedPackage || isHighValuePackage;
    
    if (requiresSpecialHandling) {
        return calculateSpecialShipping(order);
    }
    
    return calculateStandardShipping(order);
}
```

---

## 📝 Comment Maintenance

### Keep Comments Current

When you change code, update the related comments or delete them.

```python
# Good practice - comment maintenance
def calculate_late_fee(days_late):
    # Business rule updated 2023-06-15: Late fee is now $5 per day, max $50
    # Previous rule (until 2023-06-14): Was $3 per day, max $30
    daily_fee = 5.00
    maximum_fee = 50.00
    
    total_fee = days_late * daily_fee
    return min(total_fee, maximum_fee)
```

### Delete Obsolete Comments

Remove comments that no longer apply.

```java
public class UserAccount {
    private String username;
    private String email;
    
    // Good - removed obsolete comment when feature was removed
    // OLD COMMENT: "Password must be hashed with MD5"
    // We no longer store passwords locally - using OAuth only
    
    public UserAccount(String username, String email) {
        this.username = username;
        this.email = email;
    }
}
```

---

## 🧪 Testing and Documentation Alternatives

### Use Tests as Documentation

Well-written tests can serve as executable documentation.

```javascript
// Instead of comments, let tests document behavior
describe('OrderCalculator', () => {
    describe('calculateTotal', () => {
        it('applies 10% discount for premium customers on orders over $100', () => {
            const order = createOrder({ total: 150, customer: premiumCustomer });
            const result = OrderCalculator.calculateTotal(order);
            expect(result).toBe(135); // 150 - (150 * 0.10)
        });
        
        it('does not apply discount for standard customers', () => {
            const order = createOrder({ total: 150, customer: standardCustomer });
            const result = OrderCalculator.calculateTotal(order);
            expect(result).toBe(150);
        });
        
        it('does not apply discount for orders under $100', () => {
            const order = createOrder({ total: 50, customer: premiumCustomer });
            const result = OrderCalculator.calculateTotal(order);
            expect(result).toBe(50);
        });
    });
});
```

### Use Type Annotations and Documentation

In languages that support it, use type annotations and docstrings.

```python
from typing import List, Optional
from decimal import Decimal

def calculate_order_total(
    items: List[OrderItem],
    tax_rate: Decimal,
    discount_code: Optional[str] = None
) -> Decimal:
    """
    Calculate the total cost of an order including tax and discounts.
    
    Args:
        items: List of items in the order
        tax_rate: Tax rate as decimal (e.g., 0.08 for 8%)
        discount_code: Optional discount code to apply
        
    Returns:
        Total order amount including tax and discounts
        
    Raises:
        ValueError: If tax_rate is negative or > 1
        InvalidDiscountError: If discount_code is invalid
    """
    if tax_rate < 0 or tax_rate > 1:
        raise ValueError("Tax rate must be between 0 and 1")
    
    # Implementation continues...
```

---

## 📝 Quick Comment Guidelines Checklist

Before adding a comment, ask yourself:

### ✅ **Is This Comment Necessary?**
- [ ] Does the code clearly express what it's doing?
- [ ] Could I improve the code instead of adding a comment?
- [ ] Am I explaining "why" rather than "what"?

### ✅ **Is This Comment Valuable?**
- [ ] Does it provide information not obvious from the code?
- [ ] Does it warn about important consequences?
- [ ] Does it explain a business rule or external constraint?

### ✅ **Is This Comment Maintainable?**
- [ ] Will I remember to update this comment when I change the code?
- [ ] Is the comment close enough to the relevant code?
- [ ] Does the comment clearly indicate what needs to be done (for TODOs)?

### ❌ **Avoid These Comment Types:**
- [ ] Comments that restate what the code obviously does
- [ ] Commented-out code (delete it instead)
- [ ] Attribution or change history (use version control)
- [ ] Position markers (organize into functions instead)

---

## 🚀 **Next Steps**

**You've completed Principle 3: Comments! 🎉**

### **Immediate Next Actions:**
1. **[📝 Practice with Exercises →](../../exercises/principle-practice/03-comments/README.md)** - Practice self-documenting code
2. **[📋 Use the Daily Checklist](./checklist.md)** - Apply comment strategies in daily coding
3. **[👀 Study the Examples](../../examples/before-after/comment-examples/README.md)** - See over-commented code become clean

### **Continue Your Learning Journey:**
- **[📖 Next: Principle 4 - Formatting →](../04-formatting/README.md)** - Learn professional code organization
- **[📚 Back to Learning Path](../../LEARNING_PATH.md)** - Track your progress through foundation phase
- **[🎯 Apply to Your Code](../../LEARNING_PATH.md#progress-tracking-and-assessment)** - Remove unnecessary comments from your projects

**Ready for the next principle?** Professional formatting and code organization! **[Start Principle 4 →](../04-formatting/README.md)**

---

*Remember: The best comment is the one you don't need to write because your code is clear and expressive. When you do write comments, make them count by explaining the "why" behind your decisions.*
