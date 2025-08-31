# 🧪 Unit Tests and TDD - Daily Checklist

Use this checklist to ensure clean, effective testing practices in your daily development work.

## 📚 **Quick Navigation**
- **[🔙 Back to Principle 8](./README.md)** - Unit Tests and TDD
- **[👀 Study Examples](../../examples/before-after/testing-examples/README.md)**
- **[📝 Practice Exercises](../../exercises/principle-practice/08-unit-tests/README.md)**

---

## 🔍 **Pre-Commit Testing Checklist**

### **🧪 Test-Driven Development Process**
- [ ] **Red first** - Did you write a failing test before writing production code?
- [ ] **Minimal implementation** - Is your production code doing just enough to make the test pass?
- [ ] **Green state** - Are all tests passing before you refactor?
- [ ] **Refactor safely** - Did you improve the code while keeping tests green?
- [ ] **One test at a time** - Are you focusing on one failing test at a time?

### **📋 Test Quality (FIRST Principles)**
- [ ] **Fast** - Do unit tests run in milliseconds, not seconds?
- [ ] **Independent** - Can tests run in any order without affecting each other?
- [ ] **Repeatable** - Do tests produce the same results every time?
- [ ] **Self-validating** - Do tests have clear pass/fail results without manual verification?
- [ ] **Timely** - Are tests written at the right time (preferably first)?

### **🎯 Test Structure and Clarity**
- [ ] **AAA pattern** - Does each test clearly Arrange, Act, and Assert?
- [ ] **Descriptive names** - Do test names explain the scenario and expected outcome?
- [ ] **Single responsibility** - Does each test verify one specific behavior?
- [ ] **Clear assertions** - Are test assertions specific and meaningful?
- [ ] **Minimal setup** - Is test setup as simple as possible?

### **🔧 Dependency Management**
- [ ] **Isolated units** - Are external dependencies mocked or stubbed?
- [ ] **Appropriate test doubles** - Are you using the right type (mock/stub/fake) for each dependency?
- [ ] **Interface testing** - Are you testing against interfaces, not implementations?
- [ ] **No database in unit tests** - Are unit tests free from real database dependencies?
- [ ] **No network calls** - Are external services properly mocked?

---

## 📋 **Code Review Guidelines**

### **🚨 Red Flags in Tests**

#### **Slow Tests**
```javascript
// ❌ BAD: Test that takes seconds to run
test('processes large file', async () => {
  const largeFile = await fs.readFile('10GB-file.txt'); // Slow file I/O
  const result = processFile(largeFile);
  expect(result).toBeDefined();
});
```

#### **Flaky Tests**
```python
# ❌ BAD: Test with timing dependencies
def test_async_operation():
    start_async_operation()
    time.sleep(1)  # Flaky timing assumption
    assert operation_complete() == True
```

#### **Testing Implementation Details**
```java
// ❌ BAD: Testing internal method calls instead of behavior
@Test
public void shouldCallRepositoryTwice() {
    userService.getUser(123);
    verify(repository, times(2)).query(any()); // Implementation detail
}
```

#### **Overly Complex Tests**
```csharp
// ❌ BAD: Test with complex logic
[Test]
public void ComplexBusinessLogicTest()
{
    for (int i = 0; i < 100; i++)
    {
        var user = CreateUser(i);
        if (i % 2 == 0)
        {
            // Complex test logic that's hard to understand
            ProcessEvenUsers(user);
        }
        else
        {
            ProcessOddUsers(user);
        }
        ValidateResults(user, i);
    }
}
```

### **✅ Positive Patterns to Recognize**

#### **Clean Test Structure**
```typescript
// ✅ GOOD: Clear AAA pattern with descriptive test
describe('OrderCalculator', () => {
  it('should apply bulk discount for quantities over 10', () => {
    // Arrange
    const calculator = new OrderCalculator();
    const items = [{ price: 10, quantity: 15 }];
    
    // Act
    const total = calculator.calculateTotal(items);
    
    // Assert
    expect(total).toBe(135); // 150 - 15 (10% bulk discount)
  });
});
```

#### **Effective Mocking**
```python
# ✅ GOOD: Mock external service, test business logic
def test_sends_notification_on_large_order(mock_email_service):
    # Arrange
    order_service = OrderService(mock_email_service)
    large_order = Order(total=5000)
    
    # Act
    order_service.process_order(large_order)
    
    # Assert
    mock_email_service.send_alert.assert_called_once_with(
        "Large order alert", large_order
    )
```

#### **Comprehensive Edge Case Coverage**
```java
// ✅ GOOD: Testing edge cases and error conditions
@ParameterizedTest
@ValueSource(strings = {"", " ", "null", "invalid@", "@invalid.com"})
public void shouldRejectInvalidEmails(String invalidEmail) {
    assertThrows(ValidationException.class, () -> {
        emailValidator.validate(invalidEmail);
    });
}
```

---

## 🧪 **Testing Strategy by Layer**

### **Unit Tests** (Fast, Isolated)
- [ ] **Pure functions** tested with various inputs and outputs
- [ ] **Domain logic** tested independently of infrastructure
- [ ] **Business rules** verified with edge cases
- [ ] **Error conditions** tested with appropriate exceptions
- [ ] **Mock interactions** verified for side effects

**Example Structure:**
```
domain/
├── models/        # Test with builders and factories
├── services/      # Test with mocked dependencies
└── validators/    # Test with parameterized tests
```

### **Integration Tests** (Component Collaboration)
- [ ] **Service layer** tested with real repositories (test database)
- [ ] **Repository patterns** tested with actual database
- [ ] **External service adapters** tested with contract tests
- [ ] **Configuration** tested with different environments

**Example Structure:**
```
tests/integration/
├── services/      # Business services with real repos
├── repositories/  # Data access with test database
└── adapters/      # External service integrations
```

### **End-to-End Tests** (Full User Workflows)
- [ ] **Critical user journeys** tested through UI or API
- [ ] **Happy path scenarios** for main features
- [ ] **Error handling** in complete workflows
- [ ] **Performance** under realistic load

---

## 🎯 **Test Organization Patterns**

### **Test Structure**
```
tests/
├── unit/
│   ├── domain/
│   ├── services/
│   └── utils/
├── integration/
│   ├── services/
│   └── repositories/
├── e2e/
│   ├── api/
│   └── ui/
└── fixtures/
    ├── builders/
    └── data/
```

### **Naming Conventions**
```javascript
// ✅ GOOD: Descriptive test names
describe('ShoppingCart', () => {
  describe('addItem', () => {
    it('should increase total price when item is added');
    it('should throw error when adding item with negative price');
    it('should update quantity when same item is added twice');
  });
  
  describe('checkout', () => {
    it('should apply discount for premium customers');
    it('should reject checkout with empty cart');
    it('should send confirmation email after successful checkout');
  });
});
```

### **Test Data Management**
```python
# ✅ GOOD: Test data builders for complex objects
class UserBuilder:
    def __init__(self):
        self.user = User(
            email="test@example.com",
            first_name="Test",
            last_name="User"
        )
    
    def with_email(self, email):
        self.user.email = email
        return self
    
    def as_premium(self):
        self.user.is_premium = True
        return self
    
    def build(self):
        return self.user

# Usage in tests
def test_premium_user_gets_discount():
    user = UserBuilder().as_premium().build()
    order = OrderBuilder().with_total(100).build()
    
    discount = calculate_discount(user, order)
    
    assert discount == 10  # 10% premium discount
```

---

## 🚨 **Anti-Pattern Detection**

### **Test Smells to Watch For:**
- [ ] **Slow tests** (unit tests > 100ms)
- [ ] **Flaky tests** (random failures)
- [ ] **Brittle tests** (break on minor code changes)
- [ ] **Ignored/skipped tests** (tests that are disabled)
- [ ] **Duplicate test logic** (copy-paste test setup)
- [ ] **Testing framework internals** (asserting on test framework behavior)
- [ ] **Production data dependencies** (tests that need real data)

### **Code Smells That Make Testing Hard:**
- [ ] **Static dependencies** (DateTime.Now, Random, File.ReadAllText)
- [ ] **Large classes/methods** (hard to test in isolation)
- [ ] **Deep nesting** (complex setup required)
- [ ] **Multiple responsibilities** (unclear what to test)
- [ ] **Hidden dependencies** (dependencies not injected)

---

## 📊 **Test Metrics and Goals**

### **Coverage Targets:**
- [ ] **Business logic**: 95%+ line coverage
- [ ] **Critical paths**: 100% branch coverage
- [ ] **Edge cases**: All error conditions covered
- [ ] **Integration points**: All external dependencies tested

### **Performance Targets:**
- [ ] **Unit test suite**: < 10 seconds total execution
- [ ] **Individual unit tests**: < 10ms each
- [ ] **Integration tests**: < 30 seconds total
- [ ] **E2E tests**: < 5 minutes for full suite

### **Quality Metrics:**
- [ ] **Test reliability**: 99%+ pass rate in CI/CD
- [ ] **Maintenance burden**: Tests don't slow down development
- [ ] **Documentation value**: Tests clearly explain expected behavior
- [ ] **Regression prevention**: New bugs caught by existing tests

---

## 🔧 **Daily TDD Workflow**

### **Before Starting Feature Work:**
1. **Review requirements** - Understand acceptance criteria
2. **Design test structure** - Plan test cases and scenarios
3. **Set up test environment** - Ensure fast test execution
4. **Create test skeleton** - Write test names and structure

### **During Development:**
1. **Write failing test** - Red: Test fails as expected
2. **Implement minimal code** - Green: Make test pass
3. **Refactor and clean** - Improve design while keeping tests green
4. **Run full test suite** - Ensure no regressions
5. **Commit frequently** - Small commits with working tests

### **Before Pushing Code:**
1. **Run all tests** - Unit, integration, and linting
2. **Check coverage** - Ensure critical paths are tested
3. **Review test quality** - Apply this checklist
4. **Update documentation** - If test behavior reveals new requirements

---

## 💡 **Testing Tools and Setup**

### **Recommended Tool Stack:**

#### **JavaScript/TypeScript:**
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@testing-library/jest-dom": "^5.16.0", 
    "@testing-library/react": "^13.0.0",
    "supertest": "^6.2.0"
  }
}
```

#### **Python:**
```ini
# requirements-test.txt
pytest>=7.0.0
pytest-cov>=4.0.0
pytest-mock>=3.8.0
factory-boy>=3.2.0
```

#### **Java:**
```xml
<dependencies>
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.mockito</groupId>
        <artifactId>mockito-core</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### **IDE Integration:**
- [ ] **Test runners** configured for one-click testing
- [ ] **Coverage reports** visible in editor
- [ ] **Test-driven shortcuts** for Red-Green-Refactor cycle
- [ ] **Auto-test execution** on file save (optional)

---

## 🎯 **Quick Reference**

### **When to Write Different Types of Tests:**
- **Unit Tests**: For every public method/function with business logic
- **Integration Tests**: For components that work together
- **Contract Tests**: For API boundaries and external services
- **E2E Tests**: For critical user workflows and happy paths

### **What NOT to Test:**
- **Third-party library internals** (trust they work)
- **Framework code** (Rails, Spring, etc.)
- **Generated code** (unless it contains business logic)
- **Simple getters/setters** (unless they have validation)

### **Emergency Test Fixes:**
- **Flaky test**: Identify root cause (timing, state, randomness)
- **Slow test**: Profile and mock external dependencies
- **Brittle test**: Test behavior, not implementation
- **Failing CI**: Fix immediately or revert - never ignore

---

**Remember**: Good tests are an investment in your code's future. They enable confident refactoring, catch regressions early, and serve as living documentation of your system's behavior. When tests are hard to write, it's usually telling you something important about your design!

---

**[🔙 Back to Unit Tests Principle](./README.md)** | **[👀 Study Examples](../../examples/before-after/testing-examples/README.md)** | **[📝 Practice Exercises](../../exercises/principle-practice/08-unit-tests/README.md)**
