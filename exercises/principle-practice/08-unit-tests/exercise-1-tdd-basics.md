# Exercise 1: TDD Basics - Red, Green, Refactor

Master the fundamental Test-Driven Development cycle by building functionality incrementally through the Red-Green-Refactor rhythm.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Practice the Red-Green-Refactor cycle consistently
- Write tests before implementation (Red phase)
- Write minimal code to make tests pass (Green phase)
- Improve code structure while maintaining tests (Refactor phase)
- Develop intuition for good test design
- Experience how TDD drives better design

## 📝 Exercise Format

Each problem starts with requirements but NO implementation. You must write tests first, then implement just enough code to make them pass, then refactor for clarity.

---

## Problem 1: String Calculator (Classic TDD Kata)

### Requirements
Build a string calculator with these features (implement incrementally):

1. **Empty string** returns 0
2. **Single number** returns that number
3. **Two numbers separated by comma** returns their sum
4. **Multiple numbers** returns their sum
5. **Handle newlines** as delimiters (in addition to commas)
6. **Custom delimiter** format: `//[delimiter]\n[numbers]`
7. **Negative numbers** throw exception with message listing all negatives
8. **Numbers > 1000** should be ignored
9. **Multi-character delimiters** supported
10. **Multiple different delimiters** supported

### Your Task
Follow TDD strictly - write each test first, make it pass, then refactor.

### Red-Green-Refactor Process
```
🔴 RED: Write a failing test
🟢 GREEN: Write minimal code to make it pass
🔄 REFACTOR: Improve code while keeping tests green
```

### Starting Template (JavaScript)
```javascript
// string-calculator.test.js
describe('StringCalculator', () => {
    // Start here - write your first test
});

// string-calculator.js
class StringCalculator {
    // Start empty - let tests drive the implementation
}
```

### TDD Steps Guidance

#### Step 1: Empty String
```javascript
// 🔴 RED: Write failing test
it('should return 0 for empty string', () => {
    const calculator = new StringCalculator();
    expect(calculator.add("")).toBe(0);
});

// 🟢 GREEN: Minimal implementation
add(numbers) {
    return 0;
}

// 🔄 REFACTOR: Is there anything to improve? Not yet.
```

#### Step 2: Single Number
```javascript
// 🔴 RED: Write failing test
it('should return the number for single number', () => {
    const calculator = new StringCalculator();
    expect(calculator.add("1")).toBe(1);
    expect(calculator.add("5")).toBe(5);
});

// 🟢 GREEN: Minimal implementation to pass both tests
add(numbers) {
    if (numbers === "") return 0;
    return parseInt(numbers);
}

// 🔄 REFACTOR: Clean up if needed
```

### Requirements
- [ ] **Write tests first** - Never write implementation before a failing test
- [ ] **Minimal implementation** - Write only enough code to make tests pass
- [ ] **Refactor regularly** - Improve code structure after tests pass
- [ ] **One feature at a time** - Implement requirements incrementally
- [ ] **Test edge cases** - Consider boundary conditions and error cases
- [ ] **Meaningful test names** - Tests should clearly describe behavior

### Focus Areas
- TDD discipline and rhythm
- Test-first thinking
- Incremental development
- Design emergence through tests

---

## Problem 2: FizzBuzz with TDD

### Requirements
Build FizzBuzz with these rules (implement incrementally):

1. **Numbers 1-100** are processed
2. **Multiples of 3** return "Fizz"
3. **Multiples of 5** return "Buzz"  
4. **Multiples of both 3 and 5** return "FizzBuzz"
5. **All other numbers** return the number as string
6. **Range configuration** - support different start/end numbers
7. **Custom rules** - support different multiples and words
8. **Multiple custom rules** - support adding multiple rules

### Your Task
Start with the classic FizzBuzz, then extend it step by step using TDD.

### Starting Template (Python)
```python
# test_fizzbuzz.py
import unittest

class TestFizzBuzz(unittest.TestCase):
    def setUp(self):
        self.fizzbuzz = FizzBuzz()
    
    # Write your tests here

# fizzbuzz.py
class FizzBuzz:
    # Let tests drive the implementation
    pass
```

### TDD Progression

#### Start Simple
```python
# 🔴 RED: Test the simplest case
def test_returns_1_for_1(self):
    result = self.fizzbuzz.convert(1)
    self.assertEqual(result, "1")

# 🟢 GREEN: Simplest implementation
def convert(self, number):
    return "1"

# 🔄 REFACTOR: Nothing to refactor yet
```

#### Build Incrementally
```python
# 🔴 RED: Test another number
def test_returns_2_for_2(self):
    result = self.fizzbuzz.convert(2)
    self.assertEqual(result, "2")

# 🟢 GREEN: Handle multiple numbers
def convert(self, number):
    return str(number)

# 🔄 REFACTOR: Good enough for now
```

### Requirements
- [ ] **Red-Green-Refactor** cycle for each feature
- [ ] **Incremental development** - one rule at a time
- [ ] **Test edge cases** - boundary conditions
- [ ] **Parameterized tests** - test multiple values efficiently
- [ ] **Clean test structure** - organized and readable tests

### Focus Areas
- TDD rhythm consistency
- Parameterized testing
- Design evolution
- Test organization

---

## Problem 3: Shopping Cart with TDD

### Requirements
Build a shopping cart with these features (implement incrementally):

1. **Add items** to cart
2. **Calculate total** price
3. **Remove items** from cart
4. **Apply discounts** (percentage and fixed amount)
5. **Handle quantity** for items
6. **Calculate tax** based on item types
7. **Free shipping** for orders over threshold
8. **Coupon codes** with validation
9. **Inventory checking** (items must be in stock)
10. **Member pricing** with different tiers

### Your Task
Build this cart system entirely with TDD - no implementation without failing tests.

### Starting Template (Java)
```java
// ShoppingCartTest.java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

public class ShoppingCartTest {
    private ShoppingCart cart;
    
    @BeforeEach
    void setUp() {
        cart = new ShoppingCart();
    }
    
    // Write your tests here
}

// ShoppingCart.java
public class ShoppingCart {
    // Let tests drive the implementation
}
```

### TDD Design Questions
As you develop, let the tests answer these design questions:
- How should items be represented?
- How should discounts be applied?
- How should tax calculation work?
- How should errors be handled?

### Example TDD Flow
```java
// 🔴 RED: Start with empty cart
@Test
void newCartShouldBeEmpty() {
    assertTrue(cart.isEmpty());
}

// 🟢 GREEN: Implement isEmpty
public boolean isEmpty() {
    return true; // Simplest implementation
}

// 🔴 RED: Add item to cart
@Test
void addItemToCart() {
    Item apple = new Item("Apple", 1.50);
    cart.addItem(apple);
    assertFalse(cart.isEmpty());
    assertEquals(1, cart.getItemCount());
}

// 🟢 GREEN: Implement addItem and getItemCount
// Continue this pattern...
```

### Requirements
- [ ] **Test-first approach** - every feature starts with a test
- [ ] **Small increments** - add one behavior at a time
- [ ] **Good test names** - clearly describe expected behavior
- [ ] **Setup and teardown** - clean test environment
- [ ] **Edge case testing** - invalid inputs, boundary conditions
- [ ] **Integration-style tests** - test realistic workflows

### Focus Areas
- Complex domain modeling with TDD
- Test organization and structure
- Error handling in TDD
- Design emergence through testing

---

## Problem 4: Password Validator with TDD

### Requirements
Build a password validator with these rules (implement incrementally):

1. **Minimum length** (8 characters)
2. **Maximum length** (128 characters)
3. **Contains uppercase** letter
4. **Contains lowercase** letter
5. **Contains number**
6. **Contains special character**
7. **No common passwords** (from a list)
8. **No personal information** (name, email parts)
9. **No consecutive characters** (aaa, 123)
10. **Custom rules** support

### Your Task
Use TDD to build a comprehensive password validator.

### Starting Template (C#)
```csharp
// PasswordValidatorTests.cs
using Xunit;

public class PasswordValidatorTests
{
    private readonly PasswordValidator _validator;
    
    public PasswordValidatorTests()
    {
        _validator = new PasswordValidator();
    }
    
    // Write your tests here
}

// PasswordValidator.cs
public class PasswordValidator
{
    // Let tests drive the implementation
}
```

### TDD Strategy
```csharp
// 🔴 RED: Start with minimum length
[Fact]
public void ValidatePassword_WithEmptyString_ShouldReturnFalse()
{
    var result = _validator.IsValid("");
    Assert.False(result);
}

// 🟢 GREEN: Simplest implementation
public bool IsValid(string password)
{
    return false; // Make the test pass
}

// Continue with more tests...
```

### Advanced TDD Concepts
- **Parameterized tests** for multiple test cases
- **Test data builders** for complex objects
- **Custom assertions** for better readability
- **Test categories** for different types of validation

### Requirements
- [ ] **Test each rule separately** - isolated validation testing
- [ ] **Combine rules** - test multiple validation rules together
- [ ] **Error message testing** - validate specific error messages
- [ ] **Performance testing** - ensure validation is fast
- [ ] **Configuration testing** - test customizable rules

### Focus Areas
- Validation logic design
- Error handling and messaging
- Configurable rule systems
- Performance considerations in TDD

---

## Problem 5: Bank Account with TDD

### Requirements
Build a bank account system with these features (implement incrementally):

1. **Create account** with initial balance
2. **Deposit money** to account
3. **Withdraw money** from account
4. **Check balance**
5. **Prevent overdrafts** (balance can't go negative)
6. **Transaction history** tracking
7. **Interest calculation** for savings accounts
8. **Account types** (checking, savings, credit)
9. **Transfer between accounts**
10. **Account freezing** and unfreezing

### Your Task
Build this banking system with strict TDD discipline.

### Starting Template (Python)
```python
# test_bank_account.py
import unittest
from datetime import datetime

class TestBankAccount(unittest.TestCase):
    def setUp(self):
        # Setup runs before each test
        pass
    
    # Write your tests here

# bank_account.py
class BankAccount:
    # Let tests drive the implementation
    pass
```

### TDD Workflow Example
```python
# 🔴 RED: Create account with balance
def test_create_account_with_initial_balance(self):
    account = BankAccount(100.0)
    self.assertEqual(account.get_balance(), 100.0)

# 🟢 GREEN: Implement constructor and get_balance
def __init__(self, initial_balance):
    self._balance = initial_balance

def get_balance(self):
    return self._balance

# 🔄 REFACTOR: Consider validation, edge cases
```

### Advanced Testing Patterns
- **State-based testing** - verify object state changes
- **Behavior verification** - check that methods are called
- **Exception testing** - verify proper error handling
- **Mock objects** - isolate external dependencies

### Requirements
- [ ] **Complete test coverage** - every method and branch tested
- [ ] **Business rule testing** - verify domain rules are enforced
- [ ] **Error condition testing** - test invalid operations
- [ ] **State transition testing** - verify state changes
- [ ] **Concurrency considerations** - if applicable

### Focus Areas
- State-based testing
- Business rule enforcement
- Error handling strategies
- Test data management

---

## 🏆 Success Criteria

For each problem, demonstrate TDD mastery:

### TDD Discipline
- **Test First**: Never write implementation before a failing test
- **Minimal Code**: Write only enough code to make tests pass
- **Regular Refactoring**: Improve code structure while keeping tests green
- **Small Steps**: Implement one behavior at a time

### Test Quality
- **Clear Names**: Test names clearly describe expected behavior
- **Good Organization**: Tests are well-structured and readable
- **Comprehensive Coverage**: All behaviors and edge cases are tested
- **Fast Execution**: Tests run quickly and reliably

### Design Quality
- **Emergent Design**: Let tests drive good design decisions
- **Simple Solutions**: Prefer simple implementations over complex ones
- **Clean Code**: Refactor to maintain code quality
- **SOLID Principles**: Design follows good OOP principles

---

## 💡 TDD Best Practices

### **Red Phase (Write Failing Test)**
```javascript
// Good test characteristics:
it('should calculate total price including tax for multiple items', () => {
    const cart = new ShoppingCart();
    cart.addItem(new Item('Book', 10.00, 'taxable'));
    cart.addItem(new Item('Food', 5.00, 'tax-exempt'));
    
    const total = cart.getTotalWithTax(0.08); // 8% tax rate
    
    expect(total).toBe(15.80); // 10.00 + 0.80 tax + 5.00
});
```

### **Green Phase (Make Test Pass)**
```javascript
// Minimal implementation:
getTotalWithTax(taxRate) {
    let total = 0;
    let taxableAmount = 0;
    
    for (const item of this.items) {
        total += item.price;
        if (item.category === 'taxable') {
            taxableAmount += item.price;
        }
    }
    
    return total + (taxableAmount * taxRate);
}
```

### **Refactor Phase (Improve Code)**
```javascript
// Refactored for clarity:
getTotalWithTax(taxRate) {
    const subtotal = this.calculateSubtotal();
    const taxAmount = this.calculateTax(taxRate);
    return subtotal + taxAmount;
}

calculateSubtotal() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
}

calculateTax(taxRate) {
    const taxableAmount = this.getTaxableAmount();
    return taxableAmount * taxRate;
}

getTaxableAmount() {
    return this.items
        .filter(item => item.isTaxable())
        .reduce((sum, item) => sum + item.price, 0);
}
```

---

## 🎯 Self-Assessment

After completing each problem, evaluate your TDD practice:

### **TDD Discipline (1-5 scale)**
- [ ] **Red-Green-Refactor**: Consistently followed the TDD cycle
- [ ] **Test First**: Always wrote tests before implementation
- [ ] **Minimal Code**: Wrote only enough code to make tests pass
- [ ] **Regular Refactoring**: Improved code structure after tests passed

### **Test Quality (1-5 scale)**
- [ ] **Clear Names**: Test names clearly describe expected behavior
- [ ] **Good Coverage**: All important behaviors and edge cases tested
- [ ] **Fast Tests**: Tests run quickly and reliably
- [ ] **Readable Tests**: Tests are easy to understand and maintain

**Target**: All scores should be 4 or 5. This represents mastery of TDD fundamentals.

---

## 🚀 Next Steps

Once you've completed all TDD basics problems:

1. **Review your test suites** - Are they comprehensive and maintainable?
2. **Practice TDD daily** - Apply these skills to your real work
3. **Move to [Exercise 2: Refactoring for Testability](./exercise-2-testability.md)** - Learn to make legacy code testable
4. **Study advanced testing patterns** - Mocks, stubs, test doubles

Remember: TDD is a discipline that improves with practice. The Red-Green-Refactor cycle should become second nature, guiding you toward better design through the pressure of testing!
