# 🧪 Unit Tests and TDD - Practice Exercises

Master Test-Driven Development and create bulletproof, maintainable code through comprehensive testing!

## 📚 **Quick Navigation**
- **[🔙 Back to Principle 8](../../../principles/08-unit-tests/README.md)** - Unit Tests and TDD
- **[👀 Study Examples](../../../examples/before-after/testing-examples/README.md)**
- **[📋 Daily Checklist](../../../principles/08-unit-tests/checklist.md)**

---

## 🎯 **Learning Objectives**

By completing these exercises, you will:
- ✅ **Master the Red-Green-Refactor cycle** of Test-Driven Development
- ✅ **Write fast, reliable unit tests** that catch bugs before production
- ✅ **Design testable code** with proper dependency injection and separation of concerns
- ✅ **Use mocks and stubs effectively** to isolate units under test
- ✅ **Apply FIRST principles** (Fast, Independent, Repeatable, Self-validating, Timely)
- ✅ **Create comprehensive test suites** with edge case coverage

---

## 🏋️ **Exercise Progression**

### **📚 Beginner Level**

#### **Exercise 1: Your First TDD Kata - FizzBuzz**
**Goal:** Learn the Red-Green-Refactor cycle with a simple problem

**Problem Statement:**
Write a function that takes a number and returns:
- "Fizz" if the number is divisible by 3
- "Buzz" if the number is divisible by 5  
- "FizzBuzz" if the number is divisible by both 3 and 5
- The number itself as a string otherwise

**TDD Steps to Follow:**
1. **🔴 Red**: Write a failing test
2. **🟢 Green**: Write minimal code to pass
3. **🔄 Refactor**: Improve the code while keeping tests green

**Starting Template:**
```python
# test_fizzbuzz.py - Start here!
import unittest

class TestFizzBuzz(unittest.TestCase):
    def test_returns_1_for_1(self):
        # Write your first test here
        pass

# fizzbuzz.py - Implement here
def fizz_buzz(number):
    # Start with the simplest implementation
    pass
```

**Expected Progression:**
1. Test: number 1 returns "1" → Implement: return "1"
2. Test: number 2 returns "2" → Implement: return str(number)
3. Test: number 3 returns "Fizz" → Implement: if divisible by 3...
4. Continue building up functionality test by test

**Success Criteria:**
- [ ] All tests pass with 100% coverage
- [ ] Each test was written before implementation
- [ ] Code handles edge cases (0, negative numbers)
- [ ] Final implementation is clean and readable

---

#### **Exercise 2: Testing with Dependencies - Bank Account**
**Goal:** Learn to test classes with dependencies and state

**Problem Statement:**
Create a `BankAccount` class that:
- Has a balance (starting at 0)
- Can deposit money (positive amounts only)
- Can withdraw money (if sufficient balance)
- Can transfer money to another account
- Maintains a transaction history
- Sends notifications for large transactions

**Key Learning Points:**
- Testing object state and behavior
- Mocking external dependencies (notification service)
- Testing error conditions and edge cases

**Starting Structure:**
```typescript
// Define interfaces first (TDD drives good design!)
interface NotificationService {
  sendAlert(message: string, amount: number): void;
}

interface Transaction {
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  timestamp: Date;
  description?: string;
}

class BankAccount {
  // Implement with TDD
}
```

**Tests to Write (in order):**
1. New account starts with zero balance
2. Can deposit positive amounts
3. Balance increases after deposit
4. Cannot deposit negative amounts
5. Can withdraw with sufficient funds
6. Cannot withdraw more than balance
7. Can transfer between accounts
8. Maintains transaction history
9. Sends notifications for large transactions (>$10,000)

**Advanced Requirements:**
- Account numbers are auto-generated and unique
- Daily withdrawal limits ($5,000)
- Overdraft protection with fees
- Account freezing capability

---

### **🎯 Intermediate Level**

#### **Exercise 3: Mocking External Services - Weather Dashboard**
**Goal:** Master mocking strategies and testing with external APIs

**Problem Statement:**
Create a weather dashboard that:
- Fetches weather data from an external API
- Caches results for 5 minutes
- Provides weather alerts for severe conditions
- Sends notifications to subscribed users
- Handles API failures gracefully with fallback data

**Services to Mock:**
```java
// External services that need mocking
interface WeatherAPI {
    WeatherData getCurrentWeather(String city);
    List<WeatherData> getForecast(String city, int days);
}

interface NotificationService {
    void sendAlert(String userId, String message);
}

interface CacheService {
    Optional<WeatherData> get(String key);
    void put(String key, WeatherData data, Duration ttl);
}

// Your implementation
public class WeatherDashboard {
    // Implement with comprehensive tests
}
```

**Testing Scenarios:**
1. **Happy Path**: API returns data, cache is updated
2. **Cache Hit**: Recent data available, no API call made
3. **Cache Miss**: No cached data, API is called
4. **API Failure**: Service handles gracefully with cached data
5. **Severe Weather**: Alerts are sent to all subscribers
6. **Rate Limiting**: API calls are throttled appropriately

**Mocking Strategies to Practice:**
- **Stubs**: Return predetermined weather data
- **Mocks**: Verify notification service interactions
- **Fakes**: In-memory cache for fast tests
- **Spies**: Track API call frequency

**Success Criteria:**
- [ ] 95%+ test coverage with fast execution (<100ms)
- [ ] All external dependencies are mocked
- [ ] Tests are isolated and don't affect each other
- [ ] Error scenarios are thoroughly tested
- [ ] Mock interactions are verified appropriately

---

#### **Exercise 4: Testing Legacy Code - E-commerce Order Processor**
**Goal:** Learn to add tests to existing untested code

**Scenario:** 
You've inherited a legacy order processing system with zero tests. It's working in production but is fragile and scary to modify. Your task is to add comprehensive tests so the team can safely refactor and add features.

**Given Legacy Code:**
```csharp
// Legacy OrderProcessor.cs - No tests, tightly coupled, hard to test
public class OrderProcessor
{
    public OrderResult ProcessOrder(Order order)
    {
        // 200+ lines of complex business logic
        // Direct database calls
        // Hard-coded email sending
        // Complex tax calculations
        // No dependency injection
        // Mixed concerns everywhere
    }
}
```

**Your Testing Strategy:**
1. **Characterization Tests**: Document current behavior
2. **Golden Master Testing**: Capture outputs for known inputs
3. **Seam Injection**: Find places to inject test dependencies
4. **Extract and Override**: Pull out testable methods
5. **Incremental Refactoring**: Improve design while maintaining tests

**Steps to Follow:**
1. **Phase 1**: Write tests for current behavior (warts and all)
2. **Phase 2**: Extract pure functions and test them
3. **Phase 3**: Inject dependencies to break external connections
4. **Phase 4**: Refactor to clean architecture with full test coverage

**Tools and Techniques:**
- Approval testing for complex outputs
- Test data builders for complex object setup
- Extract method refactoring
- Dependency breaking techniques

---

### **🚀 Advanced Level**

#### **Exercise 5: Full TDD Project - Task Management API**
**Goal:** Build a complete feature using strict TDD from start to finish

**Project Requirements:**
Build a REST API for task management with these features:
- User registration and authentication
- Create, read, update, delete tasks
- Task assignment and collaboration
- Due date tracking and notifications
- Task filtering and search
- Activity logging and audit trail

**TDD Constraints:**
- **Zero production code** without a failing test first
- **Tests must be written** in the order of user value
- **Refactor constantly** to maintain clean design
- **Mock all external dependencies** (database, email, time)

**Architecture to Emerge:**
```
Controllers → Services → Repositories → Domain Models
     ↓           ↓           ↓             ↓
    Tests     Tests       Tests        Tests
```

**Feature Implementation Order:**
1. **Task Creation**: Users can create basic tasks
2. **Task Listing**: Users can view their tasks
3. **Task Updates**: Users can modify task details
4. **Due Dates**: Tasks can have deadlines
5. **Task Assignment**: Tasks can be assigned to other users
6. **Notifications**: Overdue task alerts
7. **Search/Filter**: Find tasks by criteria
8. **Audit Log**: Track all changes

**Testing Strategy:**
- **Unit Tests**: Test domain logic in isolation
- **Integration Tests**: Test service layer interactions
- **Contract Tests**: Verify API responses
- **End-to-End Tests**: Full user workflows

**Success Criteria:**
- [ ] 100% test coverage on business logic
- [ ] All tests pass and run in under 5 seconds
- [ ] Zero manual testing required for new features
- [ ] Code is easy to understand and modify
- [ ] New features can be added with confidence

---

## 🎮 **Bonus Challenges**

### **Challenge 1: Property-Based Testing**
Use property-based testing tools (Hypothesis for Python, QuickCheck for Haskell, etc.) to:
- Generate random test data automatically
- Find edge cases you wouldn't think of manually
- Test mathematical properties of your functions

### **Challenge 2: Performance Testing**
Add performance tests to your code:
- Measure execution time for critical paths
- Test memory usage and garbage collection
- Ensure algorithms scale as expected

### **Challenge 3: Mutation Testing**
Use mutation testing tools to evaluate test quality:
- Introduce bugs automatically
- Verify your tests catch the mutations
- Improve test coverage based on results

### **Challenge 4: Contract Testing**
For APIs and microservices:
- Define contracts between services
- Test consumer expectations against provider implementations
- Ensure API changes don't break consumers

---

## 📊 **Self-Assessment Checklist**

After completing each exercise, verify you can:

### **TDD Process:**
- [ ] Write failing tests before any production code
- [ ] Make tests pass with minimal implementation
- [ ] Refactor code while keeping tests green
- [ ] Identify when to write the next test

### **Test Quality:**
- [ ] Tests are fast (unit tests under 10ms each)
- [ ] Tests are independent and can run in any order
- [ ] Tests have clear, descriptive names
- [ ] Each test verifies one specific behavior

### **Design Impact:**
- [ ] TDD improves your code design
- [ ] Dependencies are injected, not hard-coded
- [ ] Functions/methods have single responsibilities
- [ ] Code is easier to understand and modify

### **Mocking Skills:**
- [ ] Know when to use mocks vs stubs vs fakes
- [ ] Can isolate units under test effectively
- [ ] Verify interactions when appropriate
- [ ] Don't over-mock or test implementation details

---

## 💡 **Tips for Success**

### **TDD Best Practices:**
1. **Start with the simplest test** - build complexity gradually
2. **Test behavior, not implementation** - focus on what, not how
3. **Keep tests focused** - one assertion per test when possible
4. **Refactor fearlessly** - tests provide safety net
5. **Listen to your tests** - hard to test code is usually poorly designed

### **Common Pitfalls to Avoid:**
1. **Writing too many tests at once** - stick to one at a time
2. **Testing implementation details** - mock roles, not objects
3. **Slow tests** - mock external dependencies
4. **Flaky tests** - eliminate randomness and timing issues
5. **Ignored failing tests** - fix or delete, never ignore

### **Tools and Resources:**
- **JavaScript**: Jest, Vitest, Testing Library
- **Python**: pytest, unittest, mock
- **Java**: JUnit 5, Mockito, AssertJ
- **C#**: NUnit, xUnit, Moq
- **General**: Test data builders, approval testing libraries

---

## 🚀 **Next Steps**

**Completed the exercises?** Excellent! Now you're ready to:

1. **[📋 Use the Daily Checklist](../../../principles/08-unit-tests/checklist.md)** - Apply testing best practices daily
2. **[🎯 Apply to Your Projects](../../../LEARNING_PATH.md#progress-tracking-and-assessment)** - Add tests to existing code
3. **[📖 Continue Learning](../../../LEARNING_PATH.md)** - Move to advanced design principles

**Ready for the next level?** Continue with Principle 9: Classes and SOLID principles!

---

## 🔧 **Exercise Templates and Starter Code**

Each exercise includes:
- **Starter templates** in multiple languages
- **Solution examples** (try on your own first!)
- **Additional challenges** for extended practice
- **Code review checklists** for self-assessment

**Remember**: The goal isn't just to make tests pass - it's to use tests to drive better design and create maintainable, robust software!

---

**[🔙 Back to Unit Tests Principle](../../../principles/08-unit-tests/README.md)** | **[👀 Study Examples](../../../examples/before-after/testing-examples/README.md)** | **[📋 Daily Checklist](../../../principles/08-unit-tests/checklist.md)**
