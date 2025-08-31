# 🏗️ Principle 9: Classes and SOLID Principles

> "The first rule of functions is that they should be small. The first rule of classes is that they should be smaller than that." - Robert C. Martin

SOLID principles are the foundation of good object-oriented design. They guide us in creating classes that are maintainable, extensible, and robust. These principles work together to help you write code that can evolve gracefully over time.

## 📚 **Quick Navigation**
- **[🔙 Previous: Principle 8 - Unit Tests](../08-unit-tests/README.md)** - TDD and testing mastery
- **[📚 Back to Learning Path](../../LEARNING_PATH.md)** - Overall progression
- **[📖 Next: Principle 10 - Systems →](../10-systems/README.md)** - Large-scale architecture *(coming soon)*
- **[👀 Study Examples](../../examples/before-after/classes-examples/README.md)** - See SOLID transformations
- **[📝 Practice Exercises](../../exercises/principle-practice/09-classes/README.md)** - Master class design
- **[📋 Daily Checklist](./checklist.md)** - SOLID design reference

---

## 🎯 **Why SOLID Principles Matter**

### **The Problem: Rigid, Fragile Code**
```java
// ❌ Violates multiple SOLID principles
public class OrderManager {
    public void processOrder(Order order) {
        // SRP violation: Multiple responsibilities
        validateOrder(order);
        calculateTax(order);
        processPayment(order);
        updateInventory(order);
        sendEmail(order);
        logOrder(order);
        
        // OCP violation: Hard to extend without modification
        if (order.getType().equals("STANDARD")) {
            // Standard processing
        } else if (order.getType().equals("PREMIUM")) {
            // Premium processing
        } else if (order.getType().equals("BULK")) {
            // Bulk processing - added later, required class modification
        }
        
        // DIP violation: Depends on concrete classes
        EmailService emailService = new SMTPEmailService();
        PaymentProcessor processor = new StripePaymentProcessor();
        
        // LSP violation: Inconsistent behavior based on type
        if (order instanceof PremiumOrder) {
            ((PremiumOrder) order).applyPremiumDiscount();
        }
    }
}
```

### **The Solution: SOLID Design**
```java
// ✅ Follows SOLID principles
public class OrderProcessor {
    private final OrderValidator validator;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final InventoryService inventoryService;
    
    // SRP: Single responsibility - coordinate order processing
    // DIP: Depends on abstractions, not concretions
    public OrderProcessor(OrderValidator validator,
                         PaymentService paymentService,
                         NotificationService notificationService,
                         InventoryService inventoryService) {
        this.validator = validator;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
        this.inventoryService = inventoryService;
    }
    
    public OrderResult processOrder(Order order) {
        validator.validate(order);
        
        PaymentResult paymentResult = paymentService.processPayment(
            order.getTotal(), order.getPaymentInfo()
        );
        
        if (paymentResult.isSuccessful()) {
            inventoryService.reserveItems(order.getItems());
            notificationService.sendConfirmation(order);
            return OrderResult.success(order.getId());
        }
        
        return OrderResult.failure(paymentResult.getErrorMessage());
    }
}

// OCP: Open for extension, closed for modification
public interface PaymentService {
    PaymentResult processPayment(Money amount, PaymentInfo paymentInfo);
}

// LSP: Substitutable implementations
public class StripePaymentService implements PaymentService { ... }
public class PayPalPaymentService implements PaymentService { ... }
```

---

## 🏗️ **The SOLID Principles**

### **S - Single Responsibility Principle (SRP)**

> "A class should have only one reason to change."

**Core Concept**: Each class should have one job, one reason to exist, and one reason to change.

#### **Identifying Responsibilities:**
```typescript
// ❌ BAD: Multiple responsibilities
class User {
    private name: string;
    private email: string;
    
    // Responsibility 1: User data management
    getName(): string { return this.name; }
    setEmail(email: string): void { this.email = email; }
    
    // Responsibility 2: Validation
    isValidEmail(): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    }
    
    // Responsibility 3: Persistence
    save(): void {
        // Database save logic
    }
    
    // Responsibility 4: Email notifications
    sendWelcomeEmail(): void {
        // Email sending logic
    }
    
    // Responsibility 5: Password management
    hashPassword(password: string): string {
        // Hashing logic
    }
}
```

```typescript
// ✅ GOOD: Single responsibilities
class User {
    constructor(
        private readonly id: UserId,
        private readonly email: Email,
        private readonly name: UserName
    ) {}
    
    getId(): UserId { return this.id; }
    getEmail(): Email { return this.email; }
    getName(): UserName { return this.name; }
}

class EmailValidator {
    static isValid(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

class UserRepository {
    save(user: User): Promise<void> { /* persistence logic */ }
    findById(id: UserId): Promise<User | null> { /* query logic */ }
}

class UserNotificationService {
    sendWelcomeEmail(user: User): Promise<void> { /* email logic */ }
}

class PasswordHasher {
    hash(password: string): HashedPassword { /* hashing logic */ }
    verify(password: string, hash: HashedPassword): boolean { /* verification */ }
}
```

#### **SRP Benefits:**
- **Easier to understand** - each class has a clear purpose
- **Easier to test** - focused responsibility means focused tests
- **Easier to change** - changes affect only one reason
- **Better reusability** - focused classes can be reused in different contexts

---

### **O - Open/Closed Principle (OCP)**

> "Software entities should be open for extension, but closed for modification."

**Core Concept**: You should be able to add new functionality without changing existing code.

#### **Strategy Pattern Example:**
```python
# ❌ BAD: Violates OCP - adding new discount types requires modifying existing code
class PriceCalculator:
    def calculate_discount(self, customer_type: str, amount: float) -> float:
        if customer_type == "regular":
            return amount * 0.05
        elif customer_type == "premium":
            return amount * 0.10
        elif customer_type == "vip":
            return amount * 0.15
        elif customer_type == "corporate":  # Added later - violates OCP
            return amount * 0.20
        else:
            return 0
```

```python
# ✅ GOOD: Follows OCP - new discount types can be added without modification
from abc import ABC, abstractmethod

class DiscountStrategy(ABC):
    @abstractmethod
    def calculate_discount(self, amount: float) -> float:
        pass

class RegularCustomerDiscount(DiscountStrategy):
    def calculate_discount(self, amount: float) -> float:
        return amount * 0.05

class PremiumCustomerDiscount(DiscountStrategy):
    def calculate_discount(self, amount: float) -> float:
        return amount * 0.10

class VIPCustomerDiscount(DiscountStrategy):
    def calculate_discount(self, amount: float) -> float:
        return amount * 0.15

# New discount type - no modification to existing code!
class CorporateCustomerDiscount(DiscountStrategy):
    def calculate_discount(self, amount: float) -> float:
        return amount * 0.20

class PriceCalculator:
    def __init__(self, discount_strategy: DiscountStrategy):
        self.discount_strategy = discount_strategy
    
    def calculate_total(self, amount: float) -> float:
        discount = self.discount_strategy.calculate_discount(amount)
        return amount - discount
```

#### **Template Method Pattern:**
```java
// ✅ OCP with Template Method
public abstract class DataProcessor {
    // Template method - defines the algorithm structure
    public final ProcessResult process(Data data) {
        Data validated = validate(data);
        Data transformed = transform(validated);
        return save(transformed);
    }
    
    // Abstract methods - open for extension
    protected abstract Data validate(Data data);
    protected abstract Data transform(Data data);
    protected abstract ProcessResult save(Data data);
}

// Extension without modification
public class CSVDataProcessor extends DataProcessor {
    @Override
    protected Data validate(Data data) {
        // CSV-specific validation
    }
    
    @Override
    protected Data transform(Data data) {
        // CSV-specific transformation
    }
    
    @Override
    protected ProcessResult save(Data data) {
        // CSV-specific saving
    }
}

public class JSONDataProcessor extends DataProcessor {
    // Different implementation, same interface
}
```

---

### **L - Liskov Substitution Principle (LSP)**

> "Objects of a superclass should be replaceable with objects of its subclasses without breaking the application."

**Core Concept**: Subtypes must be substitutable for their base types without altering program correctness.

#### **LSP Violations and Fixes:**
```csharp
// ❌ BAD: Violates LSP
public abstract class Bird
{
    public abstract void Fly();
}

public class Eagle : Bird
{
    public override void Fly()
    {
        Console.WriteLine("Eagle flies high");
    }
}

public class Penguin : Bird
{
    public override void Fly()
    {
        throw new NotSupportedException("Penguins cannot fly!"); // LSP violation!
    }
}

// Client code breaks with penguin
public void MakeBirdFly(Bird bird)
{
    bird.Fly(); // Crashes if bird is a penguin!
}
```

```csharp
// ✅ GOOD: Follows LSP
public abstract class Bird
{
    public abstract void Move();
    public abstract void Eat();
}

public interface IFlyable
{
    void Fly();
}

public interface ISwimmable
{
    void Swim();
}

public class Eagle : Bird, IFlyable
{
    public override void Move()
    {
        Fly();
    }
    
    public override void Eat()
    {
        Console.WriteLine("Eagle hunts for prey");
    }
    
    public void Fly()
    {
        Console.WriteLine("Eagle soars through the sky");
    }
}

public class Penguin : Bird, ISwimmable
{
    public override void Move()
    {
        Walk();
    }
    
    public override void Eat()
    {
        Console.WriteLine("Penguin catches fish");
    }
    
    public void Swim()
    {
        Console.WriteLine("Penguin swims gracefully");
    }
    
    private void Walk()
    {
        Console.WriteLine("Penguin waddles on land");
    }
}

// Client code works with any bird
public void FeedBird(Bird bird)
{
    bird.Eat(); // Always works
}

// Specific behavior for specific capabilities
public void MakeFlyableFly(IFlyable flyable)
{
    flyable.Fly(); // Only called with flying birds
}
```

#### **Rectangle/Square Problem:**
```python
# ❌ Classic LSP violation
class Rectangle:
    def __init__(self, width: float, height: float):
        self._width = width
        self._height = height
    
    @property
    def width(self) -> float:
        return self._width
    
    @width.setter
    def width(self, value: float):
        self._width = value
    
    @property
    def height(self) -> float:
        return self._height
    
    @height.setter
    def height(self, value: float):
        self._height = value
    
    def area(self) -> float:
        return self._width * self._height

class Square(Rectangle):  # LSP violation
    def __init__(self, side: float):
        super().__init__(side, side)
    
    @Rectangle.width.setter
    def width(self, value: float):
        self._width = value
        self._height = value  # Breaks LSP! Changes both dimensions
    
    @Rectangle.height.setter
    def height(self, value: float):
        self._width = value  # Client doesn't expect this!
        self._height = value

# Client code that breaks with Square
def stretch_rectangle(rectangle: Rectangle):
    rectangle.width = 10
    rectangle.height = 5
    expected_area = 50
    actual_area = rectangle.area()
    assert actual_area == expected_area  # Fails for Square!
```

```python
# ✅ GOOD: LSP-compliant design
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self._width = width
        self._height = height
    
    def area(self) -> float:
        return self._width * self._height
    
    def resize(self, width: float, height: float) -> 'Rectangle':
        return Rectangle(width, height)

class Square(Shape):
    def __init__(self, side: float):
        self._side = side
    
    def area(self) -> float:
        return self._side * self._side
    
    def resize(self, side: float) -> 'Square':
        return Square(side)

# Client code works with any shape
def calculate_total_area(shapes: List[Shape]) -> float:
    return sum(shape.area() for shape in shapes)
```

---

### **I - Interface Segregation Principle (ISP)**

> "Clients should not be forced to depend upon interfaces that they do not use."

**Core Concept**: Many client-specific interfaces are better than one general-purpose interface.

#### **Fat Interface Problem:**
```javascript
// ❌ BAD: Fat interface forces unnecessary dependencies
interface Worker {
    work(): void;
    eat(): void;
    sleep(): void;
    
    // Robot workers don't need these methods!
    takeBreak(): void;
    attendMeeting(): void;
    receiveSalary(): void;
}

class HumanWorker implements Worker {
    work(): void { console.log("Human working"); }
    eat(): void { console.log("Human eating"); }
    sleep(): void { console.log("Human sleeping"); }
    takeBreak(): void { console.log("Human taking break"); }
    attendMeeting(): void { console.log("Human in meeting"); }
    receiveSalary(): void { console.log("Human paid"); }
}

class RobotWorker implements Worker {
    work(): void { console.log("Robot working"); }
    
    // Forced to implement irrelevant methods
    eat(): void { throw new Error("Robots don't eat!"); }
    sleep(): void { throw new Error("Robots don't sleep!"); }
    takeBreak(): void { throw new Error("Robots don't take breaks!"); }
    attendMeeting(): void { throw new Error("Robots don't attend meetings!"); }
    receiveSalary(): void { throw new Error("Robots don't get paid!"); }
}
```

```javascript
// ✅ GOOD: Segregated interfaces
interface Workable {
    work(): void;
}

interface Biological {
    eat(): void;
    sleep(): void;
}

interface Employee {
    takeBreak(): void;
    attendMeeting(): void;
    receiveSalary(): void;
}

class HumanWorker implements Workable, Biological, Employee {
    work(): void { console.log("Human working"); }
    eat(): void { console.log("Human eating"); }
    sleep(): void { console.log("Human sleeping"); }
    takeBreak(): void { console.log("Human taking break"); }
    attendMeeting(): void { console.log("Human in meeting"); }
    receiveSalary(): void { console.log("Human paid"); }
}

class RobotWorker implements Workable {
    work(): void { console.log("Robot working efficiently"); }
    // Only implements what it actually uses!
}

// Client code depends only on what it needs
class WorkManager {
    assignWork(worker: Workable): void {
        worker.work(); // Works with both humans and robots
    }
}

class HRManager {
    processSalary(employee: Employee): void {
        employee.receiveSalary(); // Only works with employees
    }
}
```

#### **Printer Example:**
```java
// ❌ BAD: Clients forced to depend on unused methods
interface MultiFunctionDevice {
    void print(Document doc);
    void scan(Document doc);
    void fax(Document doc);
    void copy(Document doc);
}

class SimplePrinter implements MultiFunctionDevice {
    @Override
    public void print(Document doc) {
        // Actual printing logic
    }
    
    @Override
    public void scan(Document doc) {
        throw new UnsupportedOperationException("Cannot scan");
    }
    
    @Override
    public void fax(Document doc) {
        throw new UnsupportedOperationException("Cannot fax");
    }
    
    @Override
    public void copy(Document doc) {
        throw new UnsupportedOperationException("Cannot copy");
    }
}
```

```java
// ✅ GOOD: Segregated printer interfaces
interface Printer {
    void print(Document doc);
}

interface Scanner {
    void scan(Document doc);
}

interface FaxMachine {
    void fax(Document doc);
}

interface Copier {
    void copy(Document doc);
}

class SimplePrinter implements Printer {
    @Override
    public void print(Document doc) {
        // Printing logic only
    }
}

class MultiFunctionPrinter implements Printer, Scanner, Copier {
    @Override
    public void print(Document doc) { /* print logic */ }
    
    @Override
    public void scan(Document doc) { /* scan logic */ }
    
    @Override
    public void copy(Document doc) { /* copy logic */ }
}

// Clients depend only on what they need
class PrintJobManager {
    private final Printer printer;
    
    public PrintJobManager(Printer printer) {
        this.printer = printer;
    }
    
    public void processPrintJob(Document doc) {
        printer.print(doc); // Only needs printing capability
    }
}
```

---

### **D - Dependency Inversion Principle (DIP)**

> "High-level modules should not depend on low-level modules. Both should depend on abstractions."

**Core Concept**: Depend on abstractions, not concretions. Invert the direction of dependencies.

#### **Traditional Dependency Flow:**
```python
# ❌ BAD: High-level module depends on low-level modules
class MySQLDatabase:
    def save_user(self, user_data: dict) -> None:
        # MySQL-specific database code
        pass

class EmailService:
    def send_email(self, to: str, subject: str, body: str) -> None:
        # SMTP email sending code
        pass

class UserService:  # High-level module
    def __init__(self):
        self.database = MySQLDatabase()  # Depends on concrete class
        self.email_service = EmailService()  # Depends on concrete class
    
    def register_user(self, user_data: dict) -> None:
        # Business logic
        self.database.save_user(user_data)
        self.email_service.send_email(
            user_data['email'], 
            "Welcome!", 
            "Welcome to our service!"
        )
        
# Problems:
# - Hard to test (requires real database and email service)
# - Hard to change database or email provider
# - Tight coupling to specific implementations
```

#### **Inverted Dependencies:**
```python
# ✅ GOOD: Both depend on abstractions
from abc import ABC, abstractmethod

# Abstractions (interfaces)
class UserRepository(ABC):
    @abstractmethod
    def save_user(self, user_data: dict) -> None:
        pass

class NotificationService(ABC):
    @abstractmethod
    def send_welcome_notification(self, email: str) -> None:
        pass

# High-level module depends on abstractions
class UserService:
    def __init__(self, 
                 user_repository: UserRepository,
                 notification_service: NotificationService):
        self.user_repository = user_repository
        self.notification_service = notification_service
    
    def register_user(self, user_data: dict) -> None:
        # Pure business logic
        self.user_repository.save_user(user_data)
        self.notification_service.send_welcome_notification(user_data['email'])

# Low-level modules implement abstractions
class MySQLUserRepository(UserRepository):
    def save_user(self, user_data: dict) -> None:
        # MySQL implementation
        pass

class PostgreSQLUserRepository(UserRepository):
    def save_user(self, user_data: dict) -> None:
        # PostgreSQL implementation
        pass

class EmailNotificationService(NotificationService):
    def send_welcome_notification(self, email: str) -> None:
        # Email implementation
        pass

class SMSNotificationService(NotificationService):
    def send_welcome_notification(self, phone: str) -> None:
        # SMS implementation
        pass

# Dependency injection - composition root
def create_user_service() -> UserService:
    user_repository = MySQLUserRepository()
    notification_service = EmailNotificationService()
    return UserService(user_repository, notification_service)

# Easy to test with mocks
def test_user_registration():
    mock_repository = Mock(spec=UserRepository)
    mock_notification = Mock(spec=NotificationService)
    user_service = UserService(mock_repository, mock_notification)
    
    user_service.register_user({'email': 'test@example.com'})
    
    mock_repository.save_user.assert_called_once()
    mock_notification.send_welcome_notification.assert_called_once_with('test@example.com')
```

#### **Dependency Injection Patterns:**

**Constructor Injection (Recommended):**
```typescript
class OrderService {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly inventoryService: InventoryService,
        private readonly notificationService: NotificationService
    ) {}
    
    processOrder(order: Order): OrderResult {
        // Use injected dependencies
    }
}
```

**Setter Injection:**
```csharp
public class ReportGenerator
{
    public IDataSource DataSource { get; set; }
    public IReportFormatter Formatter { get; set; }
    
    public Report GenerateReport()
    {
        if (DataSource == null || Formatter == null)
            throw new InvalidOperationException("Dependencies not set");
        
        var data = DataSource.GetData();
        return Formatter.Format(data);
    }
}
```

**Interface Injection:**
```java
interface DatabaseConfigurable {
    void setDatabase(Database database);
}

public class UserRepository implements DatabaseConfigurable {
    private Database database;
    
    @Override
    public void setDatabase(Database database) {
        this.database = database;
    }
}
```

---

## 🔄 **SOLID Principles Working Together**

The SOLID principles work synergistically to create maintainable, flexible software:

```java
// ✅ All SOLID principles working together
public class OrderProcessingSystem {
    
    // SRP: Each class has a single responsibility
    public static class Order {
        private final OrderId id;
        private final CustomerId customerId;
        private final List<OrderItem> items;
        private final Money total;
        
        // Domain object with single responsibility
    }
    
    // ISP: Segregated interfaces
    public interface PaymentProcessor {
        PaymentResult process(Money amount, PaymentMethod method);
    }
    
    public interface InventoryManager {
        boolean reserveItems(List<OrderItem> items);
        void releaseItems(List<OrderItem> items);
    }
    
    public interface NotificationSender {
        void sendConfirmation(Order order);
    }
    
    // OCP: Open for extension through strategy pattern
    public abstract class DiscountStrategy {
        public abstract Money calculateDiscount(Order order);
    }
    
    public static class PremiumDiscountStrategy extends DiscountStrategy {
        @Override
        public Money calculateDiscount(Order order) {
            return order.getTotal().multiply(0.1); // 10% discount
        }
    }
    
    // LSP: Substitutable implementations
    public static class CreditCardProcessor implements PaymentProcessor {
        @Override
        public PaymentResult process(Money amount, PaymentMethod method) {
            // Credit card processing
            return PaymentResult.success();
        }
    }
    
    public static class PayPalProcessor implements PaymentProcessor {
        @Override
        public PaymentResult process(Money amount, PaymentMethod method) {
            // PayPal processing
            return PaymentResult.success();
        }
    }
    
    // DIP: High-level module depends on abstractions
    public static class OrderProcessor {
        private final PaymentProcessor paymentProcessor;
        private final InventoryManager inventoryManager;
        private final NotificationSender notificationSender;
        private final DiscountStrategy discountStrategy;
        
        public OrderProcessor(PaymentProcessor paymentProcessor,
                             InventoryManager inventoryManager,
                             NotificationSender notificationSender,
                             DiscountStrategy discountStrategy) {
            this.paymentProcessor = paymentProcessor;
            this.inventoryManager = inventoryManager;
            this.notificationSender = notificationSender;
            this.discountStrategy = discountStrategy;
        }
        
        public OrderResult processOrder(Order order) {
            // SRP: Single responsibility - orchestrate order processing
            
            if (!inventoryManager.reserveItems(order.getItems())) {
                return OrderResult.failure("Insufficient inventory");
            }
            
            Money discount = discountStrategy.calculateDiscount(order);
            Money finalAmount = order.getTotal().subtract(discount);
            
            PaymentResult paymentResult = paymentProcessor.process(
                finalAmount, order.getPaymentMethod()
            );
            
            if (paymentResult.isSuccessful()) {
                notificationSender.sendConfirmation(order);
                return OrderResult.success(order.getId());
            } else {
                inventoryManager.releaseItems(order.getItems());
                return OrderResult.failure(paymentResult.getErrorMessage());
            }
        }
    }
}
```

---

## 🚀 **Next Steps**

**You've completed Principle 9: Classes and SOLID Principles! 🎉**

### **Immediate Next Actions:**
1. **[📝 Practice with Exercises →](../../exercises/principle-practice/09-classes/README.md)** - Master SOLID design through refactoring
2. **[📋 Use the Daily Checklist](./checklist.md)** - Apply SOLID principles in daily coding
3. **[👀 Study the Examples](../../examples/before-after/classes-examples/README.md)** - See dramatic class design transformations

### **Continue Your Learning Journey:**
- **[📖 Next: Principle 10 - Systems →](../10-systems/README.md)** - Large-scale architecture and design *(coming soon)*
- **[📚 Back to Learning Path](../../LEARNING_PATH.md)** - Complete your clean code mastery
- **[🎯 Apply to Your Code](../../LEARNING_PATH.md#progress-tracking-and-assessment)** - Refactor your classes with SOLID principles

**Ready for the final principle?** Systems and Architecture! **[Start Principle 10 →](../10-systems/README.md)**

---

## 💡 **Key Takeaways**

1. **SRP**: One class, one responsibility, one reason to change
2. **OCP**: Design for extension without modification
3. **LSP**: Subtypes must be substitutable for their base types
4. **ISP**: Many small interfaces beat one large interface
5. **DIP**: Depend on abstractions, inject dependencies

**Remember**: SOLID principles guide you toward better design, but they're not rules to follow blindly. Use them to create code that's easy to understand, test, and change. When principles conflict, favor the one that makes your specific codebase more maintainable.

The goal is **maintainable, flexible software** that can evolve with changing requirements!

---

**[🔙 Previous: Unit Tests](../08-unit-tests/README.md)** | **[📚 Learning Path](../../LEARNING_PATH.md)** | **[📖 Next: Systems →](../10-systems/README.md)**
