# 🏗️ Classes and SOLID Principles - Daily Checklist

Use this checklist to ensure your class designs follow SOLID principles and create maintainable, flexible software architectures.

## 📚 **Quick Navigation**
- **[🔙 Back to Principle 9](./README.md)** - Classes and SOLID Principles
- **[👀 Study Examples](../../examples/before-after/classes-examples/README.md)**
- **[📝 Practice Exercises](../../exercises/principle-practice/09-classes/README.md)**

---

## 🔍 **Pre-Commit SOLID Checklist**

### **🎯 Single Responsibility Principle (SRP)**
- [ ] **One reason to change** - Does each class have only one reason to change?
- [ ] **Clear purpose** - Can you describe what the class does in a single sentence?
- [ ] **Cohesive methods** - Do all methods relate to the class's main responsibility?
- [ ] **No mixed concerns** - Are business logic, data access, and infrastructure separate?
- [ ] **Focused size** - Is the class small enough to understand quickly?

### **🔓 Open/Closed Principle (OCP)**
- [ ] **Extension points** - Can new behavior be added without modifying existing code?
- [ ] **Polymorphism usage** - Are conditionals (if/else, switch) replaced with polymorphism where appropriate?
- [ ] **Strategy patterns** - Are varying algorithms extracted into separate implementations?
- [ ] **Template methods** - Are common processes defined with extension points?
- [ ] **Plugin architecture** - Can new features be added as plugins?

### **🔄 Liskov Substitution Principle (LSP)**
- [ ] **Substitutable implementations** - Can subclasses replace base classes without breaking functionality?
- [ ] **Contract compliance** - Do subclasses fulfill the same contracts as their base classes?
- [ ] **No exceptions** - Do subclasses avoid throwing exceptions not thrown by base classes?
- [ ] **Consistent behavior** - Do subclasses maintain behavioral expectations?
- [ ] **Precondition compatibility** - Do subclasses not strengthen preconditions?

### **🔗 Interface Segregation Principle (ISP)**
- [ ] **Client-specific interfaces** - Do interfaces contain only methods that clients actually use?
- [ ] **Focused contracts** - Are interfaces small and cohesive?
- [ ] **No fat interfaces** - Are large interfaces split into smaller, focused ones?
- [ ] **Role-based design** - Do interfaces represent specific roles or capabilities?
- [ ] **Minimal dependencies** - Do clients depend only on what they need?

### **⬇️ Dependency Inversion Principle (DIP)**
- [ ] **Abstraction dependencies** - Do high-level modules depend on abstractions, not concretions?
- [ ] **Dependency injection** - Are dependencies injected rather than instantiated directly?
- [ ] **Interface ownership** - Are interfaces owned by the client modules that use them?
- [ ] **Stable abstractions** - Do abstractions change less frequently than implementations?
- [ ] **Testable design** - Can components be tested with mock implementations?

---

## 📋 **Code Review Guidelines**

### **🚨 SOLID Violations to Watch For**

#### **SRP Violations:**
```java
// ❌ BAD: Multiple responsibilities in one class
public class User {
    // Data responsibility
    private String name;
    private String email;
    
    // Validation responsibility
    public boolean isValidEmail() { ... }
    
    // Persistence responsibility
    public void save() { ... }
    
    // Email responsibility
    public void sendWelcomeEmail() { ... }
    
    // Password responsibility
    public String hashPassword(String password) { ... }
}
```

#### **OCP Violations:**
```python
# ❌ BAD: Adding new payment types requires modifying existing code
class PaymentProcessor:
    def process_payment(self, payment_type: str, amount: float):
        if payment_type == "credit_card":
            # Credit card processing
        elif payment_type == "paypal":
            # PayPal processing
        elif payment_type == "bitcoin":  # New type requires modification!
            # Bitcoin processing
        else:
            raise ValueError("Unsupported payment type")
```

#### **LSP Violations:**
```csharp
// ❌ BAD: Square breaks Rectangle's contract
public class Rectangle 
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }
}

public class Square : Rectangle 
{
    public override int Width 
    { 
        set { base.Width = base.Height = value; } // Changes both!
    }
    
    public override int Height 
    { 
        set { base.Width = base.Height = value; } // Unexpected behavior!
    }
}
```

#### **ISP Violations:**
```typescript
// ❌ BAD: Fat interface forces unnecessary dependencies
interface Worker {
    work(): void;
    eat(): void;        // Robots don't eat!
    sleep(): void;      // Robots don't sleep!
    receiveSalary(): void; // Robots don't get paid!
}

class RobotWorker implements Worker {
    work(): void { /* works */ }
    eat(): void { throw new Error("Robots don't eat"); }
    sleep(): void { throw new Error("Robots don't sleep"); }
    receiveSalary(): void { throw new Error("Robots don't get paid"); }
}
```

#### **DIP Violations:**
```python
# ❌ BAD: High-level module depends on low-level details
class OrderService:  # High-level module
    def __init__(self):
        self.database = MySQLDatabase()  # Depends on concrete class
        self.email_service = SMTPEmailService()  # Depends on concrete class
    
    def process_order(self, order):
        # Business logic tightly coupled to specific implementations
        self.database.save_order(order)
        self.email_service.send_confirmation(order.customer_email)
```

### **✅ SOLID-Compliant Patterns to Recognize**

#### **Clean SRP Implementation:**
```java
// ✅ GOOD: Each class has single responsibility
public class User {
    // Only data and behavior related to user concept
}

public class UserValidator {
    // Only validation logic
}

public class UserRepository {
    // Only data persistence
}

public class EmailService {
    // Only email sending
}
```

#### **OCP with Strategy Pattern:**
```python
# ✅ GOOD: Open for extension, closed for modification
class PaymentProcessor:
    def __init__(self, strategy: PaymentStrategy):
        self.strategy = strategy
    
    def process_payment(self, amount: float):
        return self.strategy.process(amount)

# New payment types can be added without modifying existing code
class BitcoinPaymentStrategy(PaymentStrategy):
    def process(self, amount: float):
        # Bitcoin-specific implementation
```

#### **LSP-Compliant Inheritance:**
```csharp
// ✅ GOOD: Proper substitution
public abstract class Shape 
{
    public abstract double Area();
}

public class Rectangle : Shape 
{
    public double Width { get; }
    public double Height { get; }
    
    public override double Area() => Width * Height;
}

public class Square : Shape 
{
    public double Side { get; }
    
    public override double Area() => Side * Side;
}
```

#### **ISP with Focused Interfaces:**
```typescript
// ✅ GOOD: Segregated interfaces
interface Workable {
    work(): void;
}

interface Biological {
    eat(): void;
    sleep(): void;
}

interface Employee {
    receiveSalary(): void;
}

class HumanWorker implements Workable, Biological, Employee {
    // Implements all interfaces
}

class RobotWorker implements Workable {
    // Only implements what it can actually do
}
```

#### **DIP with Dependency Injection:**
```python
# ✅ GOOD: Depends on abstractions
class OrderService:
    def __init__(self, database: OrderRepository, email_service: EmailService):
        self.database = database  # Abstraction
        self.email_service = email_service  # Abstraction
    
    def process_order(self, order):
        self.database.save_order(order)
        self.email_service.send_confirmation(order.customer_email)
```

---

## 🎯 **Class Design Decision Tree**

### **When Designing a New Class:**

```
1. What is the single responsibility?
   ├─ Can't describe in one sentence? → Split the class
   └─ Clear purpose? → Continue

2. How will this extend in the future?
   ├─ Likely variations? → Design for OCP
   └─ Stable requirement? → Keep simple

3. Will this be subclassed?
   ├─ Yes → Ensure LSP compliance
   └─ No → Consider composition instead

4. What interfaces will clients need?
   ├─ Different clients need different methods? → Use ISP
   └─ All clients need same interface? → Single interface OK

5. What dependencies does this have?
   ├─ Depends on concrete classes? → Apply DIP
   └─ Depends on abstractions? → Good to go
```

---

## 🔧 **SOLID Refactoring Strategies**

### **SRP Refactoring Checklist:**
- [ ] **Identify responsibilities** - List everything the class does
- [ ] **Group related methods** - Find methods that work together
- [ ] **Extract classes** - Create new classes for each responsibility
- [ ] **Use composition** - Let the original class coordinate
- [ ] **Apply dependency injection** - Inject the new dependencies

### **OCP Refactoring Checklist:**
- [ ] **Find variation points** - Look for if/else or switch statements
- [ ] **Extract interfaces** - Define contracts for varying behavior
- [ ] **Implement strategies** - Create concrete implementations
- [ ] **Use factory patterns** - Let factories create the right implementation
- [ ] **Remove conditionals** - Replace with polymorphic calls

### **LSP Refactoring Checklist:**
- [ ] **Analyze inheritance** - Check for contract violations
- [ ] **Extract interfaces** - Define capabilities instead of inheritance
- [ ] **Use composition** - Prefer composition over inheritance
- [ ] **Ensure substitutability** - Test that subclasses work as expected
- [ ] **Document contracts** - Make expectations explicit

### **ISP Refactoring Checklist:**
- [ ] **Analyze interface usage** - See what methods clients actually use
- [ ] **Group by client needs** - Create interfaces for specific use cases
- [ ] **Split fat interfaces** - Break large interfaces into smaller ones
- [ ] **Use interface composition** - Combine interfaces when needed
- [ ] **Update client dependencies** - Make clients depend on focused interfaces

### **DIP Refactoring Checklist:**
- [ ] **Identify dependencies** - Find direct instantiations of concrete classes
- [ ] **Extract interfaces** - Create abstractions for dependencies
- [ ] **Inject dependencies** - Use constructor, setter, or interface injection
- [ ] **Create composition root** - Set up dependency graph at application startup
- [ ] **Use IoC containers** - Consider dependency injection frameworks for complex scenarios

---

## 📊 **SOLID Metrics and Code Smells**

### **SRP Indicators:**
- **Class size** - Classes > 300 lines likely violate SRP
- **Method count** - Classes with > 20 methods need investigation
- **Import statements** - Many imports suggest mixed responsibilities
- **Change frequency** - Classes that change often may have multiple responsibilities

### **OCP Indicators:**
- **Conditional complexity** - High cyclomatic complexity suggests OCP violations
- **Modification frequency** - Classes modified for new features violate OCP
- **Switch statements** - Type-based switching indicates missing polymorphism
- **Hard-coded values** - Configuration should be externalized

### **LSP Indicators:**
- **Exception throwing** - Subclasses throwing new exceptions
- **Null returns** - Subclasses returning null when base class doesn't
- **Behavioral changes** - Subclasses with surprising behavior
- **Contract violations** - Subclasses not fulfilling base class contracts

### **ISP Indicators:**
- **Unused methods** - Clients implementing methods they don't use
- **Large interfaces** - Interfaces with > 10 methods need review
- **Client coupling** - Clients depending on methods they don't call
- **Interface pollution** - Methods added for one client affecting all

### **DIP Indicators:**
- **Direct instantiation** - new keyword used for dependencies
- **Import coupling** - High-level modules importing low-level modules
- **Testing difficulty** - Hard to test without real dependencies
- **Configuration coupling** - Business logic knowing about configuration details

---

## 🚀 **Daily SOLID Practices**

### **During Development:**
1. **Design interfaces first** - Think about contracts before implementation
2. **Use dependency injection** - Don't create dependencies, inject them
3. **Favor composition** - Use composition over inheritance by default
4. **Extract small classes** - Keep classes focused and small
5. **Write tests first** - TDD naturally leads to SOLID design

### **During Code Review:**
1. **Check class responsibilities** - Can you explain the class purpose in one sentence?
2. **Look for extension points** - How would you add new features?
3. **Verify substitutability** - Can implementations be swapped safely?
4. **Review interface usage** - Do clients use all interface methods?
5. **Examine dependencies** - Are high-level modules depending on abstractions?

### **During Refactoring:**
1. **Start with tests** - Ensure behavior preservation
2. **Refactor gradually** - One principle at a time
3. **Extract first, optimize later** - Get structure right first
4. **Measure coupling** - Use tools to measure dependency metrics
5. **Review with team** - Get feedback on design decisions

---

## 💡 **Quick SOLID Assessment**

Rate each area from 1-5 (5 being excellent):

### **Single Responsibility:**
- [ ] Classes have clear, single purposes
- [ ] Easy to explain what each class does
- [ ] Changes affect only related functionality
- [ ] High cohesion within classes

### **Open/Closed:**
- [ ] New features don't require modifying existing code
- [ ] Use of strategy and template method patterns
- [ ] Plugin-style architecture where appropriate
- [ ] Minimal impact when adding features

### **Liskov Substitution:**
- [ ] Subclasses can replace base classes safely
- [ ] No surprising behavior in inheritance hierarchies
- [ ] Client code works with any implementation
- [ ] Contracts are honored by all implementations

### **Interface Segregation:**
- [ ] Interfaces are focused and role-specific
- [ ] Clients depend only on methods they use
- [ ] No "fat" interfaces with unrelated methods
- [ ] Easy to implement interfaces completely

### **Dependency Inversion:**
- [ ] High-level modules depend on abstractions
- [ ] Dependencies are injected, not created
- [ ] Easy to test with mock implementations
- [ ] Flexible architecture that supports change

---

**Remember**: SOLID principles guide you toward better design, but they're not rigid rules. Use them to create maintainable, flexible software that can evolve with changing requirements. When principles seem to conflict, favor the one that makes your specific codebase more understandable and maintainable.

---

**[🔙 Back to SOLID Principles](./README.md)** | **[👀 Study Examples](../../examples/before-after/classes-examples/README.md)** | **[📝 Practice Exercises](../../exercises/principle-practice/09-classes/README.md)**
