# Functions: Before & After Examples

This directory contains real-world examples showing the transformation from poorly designed functions to clean, well-designed functions that follow the Single Responsibility Principle.

## 📚 Example Categories

### 1. **Large Functions → Small Functions**
- **Files**: `large-function-bad.js`, `small-functions-good.js`
- **Focus**: Breaking down monolithic functions into focused, single-purpose functions
- **Key Learning**: Extract till you drop - keep extracting until each function does one thing

### 2. **Multiple Responsibilities → Single Responsibility**
- **Files**: `mixed-concerns-bad.py`, `single-concern-good.py`
- **Focus**: Separating different responsibilities into dedicated functions
- **Key Learning**: Functions should have one reason to change

### 3. **Poor Parameters → Clean Parameters**
- **Files**: `bad-parameters-bad.java`, `clean-parameters-good.java`
- **Focus**: Designing function signatures with appropriate parameter counts and types
- **Key Learning**: Minimize parameters, group related data, use meaningful names

### 4. **Hidden Side Effects → Explicit Operations**
- **Files**: `hidden-effects-bad.ts`, `explicit-operations-good.ts`
- **Focus**: Making side effects obvious through naming and design
- **Key Learning**: Functions should be honest about what they do

### 5. **Command-Query Mixing → Separation**
- **Files**: `command-query-mixed-bad.py`, `command-query-separated-good.py`
- **Focus**: Separating functions that do things from functions that return things
- **Key Learning**: Functions should either command OR query, not both

## 🎯 How to Use These Examples

### Study Method
1. **Read the "bad" version first** - Identify the function design problems
2. **List improvement opportunities** - What makes the functions hard to understand/test?
3. **Think of solutions** - How would you refactor these functions?
4. **Study the "good" version** - See clean function design principles in action
5. **Compare approaches** - Understand the reasoning behind each improvement

### Practice Approach
- **Code along** - Type out the examples and experiment with variations
- **Apply to your code** - Find similar patterns in your current projects
- **Create your own examples** - Transform functions from your codebase
- **Share and discuss** - Review with teammates and get feedback

## 💡 Key Patterns You'll Learn

### Function Size and Focus
- **Extract Method** - Breaking large functions into smaller ones
- **Single Responsibility** - One function, one purpose
- **Meaningful Names** - Function names that reveal intent
- **Levels of Abstraction** - Keeping functions at consistent abstraction levels

### Parameter Design
- **Parameter Objects** - Grouping related parameters
- **Dependency Injection** - Making dependencies explicit
- **Default Values** - Reducing required parameters
- **Parameter Validation** - Handling invalid inputs gracefully

### Side Effect Management
- **Pure Functions** - Functions without side effects
- **Command Functions** - Functions that perform actions
- **Query Functions** - Functions that return information
- **Honest Naming** - Names that reveal all behaviors

### Error Handling
- **Exception Strategy** - When and how to throw exceptions
- **Result Objects** - Structured error handling
- **Validation Functions** - Clear input validation
- **Error Recovery** - Graceful failure handling

## 🔧 Common Refactoring Techniques

### 1. Extract Method
```javascript
// Before: One large function
function processOrder(orderData) {
    // 50 lines of mixed logic
}

// After: Multiple focused functions
function validateOrderData(orderData) { }
function calculateOrderTotal(orderData) { }
function processPayment(orderData) { }
function updateInventory(orderData) { }
function sendConfirmation(orderData) { }
function processOrder(orderData) {
    // Orchestrates the workflow
}
```

### 2. Introduce Parameter Object
```python
# Before: Too many parameters
def create_user(first_name, last_name, email, phone, street, city, state, zip_code):
    pass

# After: Grouped parameters
def create_user(personal_info, contact_info, address_info):
    pass
```

### 3. Separate Command and Query
```java
// Before: Mixed command and query
public boolean setUserActive(User user) {
    user.setActive(true);      // Command
    database.save(user);       // Command
    return user.isActive();    // Query
}

// After: Separated concerns
public void activateUser(User user) {     // Command only
    user.setActive(true);
    database.save(user);
}

public boolean isUserActive(User user) {  // Query only
    return user.isActive();
}
```

### 4. Extract Pure Functions
```python
# Before: Mixed pure and impure logic
def calculate_and_save_tax(order):
    tax = order.subtotal * 0.08    # Pure calculation
    order.tax = tax                 # Side effect
    database.save_order(order)      # Side effect
    return tax

# After: Separated pure and impure
def calculate_tax(subtotal):        # Pure function
    return subtotal * 0.08

def save_order_with_tax(order, tax):  # Impure function
    order.tax = tax
    database.save_order(order)
```

## 🏆 Success Indicators

Your refactored functions should achieve:

### **Readability**
- Function purpose is clear from the name
- Function body tells a coherent story
- Each function operates at a single level of abstraction
- Code reads like well-written prose

### **Testability**
- Functions can be tested in isolation
- Dependencies are explicit and mockable
- Error conditions are easy to reproduce
- Test setup is minimal and clear

### **Maintainability**
- Changes are localized to specific functions
- Adding new features doesn't require modifying existing functions
- Bug fixes are isolated and don't affect other functionality
- Code is easy to understand for new team members

### **Reusability**
- Functions can be used in multiple contexts
- No hidden dependencies or global state
- Clear contracts through parameter and return types
- Composable with other functions

---

Ready to see clean function design in action? Start with [Large Functions → Small Functions](./large-function-bad.js) to see how to break down monolithic code!
