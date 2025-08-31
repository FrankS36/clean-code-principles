# 🧪 Unit Tests and TDD Examples

These examples demonstrate how to transform untested, hard-to-test code into clean, well-tested, maintainable software using Test-Driven Development principles.

## 📚 **Quick Navigation**
- **[🔙 Back to Principle 8](../../../principles/08-unit-tests/README.md)** - Unit Tests and TDD
- **[📝 Practice Exercises](../../../exercises/principle-practice/08-unit-tests/README.md)**
- **[📋 Daily Checklist](../../../principles/08-unit-tests/checklist.md)**

---

## 🎯 **What You'll Learn**

### **The Problem: Untestable Code**
- Functions that are too large and do too much
- Hard dependencies that can't be mocked
- Code without clear interfaces or contracts
- Business logic mixed with infrastructure concerns

### **The Solution: Test-Driven Design**
- Small, focused functions with single responsibilities
- Dependency injection for testable architecture
- Clear separation between pure logic and side effects
- Comprehensive test coverage with fast execution

---

## 📁 **Example Files**

### **1. Basic Unit Testing Examples**
- **[`untested-calculator-bad.js`](./untested-calculator-bad.js)** - Untested business logic with hidden complexity
- **[`well-tested-calculator-good.js`](./well-tested-calculator-good.js)** - TDD approach with comprehensive tests

### **2. Test-Driven Development Examples** 
- **[`no-tdd-user-service-bad.py`](./no-tdd-user-service-bad.py)** - Written without tests, hard to modify
- **[`tdd-user-service-good.py`](./tdd-user-service-good.py)** - Built with TDD, easy to extend and maintain

### **3. Mocking and Dependency Injection**
- **[`tightly-coupled-bad.java`](./tightly-coupled-bad.java)** - Hard dependencies, impossible to unit test
- **[`dependency-injection-good.java`](./dependency-injection-good.java)** - Clean architecture with proper testing

### **4. Testing Strategy Examples**
- **[`mixed-concerns-bad.cs`](./mixed-concerns-bad.cs)** - Business logic mixed with infrastructure
- **[`clean-architecture-good.cs`](./clean-architecture-good.cs)** - Layered approach with focused tests

---

## 🚀 **Key Transformations**

### **Before: Testing as an Afterthought**
```
Code First → Hope It Works → Debug Issues → Try to Add Tests Later
     ↓              ↓                ↓                    ↓
Hard to Test → Complex Bugs → Fragile Code → Technical Debt
```

### **After: Test-Driven Development**
```
Test First → Simple Implementation → Refactor → Repeat
     ↓                ↓                    ↓        ↓
Clear API → Working Code → Clean Design → Maintainable
```

---

## 💡 **Study Order**

1. **Start with calculator examples** - See how TDD shapes simple algorithms
2. **Review user service examples** - Understand testing with dependencies
3. **Examine dependency injection examples** - Learn testing architecture patterns
4. **Study architecture examples** - See how testing drives clean design

Each example shows the same functionality implemented two ways - the difference in maintainability, testability, and code quality is dramatic!

---

## 🎯 **What to Look For**

### **In the "Bad" Examples:**
- Functions that are hard to test in isolation
- Missing edge case handling
- No clear error handling strategy
- Code that requires real databases, APIs, or file systems to test

### **In the "Good" Examples:**
- Small, focused functions with single responsibilities
- Comprehensive test coverage including edge cases
- Clear mocking strategies for external dependencies
- Fast-running tests that can be executed frequently

### **Testing Principles Applied:**
- **FIRST principles** (Fast, Independent, Repeatable, Self-validating, Timely)
- **AAA pattern** (Arrange, Act, Assert)
- **Red-Green-Refactor cycle**
- **Appropriate use of test doubles** (stubs, mocks, fakes)

---

**[📖 Back to Unit Tests Principle](../../../principles/08-unit-tests/README.md)** | **[📝 Practice with Exercises](../../../exercises/principle-practice/08-unit-tests/README.md)**
