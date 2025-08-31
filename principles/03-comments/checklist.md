# Comments Quick Reference Checklist

Use this checklist to evaluate whether comments in your code are helpful or harmful.

## 📝 Before Adding a Comment

Before writing any comment, ask yourself these questions:

### ✅ **Is the Comment Necessary?**
- [ ] **Can I improve the code instead?** - Would better naming or structure eliminate the need for this comment?
- [ ] **Does the code clearly express what it does?** - If yes, a comment explaining "what" is redundant
- [ ] **Am I explaining "why" rather than "what"?** - Good comments explain reasoning, not obvious actions
- [ ] **Does this comment add information not available from reading the code?** - If not, it's noise

### ✅ **Is the Comment Valuable?**
- [ ] **Business rule explanation** - Does it clarify complex domain logic?
- [ ] **Consequence warning** - Does it warn about performance, security, or side effects?
- [ ] **External constraint** - Does it explain API limitations, legal requirements, or third-party quirks?
- [ ] **Algorithm rationale** - Does it explain why this specific approach was chosen?
- [ ] **TODO with context** - Does it describe what needs to be done and why it's not done now?

### ✅ **Will the Comment Stay Current?**
- [ ] **Is it close to the relevant code?** - Comments far from code tend to become outdated
- [ ] **Will I remember to update it when code changes?** - If unlikely, consider alternatives
- [ ] **Does it describe stable information?** - Temporary workarounds change frequently

## 🚨 Comment Red Flags - Avoid These

### ❌ **Noise Comments (Delete These)**
```javascript
// Bad examples to avoid
i++; // Increment i
let user = new User(); // Create new user object
return true; // Return true
```

### ❌ **Redundant Comments (Delete These)**
```java
// Bad - restates what code obviously does
public void setName(String name) {
    this.name = name; // Set the name field to the name parameter
}
```

### ❌ **Commented-Out Code (Delete This)**
```python
# Bad - dead code left in comments
def calculate_price(items):
    # old_total = 0
    # for item in items:
    #     old_total += item.price
    # return old_total
    
    return sum(item.price for item in items)
```

### ❌ **Misleading Comments (Fix or Delete)**
```javascript
// Bad - comment doesn't match what code actually does
function calculateTax(amount) {
    // Returns the amount with 10% tax added
    return amount * 0.08; // Actually 8%, not 10%
}
```

### ❌ **Attribution Comments (Use Version Control)**
```java
// Bad - version control tracks this information
/**
 * Created by: John Smith
 * Modified by: Jane Doe, Bob Wilson
 * Last updated: 2023-03-15
 */
public class UserService {
}
```

## ✅ Good Comment Patterns

### **Business Rule Explanation**
```python
# Good - explains complex business logic
def calculate_overtime_pay(hours, rate):
    regular_hours = min(hours, 40)
    overtime_hours = max(0, hours - 40)
    
    # California law: overtime is 1.5x for hours 40-50, 2x for 50+
    moderate_overtime = min(overtime_hours, 10)
    extreme_overtime = max(0, overtime_hours - 10)
    
    return (regular_hours * rate + 
            moderate_overtime * rate * 1.5 + 
            extreme_overtime * rate * 2.0)
```

### **Performance Warning**
```javascript
// Good - warns about performance implications
function processLargeDataset(data) {
    // WARNING: Loads entire dataset into memory
    // Use processLargeDatasetStreaming() for files > 1GB
    return data.map(item => transformItem(item));
}
```

### **External Constraint**
```java
// Good - explains external API requirement
public String formatPhoneNumber(String phone) {
    // Legacy payment API requires exact format: (123) 456-7890
    // Any deviation results in 400 error - cannot change until v2 API
    String digits = phone.replaceAll("\\D", "");
    return String.format("(%s) %s-%s", 
        digits.substring(0, 3),
        digits.substring(3, 6), 
        digits.substring(6));
}
```

### **Algorithm Rationale**
```python
# Good - explains why this algorithm was chosen
def shuffle_array(array):
    # Using Fisher-Yates shuffle for unbiased random distribution
    # Math.random() alone would create bias toward certain positions
    for i in range(len(array) - 1, 0, -1):
        j = random.randint(0, i)
        array[i], array[j] = array[j], array[i]
```

### **Helpful TODO**
```typescript
// Good - TODO with context and timeline
function calculateShipping(order: Order): number {
    // TODO: Implement zone-based shipping rates (ticket #456)
    // Business requirement: Different rates for domestic/international
    // Waiting for shipping partner API integration (Q2 2024)
    
    return FLAT_SHIPPING_RATE;
}
```

## 🔧 Self-Documenting Alternatives

Before adding comments, try these techniques:

### **Extract Method**
```javascript
// Instead of comment explaining code block
function processOrder(order) {
    // Validate that all items are in stock
    for (let item of order.items) {
        if (!inventory.hasStock(item.id, item.quantity)) {
            throw new Error(`Item ${item.id} out of stock`);
        }
    }
}

// Extract to well-named function
function processOrder(order) {
    validateAllItemsInStock(order.items);
}

function validateAllItemsInStock(items) {
    for (let item of items) {
        if (!inventory.hasStock(item.id, item.quantity)) {
            throw new Error(`Item ${item.id} out of stock`);
        }
    }
}
```

### **Explanatory Variables**
```python
# Instead of comment explaining complex condition
if user.age >= 18 and user.has_valid_id and user.account_status == 'active':
    # User is eligible to make purchases
    process_purchase(user, item)

# Use explanatory variable
is_eligible_to_purchase = (user.age >= 18 and 
                          user.has_valid_id and 
                          user.account_status == 'active')

if is_eligible_to_purchase:
    process_purchase(user, item)
```

### **Named Constants**
```java
// Instead of magic number with comment
if (retryCount >= 3) { // Maximum retries allowed by API
    throw new MaxRetriesException();
}

// Use named constant
private static final int MAX_API_RETRIES = 3;

if (retryCount >= MAX_API_RETRIES) {
    throw new MaxRetriesException();
}
```

## 📋 Code Review Checklist

When reviewing code, check for these comment issues:

### **Comments to Question**
- [ ] Comments that explain what the code obviously does
- [ ] Comments that could be replaced with better function/variable names
- [ ] Comments that seem outdated or don't match the current code
- [ ] Large blocks of commented-out code
- [ ] Comments that repeat information available elsewhere

### **Comments to Appreciate**
- [ ] Comments that explain business rules or domain knowledge
- [ ] Warnings about performance, security, or side effects
- [ ] Explanations of non-obvious algorithms or optimizations
- [ ] TODOs with sufficient context and timeline
- [ ] Legal/compliance requirements that must be documented

### **Alternatives to Suggest**
- [ ] Extract methods with descriptive names instead of explanatory comments
- [ ] Use better variable names instead of comments explaining variables
- [ ] Break complex expressions into well-named intermediate variables
- [ ] Move comments closer to the code they describe
- [ ] Delete commented-out code and rely on version control

## 🎯 Self-Assessment Questions

Rate your codebase (1-5 scale):

- [ ] **Comment Quality**: Comments explain "why" rather than "what" (1=mostly "what", 5=mostly "why")
- [ ] **Comment Necessity**: Comments are only present when they add value (1=many unnecessary, 5=all valuable)
- [ ] **Code Clarity**: Code is self-documenting through good naming and structure (1=needs lots of comments, 5=rarely needs comments)
- [ ] **Comment Maintenance**: Comments are kept current with code changes (1=often outdated, 5=always current)
- [ ] **Signal-to-Noise**: Easy to find important information among comments (1=lots of noise, 5=high signal)

**Target**: All scores should be 4 or 5. If any score is 3 or below, focus on improving that aspect.

## 💡 Pro Tips

### **The Comment Test**
If you feel compelled to write a comment, first try:
1. **Better naming** - Can a better function/variable name eliminate the need?
2. **Extract method** - Can you pull out a well-named function?
3. **Simplify logic** - Can you make the code clearer?
4. **Add structure** - Can you organize the code better?

Only if none of these work should you add a comment.

### **The Outdated Comment Prevention**
- Keep comments as close as possible to the code they describe
- Make comments about stable, long-term aspects of the code
- Use TODO comments sparingly and with specific context
- Review and update comments during code reviews
- Delete comments that no longer apply

### **The Business Value Test**
Ask: "Would a new team member benefit from this comment?"
- If it explains obvious code: No - delete it
- If it explains domain knowledge: Yes - keep it
- If it explains "why" decisions were made: Yes - keep it
- If it warns about consequences: Yes - keep it

---

*Remember: The best comment is the one you don't need to write because your code is clear and expressive. When you do write comments, make them count by explaining the "why" behind your code.*
