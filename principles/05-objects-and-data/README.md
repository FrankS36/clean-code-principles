# Principle 5: Objects and Data Structures

> *"Objects hide their data behind abstractions and expose functions that operate on that data. Data structures expose their data and have no meaningful functions."* - Robert C. Martin

## 🧭 **Navigation**
← **[Previous: Formatting](../04-formatting/README.md)** | **[Learning Path](../../LEARNING_PATH.md)** | **[Next: Error Handling →](../06-error-handling/README.md)**

**This Principle:** [Examples](../../examples/before-after/objects-examples/README.md) | [Exercises](../../exercises/principle-practice/05-objects/README.md) | [Checklist](./checklist.md)

## 🎯 Overview

Objects and data structures represent two fundamentally different approaches to organizing code. Understanding when and how to use each approach is crucial for creating clean, maintainable systems. This principle teaches you to make conscious decisions about data organization and abstraction.

## 📚 Core Guidelines

### 1. **Data Abstraction**
Hide implementation details behind clean interfaces that express intent rather than structure.

**✅ Good Example:**
```java
public class Point {
    public double getX();
    public double getY();
    public void setCartesian(double x, double y);
    public double getR();
    public double getTheta();
    public void setPolar(double r, double theta);
}
```

**❌ Bad Example:**
```java
public class Point {
    public double x;
    public double y;
}
```

**Why it matters**: The good example allows different coordinate systems without exposing implementation details.

### 2. **Objects vs Data Structures**
Choose the right tool for the job - objects for behavior, data structures for data transport.

**Objects (Hide data, expose behavior):**
```typescript
class OrderProcessor {
    private items: OrderItem[];
    private discount: number;
    
    public calculateTotal(): number {
        const subtotal = this.items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);
        return subtotal - (subtotal * this.discount);
    }
    
    public applyDiscount(percentage: number): void {
        this.discount = Math.max(0, Math.min(1, percentage));
    }
}
```

**Data Structures (Expose data, minimal behavior):**
```typescript
interface OrderData {
    readonly customerId: string;
    readonly items: ReadonlyArray<OrderItemData>;
    readonly timestamp: Date;
    readonly totalAmount: number;
}
```

### 3. **Tell Don't Ask**
Tell objects what to do rather than asking for their data to do it yourself.

**✅ Good (Tell):**
```python
class BankAccount:
    def __init__(self, balance: float):
        self._balance = balance
    
    def withdraw(self, amount: float) -> bool:
        if self._can_withdraw(amount):
            self._balance -= amount
            self._log_transaction("withdraw", amount)
            return True
        return False
    
    def _can_withdraw(self, amount: float) -> bool:
        return amount > 0 and amount <= self._balance

# Usage
account = BankAccount(1000)
success = account.withdraw(50)  # Tell the account to withdraw
```

**❌ Bad (Ask):**
```python
class BankAccount:
    def __init__(self, balance: float):
        self.balance = balance  # Exposed data

# Usage - violates Tell Don't Ask
account = BankAccount(1000)
if account.balance >= 50:  # Ask for data
    account.balance -= 50  # Manipulate it directly
```

### 4. **Law of Demeter (Principle of Least Knowledge)**
An object should only talk to its immediate friends, not to strangers.

**✅ Good:**
```java
public class Customer {
    private Address address;
    
    public String getCity() {
        return address.getCity();  // Delegate to direct dependency
    }
}

// Usage
String city = customer.getCity();  // One method call
```

**❌ Bad:**
```java
public class Customer {
    public Address getAddress() {
        return address;
    }
}

// Usage - violates Law of Demeter
String city = customer.getAddress().getCity();  // Chain of calls
```

### 5. **Encapsulation**
Control access to object internals and maintain invariants.

**✅ Good:**
```csharp
public class Temperature {
    private readonly double _celsius;
    
    private Temperature(double celsius) {
        if (celsius < -273.15) {
            throw new ArgumentException("Temperature cannot be below absolute zero");
        }
        _celsius = celsius;
    }
    
    public static Temperature FromCelsius(double celsius) => new Temperature(celsius);
    public static Temperature FromFahrenheit(double fahrenheit) => 
        new Temperature((fahrenheit - 32) * 5.0 / 9.0);
    
    public double ToCelsius() => _celsius;
    public double ToFahrenheit() => (_celsius * 9.0 / 5.0) + 32;
}
```

### 6. **Hybrid Confusion**
Avoid creating objects that are half object, half data structure.

**❌ Bad (Hybrid):**
```javascript
class User {
    constructor() {
        this.name = '';      // Public data
        this.email = '';     // Public data
        this.isActive = true; // Public data
    }
    
    // But also has behavior mixed in
    validateEmail() {
        return this.email.includes('@');
    }
    
    // Behavior that manipulates public data
    activate() {
        this.isActive = true;
    }
}
```

**✅ Good (Clear Object):**
```javascript
class User {
    constructor(name, email) {
        this._name = name;
        this._email = email;
        this._isActive = true;
    }
    
    get name() { return this._name; }
    get email() { return this._email; }
    get isActive() { return this._isActive; }
    
    validateEmail() {
        return this._email.includes('@');
    }
    
    activate() {
        this._isActive = true;
    }
    
    deactivate() {
        this._isActive = false;
    }
}
```

### 7. **Data Transfer Objects (DTOs)**
Use simple data structures for transferring data between boundaries.

**✅ Good DTO:**
```python
from dataclasses import dataclass
from typing import List
from datetime import datetime

@dataclass(frozen=True)  # Immutable
class UserDTO:
    id: str
    name: str
    email: str
    created_at: datetime
    roles: List[str]
    
    # No business logic - pure data transport
```

## 🎨 Design Patterns

### 1. **Active Record Pattern**
For simple objects where data and behavior are tightly coupled.

```ruby
class User < ActiveRecord::Base
    validates :email, presence: true, uniqueness: true
    
    def full_name
        "#{first_name} #{last_name}"
    end
    
    def can_edit?(resource)
        admin? || resource.owner == self
    end
end
```

### 2. **Repository Pattern**
Separate data access from business logic.

```typescript
interface UserRepository {
    findById(id: string): Promise<User | null>;
    save(user: User): Promise<void>;
    findByEmail(email: string): Promise<User | null>;
}

class DatabaseUserRepository implements UserRepository {
    async findById(id: string): Promise<User | null> {
        // Database implementation
    }
    
    async save(user: User): Promise<void> {
        // Database implementation
    }
}
```

### 3. **Value Objects**
For immutable objects representing a concept.

```java
public final class Money {
    private final BigDecimal amount;
    private final Currency currency;
    
    public Money(BigDecimal amount, Currency currency) {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount cannot be negative");
        }
        this.amount = amount;
        this.currency = currency;
    }
    
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Cannot add different currencies");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }
    
    // Immutable - no setters
    public BigDecimal getAmount() { return amount; }
    public Currency getCurrency() { return currency; }
}
```

## 🎯 When to Use What

### Use Objects When:
- You need to **control behavior and maintain invariants**
- **Business logic** is complex and domain-specific
- You want to **hide implementation details**
- **State changes** need to be coordinated
- You're building a **rich domain model**

### Use Data Structures When:
- **Transferring data** between system boundaries
- **Configuration** or settings data
- **Simple data containers** with no business logic
- **Performance** is critical and you need direct access
- Working with **external APIs** or databases

### Avoid Hybrids When:
- It's unclear whether something is an object or data structure
- Public fields are mixed with complex methods
- The class has both getters/setters AND business logic
- You can't decide if it should be mutable or immutable

## 📝 Practical Examples

### E-commerce Domain

**✅ Good Object Design:**
```python
class ShoppingCart:
    def __init__(self):
        self._items = []
        self._applied_coupons = []
    
    def add_item(self, product: Product, quantity: int) -> None:
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        
        existing_item = self._find_item(product.id)
        if existing_item:
            existing_item.increase_quantity(quantity)
        else:
            self._items.append(CartItem(product, quantity))
    
    def apply_coupon(self, coupon: Coupon) -> bool:
        if coupon.is_valid() and coupon.can_apply_to(self):
            self._applied_coupons.append(coupon)
            return True
        return False
    
    def calculate_total(self) -> Money:
        subtotal = sum(item.total_price() for item in self._items)
        discount = sum(coupon.calculate_discount(self) for coupon in self._applied_coupons)
        return Money(max(0, subtotal - discount))
    
    def get_item_count(self) -> int:
        return sum(item.quantity for item in self._items)
```

**✅ Good Data Structure:**
```python
@dataclass(frozen=True)
class OrderSummary:
    order_id: str
    customer_name: str
    total_amount: Decimal
    item_count: int
    order_date: datetime
    status: OrderStatus
    
    # Pure data - no business logic
```

## ⚠️ Common Mistakes

### 1. **Anemic Domain Model**
Objects that are just data holders with no behavior.

**❌ Bad:**
```java
public class Order {
    private String id;
    private List<OrderItem> items;
    private OrderStatus status;
    
    // Only getters and setters, no behavior
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    // ... more getters/setters
}

// Business logic scattered in service classes
public class OrderService {
    public void processOrder(Order order) {
        // All the business logic here
    }
}
```

**✅ Good:**
```java
public class Order {
    private final String id;
    private final List<OrderItem> items;
    private OrderStatus status;
    
    public Order(String id, List<OrderItem> items) {
        this.id = id;
        this.items = new ArrayList<>(items);
        this.status = OrderStatus.PENDING;
    }
    
    public void ship() {
        if (status != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Can only ship confirmed orders");
        }
        status = OrderStatus.SHIPPED;
    }
    
    public Money calculateTotal() {
        return items.stream()
            .map(OrderItem::getPrice)
            .reduce(Money.ZERO, Money::add);
    }
}
```

### 2. **God Objects**
Objects that know too much or do too much.

**❌ Bad:**
```python
class User:
    def __init__(self):
        # User data
        self.name = ""
        self.email = ""
        
        # Order data
        self.orders = []
        
        # Payment data
        self.credit_cards = []
        
        # Notification preferences
        self.email_notifications = True
        
    def place_order(self, items):
        # Order logic
        pass
        
    def process_payment(self, amount):
        # Payment logic
        pass
        
    def send_notification(self, message):
        # Notification logic
        pass
```

### 3. **Inappropriate Intimacy**
Objects that know too much about each other's internals.

**❌ Bad:**
```javascript
class OrderProcessor {
    processOrder(order) {
        // Directly manipulating order internals
        order.items.forEach(item => {
            item.price = this.applyDiscount(item.price);
        });
        order.total = order.items.reduce((sum, item) => sum + item.price, 0);
        order.status = 'processed';
    }
}
```

## 🛠️ Tools and Techniques

### 1. **Interface Segregation**
Create focused interfaces rather than fat ones.

```typescript
// ❌ Fat interface
interface UserService {
    createUser(data: UserData): User;
    deleteUser(id: string): void;
    sendEmail(userId: string, message: string): void;
    generateReport(userId: string): Report;
}

// ✅ Segregated interfaces
interface UserManager {
    createUser(data: UserData): User;
    deleteUser(id: string): void;
}

interface NotificationService {
    sendEmail(userId: string, message: string): void;
}

interface ReportGenerator {
    generateReport(userId: string): Report;
}
```

### 2. **Builder Pattern for Complex Objects**
Create objects with many parameters cleanly.

```java
public class DatabaseConnection {
    private final String host;
    private final int port;
    private final String database;
    private final boolean ssl;
    private final int timeout;
    
    private DatabaseConnection(Builder builder) {
        this.host = builder.host;
        this.port = builder.port;
        this.database = builder.database;
        this.ssl = builder.ssl;
        this.timeout = builder.timeout;
    }
    
    public static class Builder {
        private String host;
        private int port = 5432;
        private String database;
        private boolean ssl = false;
        private int timeout = 30;
        
        public Builder host(String host) {
            this.host = host;
            return this;
        }
        
        public Builder port(int port) {
            this.port = port;
            return this;
        }
        
        public DatabaseConnection build() {
            if (host == null || database == null) {
                throw new IllegalStateException("Host and database are required");
            }
            return new DatabaseConnection(this);
        }
    }
}

// Usage
DatabaseConnection conn = new DatabaseConnection.Builder()
    .host("localhost")
    .database("myapp")
    .ssl(true)
    .build();
```

### 3. **Composition over Inheritance**
Favor object composition over class inheritance.

```python
# ✅ Good - Composition
class EmailNotifier:
    def send(self, message: str, recipient: str) -> None:
        # Email implementation
        pass

class SMSNotifier:
    def send(self, message: str, recipient: str) -> None:
        # SMS implementation
        pass

class User:
    def __init__(self, name: str, notifier: EmailNotifier | SMSNotifier):
        self._name = name
        self._notifier = notifier
    
    def notify(self, message: str) -> None:
        self._notifier.send(message, self._contact_info())
```

## 🧪 Testing Objects vs Data Structures

### Testing Objects
Focus on behavior, not state.

```python
def test_shopping_cart_applies_discount():
    cart = ShoppingCart()
    product = Product("laptop", Money(1000))
    coupon = PercentageCoupon(0.1)  # 10% off
    
    cart.add_item(product, 1)
    cart.apply_coupon(coupon)
    
    # Test behavior, not internal state
    assert cart.calculate_total() == Money(900)
```

### Testing Data Structures
Focus on data integrity and transformation.

```python
def test_order_dto_serialization():
    order_data = OrderDTO(
        id="123",
        customer_id="456",
        total=Decimal("99.99"),
        created_at=datetime.now()
    )
    
    # Test data transformation
    json_data = order_data.to_json()
    reconstructed = OrderDTO.from_json(json_data)
    
    assert reconstructed == order_data
```

## 📊 Performance Considerations

### Object Overhead
- Objects have method dispatch overhead
- Encapsulation can add indirection
- Use profiling to identify bottlenecks

### Data Structure Efficiency
- Direct field access is faster
- Less memory overhead
- Better for data-intensive operations

### When Performance Matters
```java
// For performance-critical code
public class Point2D {
    public final double x, y;  // Direct access for performance
    
    public Point2D(double x, double y) {
        this.x = x;
        this.y = y;
    }
}

// For business logic
public class Customer {
    private String name;
    private List<Order> orders;
    
    public void placeOrder(Order order) {
        validateOrder(order);
        orders.add(order);
        notifyOrderPlaced(order);
    }
}
```

## 🎯 Key Takeaways

1. **Objects hide data and expose behavior** - Use when you need to control how data is manipulated
2. **Data structures expose data and have minimal behavior** - Use for transferring data between boundaries
3. **Tell Don't Ask** - Give objects commands rather than querying their state
4. **Law of Demeter** - Keep object interactions simple and direct
5. **Avoid hybrids** - Don't mix object and data structure approaches in the same class
6. **Encapsulation protects invariants** - Use private fields and controlled access
7. **Choose the right tool** - Objects for behavior, data structures for data transport

## 🔄 Refactoring Techniques

### From Procedural to Object-Oriented
1. **Identify data clumps** → Create objects
2. **Find repeated operations** → Extract methods
3. **Group related behavior** → Create classes
4. **Hide implementation details** → Add encapsulation

### From Data Structure to Object
1. **Add validation** to constructors
2. **Convert operations** to methods
3. **Hide internal state** with private fields
4. **Add invariant protection**

Remember: The goal is not to follow rules blindly, but to create code that clearly expresses intent and is easy to understand and modify!
