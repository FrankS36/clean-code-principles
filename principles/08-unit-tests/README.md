# 🧪 Principle 8: Unit Tests and Test-Driven Development

> "Code without tests is broken by design." - Jacob Kaplan-Moss

Writing clean, effective unit tests is not just about catching bugs—it's about designing better code, documenting behavior, and enabling confident refactoring. Test-Driven Development (TDD) takes this further by using tests to drive the design of your code from the ground up.

## 📚 **Quick Navigation**
- **[🔙 Previous: Principle 7 - Boundaries](../07-boundaries/README.md)** - External system integration
- **[📚 Back to Learning Path](../../LEARNING_PATH.md)** - Overall progression
- **[📖 Next: Principle 9 - Classes →](../09-classes/README.md)** - SOLID principles *(coming soon)*
- **[👀 Study Examples](../../examples/before-after/testing-examples/README.md)** - See testing transformations
- **[📝 Practice Exercises](../../exercises/principle-practice/08-unit-tests/README.md)** - Master TDD skills
- **[📋 Daily Checklist](./checklist.md)** - Testing best practices reference

---

## 🎯 **Why Unit Tests and TDD Matter**

### **The Testing Problem**
```javascript
// ❌ Untested code is legacy code
function calculateDiscount(customer, items) {
  let total = 0;
  for (let item of items) {
    total += item.price * item.quantity;
  }
  
  if (customer.isPremium && total > 100) {
    return total * 0.15; // 15% discount
  } else if (total > 50) {
    return total * 0.10; // 10% discount
  }
  
  return 0;
}

// How do you know this works correctly?
// What happens with edge cases?
// How do you refactor safely?
```

### **The Testing Solution**
```javascript
// ✅ Test-driven design creates better code
describe('Discount Calculator', () => {
  it('should give 15% discount for premium customers over $100', () => {
    const customer = { isPremium: true };
    const items = [{ price: 60, quantity: 2 }]; // $120 total
    
    const discount = calculateDiscount(customer, items);
    
    expect(discount).toBe(18); // 15% of $120
  });
  
  it('should give 10% discount for regular customers over $50', () => {
    const customer = { isPremium: false };
    const items = [{ price: 30, quantity: 2 }]; // $60 total
    
    const discount = calculateDiscount(customer, items);
    
    expect(discount).toBe(6); // 10% of $60
  });
  
  it('should give no discount under $50', () => {
    const customer = { isPremium: false };
    const items = [{ price: 20, quantity: 2 }]; // $40 total
    
    const discount = calculateDiscount(customer, items);
    
    expect(discount).toBe(0);
  });
});
```

---

## 🏗️ **Core Testing Principles**

### **1. Tests Should Be FIRST**

**F - Fast**: Tests run quickly (milliseconds, not seconds)
**I - Independent**: Tests don't depend on each other
**R - Repeatable**: Same result every time, any environment
**S - Self-Validating**: Clear pass/fail, no manual verification
**T - Timely**: Written at the right time (preferably first!)

```python
# ✅ FIRST principles in action
class TestEmailValidator:
    def test_valid_email_returns_true(self):  # Fast: no network calls
        validator = EmailValidator()
        result = validator.is_valid("user@example.com")
        assert result is True  # Self-validating: clear assertion
    
    def test_invalid_email_returns_false(self):  # Independent: no shared state
        validator = EmailValidator()
        result = validator.is_valid("invalid-email")
        assert result is False  # Repeatable: deterministic result
```

### **2. One Assertion Per Test (Usually)**

**Focus each test on a single behavior:**
```typescript
// ❌ Multiple concerns in one test
test('user registration', () => {
  const user = registerUser('john@example.com', 'password123');
  
  expect(user.id).toBeDefined();           // Concern 1: ID generation
  expect(user.email).toBe('john@example.com'); // Concern 2: Email storage
  expect(user.isActive).toBe(false);       // Concern 3: Default status
  expect(emailService.sendWelcome).toHaveBeenCalled(); // Concern 4: Side effects
});

// ✅ Focused, single-purpose tests
test('should generate unique ID for new user', () => {
  const user = registerUser('john@example.com', 'password123');
  expect(user.id).toBeDefined();
});

test('should store email address correctly', () => {
  const user = registerUser('john@example.com', 'password123');
  expect(user.email).toBe('john@example.com');
});

test('should set new users as inactive by default', () => {
  const user = registerUser('john@example.com', 'password123');
  expect(user.isActive).toBe(false);
});

test('should send welcome email after registration', () => {
  registerUser('john@example.com', 'password123');
  expect(emailService.sendWelcome).toHaveBeenCalledWith('john@example.com');
});
```

### **3. Arrange, Act, Assert (AAA Pattern)**

**Structure every test with clear phases:**
```java
@Test
public void shouldCalculateOverdueFeesCorrectly() {
    // Arrange - Set up test conditions
    LocalDate dueDate = LocalDate.of(2023, 1, 1);
    LocalDate returnDate = LocalDate.of(2023, 1, 15); // 14 days late
    Book book = new Book("Clean Code", BookType.REGULAR);
    
    // Act - Execute the behavior being tested
    Money overdueeFee = library.calculateOverdueFee(book, dueDate, returnDate);
    
    // Assert - Verify the expected outcome
    assertThat(overdueFee).isEqualTo(Money.dollars(14.00));
}
```

### **4. Test Behavior, Not Implementation**

**Focus on what the code does, not how it does it:**
```csharp
// ❌ Testing implementation details
[Test]
public void ShouldCallDatabaseThreeTimes()
{
    var userService = new UserService(mockRepository);
    userService.GetUserProfile(123);
    
    mockRepository.Verify(r => r.GetUser(123), Times.Once);
    mockRepository.Verify(r => r.GetPreferences(123), Times.Once);
    mockRepository.Verify(r => r.GetAvatar(123), Times.Once);
    // This test breaks when implementation changes!
}

// ✅ Testing behavior and outcomes
[Test]
public void ShouldReturnCompleteUserProfileWithPreferencesAndAvatar()
{
    var userService = new UserService(mockRepository);
    var profile = userService.GetUserProfile(123);
    
    Assert.That(profile.Name, Is.EqualTo("John Doe"));
    Assert.That(profile.Preferences, Is.Not.Null);
    Assert.That(profile.AvatarUrl, Is.Not.Null);
    // This test survives implementation changes!
}
```

### **5. Use Descriptive Test Names**

**Test names should explain the scenario and expected outcome:**
```javascript
// ❌ Poor test names
test('user test');
test('calculate');
test('edge case');

// ✅ Descriptive test names that tell a story
test('should_reject_registration_when_email_already_exists');
test('should_calculate_compound_interest_for_monthly_deposits');
test('should_handle_empty_shopping_cart_gracefully');
test('should_throw_exception_when_dividing_by_zero');
```

### **6. Keep Tests Simple and Focused**

**Tests should be easier to understand than the production code:**
```python
# ❌ Complex test logic
def test_payment_processing():
    for payment_type in ['credit', 'debit', 'paypal']:
        for amount in [10.50, 100.00, 1000.00]:
            if payment_type == 'paypal' and amount > 500:
                continue  # PayPal has limits
            result = process_payment(payment_type, amount)
            if payment_type == 'credit':
                assert result.fee == amount * 0.03
            elif payment_type == 'debit':
                assert result.fee == amount * 0.01
            # Complex logic in tests is hard to debug!

# ✅ Simple, focused tests
def test_credit_card_charges_3_percent_fee():
    result = process_payment('credit', 100.00)
    assert result.fee == 3.00

def test_debit_card_charges_1_percent_fee():
    result = process_payment('debit', 100.00)
    assert result.fee == 1.00

def test_paypal_rejects_payments_over_500_dollars():
    with pytest.raises(PaymentLimitExceeded):
        process_payment('paypal', 600.00)
```

### **7. Use Test Doubles Appropriately**

**Isolate the unit under test with appropriate test doubles:**

#### **Stubs**: Return predetermined values
```typescript
// ✅ Stub for predictable data
const userStub = {
  getId: () => '12345',
  getEmail: () => 'test@example.com',
  isActive: () => true
};
```

#### **Mocks**: Verify interactions
```java
// ✅ Mock for behavior verification
@Test
public void shouldSendEmailWhenUserRegisters() {
    EmailService mockEmailService = mock(EmailService.class);
    UserService userService = new UserService(mockEmailService);
    
    userService.register("john@example.com", "password");
    
    verify(mockEmailService).sendWelcomeEmail("john@example.com");
}
```

#### **Fakes**: Working implementations for testing
```python
# ✅ Fake repository for fast tests
class FakeUserRepository:
    def __init__(self):
        self._users = {}
        self._next_id = 1
    
    def save(self, user):
        user.id = self._next_id
        self._users[user.id] = user
        self._next_id += 1
        return user
    
    def find_by_email(self, email):
        return next((u for u in self._users.values() if u.email == email), None)
```

### **8. Test Edge Cases and Error Conditions**

**Don't just test the happy path:**
```csharp
// ✅ Comprehensive edge case testing
[TestFixture]
public class PasswordValidatorTests
{
    [Test]
    public void ShouldAcceptValidPassword()
    {
        var result = PasswordValidator.IsValid("SecurePass123!");
        Assert.That(result.IsValid, Is.True);
    }
    
    [Test]
    public void ShouldRejectPasswordTooShort()
    {
        var result = PasswordValidator.IsValid("123");
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.Error, Contains.Substring("minimum 8 characters"));
    }
    
    [Test]
    public void ShouldRejectPasswordWithoutNumbers()
    {
        var result = PasswordValidator.IsValid("OnlyLetters");
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.Error, Contains.Substring("contain numbers"));
    }
    
    [Test]
    public void ShouldHandleNullPassword()
    {
        var result = PasswordValidator.IsValid(null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.Error, Contains.Substring("required"));
    }
    
    [Test]
    public void ShouldHandleEmptyPassword()
    {
        var result = PasswordValidator.IsValid("");
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.Error, Contains.Substring("required"));
    }
}
```

---

## 🔄 **Test-Driven Development (TDD) Cycle**

### **The Red-Green-Refactor Cycle**

#### **🔴 Red**: Write a Failing Test
```javascript
// Step 1: Write the test first (it will fail)
test('should calculate area of rectangle', () => {
  const rectangle = new Rectangle(5, 3);
  expect(rectangle.getArea()).toBe(15);
});

// At this point, Rectangle class doesn't even exist!
```

#### **🟢 Green**: Make It Pass
```javascript
// Step 2: Write minimal code to make test pass
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  
  getArea() {
    return this.width * this.height; // Simplest implementation
  }
}
```

#### **🔄 Refactor**: Improve the Code
```javascript
// Step 3: Improve code while keeping tests green
class Rectangle {
  constructor(width, height) {
    this._validateDimensions(width, height);
    this._width = width;
    this._height = height;
  }
  
  getArea() {
    return this._width * this._height;
  }
  
  _validateDimensions(width, height) {
    if (width <= 0 || height <= 0) {
      throw new Error('Dimensions must be positive');
    }
  }
}

// Add test for validation
test('should throw error for invalid dimensions', () => {
  expect(() => new Rectangle(-1, 5)).toThrow('Dimensions must be positive');
});
```

### **TDD Benefits**

1. **Better Design**: Tests force you to think about interfaces first
2. **Documentation**: Tests serve as living examples of how code should work
3. **Confidence**: Comprehensive test suite enables fearless refactoring
4. **Focus**: One test at a time keeps you focused on immediate goals
5. **YAGNI**: You Ain't Gonna Need It - only build what tests require

---

## 🎭 **Testing Strategies by Layer**

### **Unit Tests**: Fast, Isolated, Focused
```python
# ✅ Pure unit test - no external dependencies
class TestOrderCalculator:
    def test_applies_quantity_discount_over_10_items(self):
        calculator = OrderCalculator()
        
        result = calculator.calculate_total(
            items=[OrderItem(price=10.00, quantity=15)],
            discount_rules=[QuantityDiscount(min_quantity=10, rate=0.1)]
        )
        
        assert result.total == 135.00  # 150 - 15 (10% discount)
        assert result.discount_applied == 15.00
```

### **Integration Tests**: Components Working Together
```java
// ✅ Integration test - testing component collaboration
@Test
@SpringBootTest
@Transactional
public void shouldProcessOrderEndToEnd() {
    // Given: Real components working together
    Order order = new Order();
    order.addItem(new OrderItem("Widget", 2, Money.of(25.00)));
    
    // When: Process through real services
    OrderResult result = orderService.processOrder(order);
    
    // Then: Verify end-to-end behavior
    assertThat(result.isSuccessful()).isTrue();
    assertThat(paymentService.getLastTransaction()).isNotNull();
    assertThat(inventoryService.getStock("Widget")).isEqualTo(8); // Decremented
}
```

### **Contract Tests**: API Boundaries
```typescript
// ✅ Contract test - verify external API expectations
describe('Payment Gateway Contract', () => {
  it('should process payment with expected request format', async () => {
    const paymentRequest = {
      amount: 1000, // cents
      currency: 'USD',
      source: 'tok_visa',
      description: 'Test payment'
    };
    
    const response = await paymentGateway.charge(paymentRequest);
    
    expect(response).toMatchSchema({
      type: 'object',
      required: ['id', 'status', 'amount'],
      properties: {
        id: { type: 'string' },
        status: { enum: ['succeeded', 'failed'] },
        amount: { type: 'number' }
      }
    });
  });
});
```

---

## 📊 **Testing Anti-Patterns to Avoid**

### **1. The Free Giveaway** 
```javascript
// ❌ Test that always passes
test('should work correctly', () => {
  const result = doSomething();
  expect(result).toBeTruthy(); // This passes for any non-falsy value!
});
```

### **2. The Giant** 
```python
# ❌ Test that does too much
def test_user_lifecycle():
    # 50 lines of setup
    # 20 lines of execution
    # 30 lines of assertions
    # This test is doing too much!
```

### **3. The Mockery** 
```java
// ❌ Over-mocking leads to testing mocks, not real behavior
@Test
public void shouldProcessOrder() {
    when(mockValidator.validate(any())).thenReturn(true);
    when(mockRepository.save(any())).thenReturn(mockOrder);
    when(mockEmailService.send(any())).thenReturn(true);
    when(mockPaymentService.charge(any())).thenReturn(mockPayment);
    
    // What is this test actually testing?
    orderService.processOrder(order);
    
    verify(mockValidator).validate(order);
    verify(mockRepository).save(order);
    // Testing interactions with mocks, not real behavior
}
```

### **4. The Secret Catcher** 
```csharp
// ❌ Test catches exceptions but doesn't fail
[Test]
public void ShouldNotThrowException()
{
    try
    {
        methodThatShouldWork();
        // Test passes even if method throws exception!
    }
    catch (Exception ex)
    {
        // Silently caught - test still passes
    }
}
```

### **5. The Sleeper** 
```javascript
// ❌ Tests that rely on timing
test('should process async operation', async () => {
  processAsync();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Fragile!
  expect(isProcessed()).toBe(true);
});
```

---

## 🛠️ **Testing Tools and Frameworks**

### **JavaScript/TypeScript**
- **Jest**: Full-featured testing framework
- **Vitest**: Fast Vite-based testing  
- **Testing Library**: User-centric testing utilities
- **Supertest**: HTTP API testing

### **Python**
- **pytest**: Modern, feature-rich testing
- **unittest**: Built-in testing framework
- **Mock**: Built-in mocking library
- **Hypothesis**: Property-based testing

### **Java**
- **JUnit 5**: Modern Java testing
- **Mockito**: Mocking framework
- **TestContainers**: Integration testing with real services
- **AssertJ**: Fluent assertions

### **C#**
- **NUnit**: Popular .NET testing framework
- **xUnit**: Modern .NET testing
- **Moq**: Mocking framework
- **FluentAssertions**: Readable assertions

---

## 🎯 **Progressive Testing Strategy**

### **Start Simple**
1. **Pure functions** - easiest to test
2. **Single classes** - isolated units
3. **Service layers** - business logic
4. **Integration points** - component collaboration

### **Build Up Gradually**
1. **Happy path tests** first
2. **Edge cases** and error conditions
3. **Performance** and load testing
4. **Security** and penetration testing

### **Measure and Improve**
- **Code coverage** (aim for 80%+ on critical code)
- **Test execution time** (under 10 seconds for unit test suite)
- **Test reliability** (flaky tests are worse than no tests)
- **Test maintainability** (easy to update when requirements change)

---

## 🚀 **Next Steps**

**You've completed Principle 8: Unit Tests and TDD! 🎉**

### **Immediate Next Actions:**
1. **[📝 Practice with Exercises →](../../exercises/principle-practice/08-unit-tests/README.md)** - Master TDD skills
2. **[📋 Use the Daily Checklist](./checklist.md)** - Apply testing best practices
3. **[👀 Study the Examples](../../examples/before-after/testing-examples/README.md)** - See testing transformations

### **Continue Your Learning Journey:**
- **[📖 Next: Principle 9 - Classes →](../09-classes/README.md)** - SOLID principles and design *(coming soon)*
- **[📚 Back to Learning Path](../../LEARNING_PATH.md)** - Continue the Design phase
- **[🎯 Apply to Your Code](../../LEARNING_PATH.md#progress-tracking-and-assessment)** - Add tests to your existing projects

**Ready for advanced design principles?** SOLID and clean class design! **[Start Principle 9 →](../09-classes/README.md)**

---

Remember: Testing is not about finding bugs (though it does that too) - it's about designing better software, documenting behavior, and enabling confident change. When you write tests first, you're not just testing your code - you're designing it to be testable, which usually means it's also more modular, focused, and maintainable!

---

**[🔙 Previous: Boundaries](../07-boundaries/README.md)** | **[📚 Learning Path](../../LEARNING_PATH.md)** | **[📖 Next: Classes →](../09-classes/README.md)**
