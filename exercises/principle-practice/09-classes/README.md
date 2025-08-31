# 🏗️ Classes and SOLID Principles - Practice Exercises

Master the SOLID principles through hands-on refactoring and design exercises that transform rigid, fragile code into flexible, maintainable architectures!

## 📚 **Quick Navigation**
- **[🔙 Back to Principle 9](../../../principles/09-classes/README.md)** - Classes and SOLID Principles
- **[👀 Study Examples](../../../examples/before-after/classes-examples/README.md)**
- **[📋 Daily Checklist](../../../principles/09-classes/checklist.md)**

---

## 🎯 **Learning Objectives**

By completing these exercises, you will:
- ✅ **Master the Single Responsibility Principle** by identifying and separating concerns
- ✅ **Apply the Open/Closed Principle** using strategy patterns and polymorphism
- ✅ **Implement Liskov Substitution** with reliable inheritance hierarchies
- ✅ **Design focused interfaces** that follow Interface Segregation Principle
- ✅ **Invert dependencies** to create flexible, testable architectures
- ✅ **Refactor legacy code** systematically using SOLID principles

---

## 🏋️ **Exercise Progression**

### **📚 Beginner Level**

#### **Exercise 1: Single Responsibility Principle - Refactor a God Class**
**Goal:** Learn to identify and separate multiple responsibilities in a single class

**Scenario:** You've inherited a `ReportGenerator` class that violates SRP by handling data access, business logic, formatting, and file operations all in one place.

**Starting Code:**
```python
# report_generator.py - Violates SRP
class ReportGenerator:
    def generate_sales_report(self, start_date, end_date):
        # Database access responsibility
        connection = sqlite3.connect('sales.db')
        cursor = connection.cursor()
        cursor.execute("""
            SELECT product_name, quantity_sold, price, sale_date 
            FROM sales 
            WHERE sale_date BETWEEN ? AND ?
        """, (start_date, end_date))
        raw_data = cursor.fetchall()
        connection.close()
        
        # Business logic responsibility
        total_revenue = 0
        product_totals = {}
        for row in raw_data:
            product, quantity, price, date = row
            revenue = quantity * price
            total_revenue += revenue
            
            if product in product_totals:
                product_totals[product] += revenue
            else:
                product_totals[product] = revenue
        
        # Formatting responsibility
        report_lines = []
        report_lines.append("SALES REPORT")
        report_lines.append("=" * 50)
        report_lines.append(f"Period: {start_date} to {end_date}")
        report_lines.append("")
        
        for product, revenue in sorted(product_totals.items()):
            report_lines.append(f"{product}: ${revenue:,.2f}")
        
        report_lines.append("")
        report_lines.append(f"TOTAL REVENUE: ${total_revenue:,.2f}")
        
        report_content = "\n".join(report_lines)
        
        # File operations responsibility
        filename = f"sales_report_{start_date}_{end_date}.txt"
        with open(filename, 'w') as file:
            file.write(report_content)
        
        return filename
```

**Your Tasks:**
1. **Identify responsibilities** - List all the different things this class does
2. **Create separate classes** for each responsibility:
   - `SalesDataRepository` - Database access
   - `SalesAnalyzer` - Business logic and calculations
   - `ReportFormatter` - Text formatting
   - `FileWriter` - File operations
   - `ReportGenerator` - Coordinates the process
3. **Define clear interfaces** between components
4. **Add dependency injection** for testability
5. **Write unit tests** for each component

**Success Criteria:**
- [ ] Each class has a single, clear responsibility
- [ ] Components can be tested independently
- [ ] Easy to swap implementations (e.g., different formatters)
- [ ] No duplication of concerns across classes

---

#### **Exercise 2: Open/Closed Principle - Extensible Payment System**
**Goal:** Design a system that's open for extension but closed for modification

**Scenario:** Build a payment processing system that can handle different payment methods without modifying existing code when new payment types are added.

**Requirements:**
- Support credit cards, PayPal, and bank transfers initially
- Must be able to add new payment methods (cryptocurrency, Apple Pay, etc.) without changing existing code
- Different payment methods have different validation rules and processing logic
- Each payment method should calculate its own fees

**Starting Structure:**
```typescript
// Start with this basic structure and extend it
interface PaymentMethod {
    // Define the contract for payment methods
}

class PaymentProcessor {
    // Implement OCP-compliant payment processing
}
```

**Your Tasks:**
1. **Design the base abstractions** (interfaces/abstract classes)
2. **Implement initial payment methods** (credit card, PayPal, bank transfer)
3. **Create a payment processor** that works with any payment method
4. **Add new payment methods** without modifying existing code
5. **Implement fee calculation** using the strategy pattern
6. **Add validation** that's specific to each payment type

**Extension Challenges:**
- Add cryptocurrency payments (Bitcoin, Ethereum)
- Add mobile payments (Apple Pay, Google Pay)
- Add buy-now-pay-later services (Klarna, Afterpay)
- Add gift card payments
- Implement currency conversion for international payments

**Success Criteria:**
- [ ] Adding new payment methods requires zero changes to existing code
- [ ] Each payment method handles its own validation and fee calculation
- [ ] Payment processor works with any payment method
- [ ] Easy to add new features (like fraud detection) to all payment methods

---

### **🎯 Intermediate Level**

#### **Exercise 3: Liskov Substitution Principle - Shape Hierarchy Design**
**Goal:** Create inheritance hierarchies that follow LSP correctly

**Scenario:** Design a graphics system with shapes that can be drawn, resized, and moved. Avoid the classic Rectangle/Square LSP violation while supporting different shape behaviors.

**Challenge:** Some shapes can be resized independently (rectangles), others maintain aspect ratios (squares, circles), and some are fixed size (points, icons).

**Starting Requirements:**
```java
// Design a shape hierarchy that follows LSP
public abstract class Shape {
    // What should be in the base class?
}

// How do you handle:
// - Rectangles (width/height can be different)
// - Squares (width/height must be same)
// - Circles (only radius)
// - Points (no size)
// - Images (might have fixed aspect ratio)
```

**Your Tasks:**
1. **Analyze the problem** - Why does the classic Rectangle/Square example violate LSP?
2. **Design proper abstractions** - What behaviors are truly common?
3. **Create interface segregation** - Separate resizing capabilities
4. **Implement shape types** that are properly substitutable
5. **Add area calculation** that works for all shapes
6. **Create drawing methods** that work regardless of shape type

**Design Patterns to Apply:**
- Interface segregation for different capabilities
- Composition over inheritance where appropriate
- Template method for common drawing operations
- Strategy pattern for shape-specific calculations

**Success Criteria:**
- [ ] Any shape can substitute for the base Shape class
- [ ] No method throws "not supported" exceptions
- [ ] Client code works with any shape without knowing the specific type
- [ ] New shape types can be added without breaking existing code

---

#### **Exercise 4: Interface Segregation Principle - Multi-Function Device**
**Goal:** Design interfaces that clients use only what they need

**Scenario:** Create a system for managing office devices (printers, scanners, fax machines, copiers, and multi-function devices). Avoid forcing simple devices to implement functions they don't support.

**Device Types to Support:**
- Simple printer (print only)
- Scanner (scan only)
- Fax machine (fax only)
- Copier (print + scan, no fax)
- All-in-one device (print + scan + fax + copy)
- Network printer (print + network configuration)
- Mobile printer (print + battery status)

**Bad Design to Avoid:**
```csharp
// ❌ Fat interface that violates ISP
interface IOfficeDevice 
{
    void Print(Document doc);
    void Scan(Document doc);
    void Fax(string number, Document doc);
    void Copy(Document doc);
    void ConfigureNetwork(NetworkSettings settings);
    int GetBatteryLevel();
    void SetWifiCredentials(string ssid, string password);
}
```

**Your Tasks:**
1. **Identify client needs** - What do different clients actually use?
2. **Create focused interfaces** for each capability
3. **Design composition patterns** for multi-function devices
4. **Implement device classes** that only support their actual capabilities
5. **Create client code** that depends only on needed interfaces
6. **Add device management** that works with any combination of interfaces

**Client Scenarios:**
- Print job manager (only needs printing)
- Document archival system (only needs scanning)
- Network administrator (only needs network configuration)
- Mobile app (might need battery status for mobile printers)
- Office workflow system (needs all capabilities but should work with any device)

**Success Criteria:**
- [ ] Simple devices don't implement unused methods
- [ ] Clients depend only on interfaces they actually use
- [ ] Easy to add new device types with different capability combinations
- [ ] No client breaks when using devices with subset of capabilities

---

### **🚀 Advanced Level**

#### **Exercise 5: Dependency Inversion Principle - E-commerce Order System**
**Goal:** Build a complete system that demonstrates proper dependency inversion

**Scenario:** Create an e-commerce order processing system where high-level business logic doesn't depend on low-level implementation details like databases, payment gateways, or email services.

**System Requirements:**
- Process orders with payment, inventory, and shipping
- Support multiple payment gateways (Stripe, PayPal, Square)
- Support multiple shipping providers (UPS, FedEx, DHL)
- Support multiple notification methods (email, SMS, push notifications)
- Support different inventory systems (local database, external API)
- Handle order events (created, paid, shipped, delivered, cancelled)
- Audit all order operations
- Calculate taxes based on customer location

**Architecture to Build:**
```
High Level: Order Processing Business Logic
    ↑ (depends on abstractions)
Abstractions: Interfaces and Contracts
    ↑ (implemented by)
Low Level: Concrete Implementations (Database, APIs, Services)
```

**Your Tasks:**
1. **Design domain model** - Orders, customers, products, payments
2. **Create business service layer** - Order processing logic
3. **Define service interfaces** - What the business logic needs
4. **Implement adapters** - Concrete implementations for external services
5. **Create composition root** - Wire up dependencies
6. **Add configuration** - Support different environments
7. **Implement event handling** - Decouple order lifecycle events

**Implementation Challenges:**
- **Payment processing** with multiple gateways
- **Inventory management** with different sources
- **Tax calculation** based on location services
- **Shipping rate calculation** from multiple providers
- **Order state management** with proper transitions
- **Event sourcing** for order audit trail
- **Retry logic** for external service failures
- **Circuit breakers** for service resilience

**Success Criteria:**
- [ ] Business logic has no dependencies on external libraries
- [ ] Easy to swap implementations (payment gateways, databases, etc.)
- [ ] Comprehensive unit testing without external dependencies
- [ ] Integration testing with real services
- [ ] Configuration-driven dependency injection
- [ ] Proper error handling and logging throughout

---

## 🎮 **Bonus Challenges**

### **Challenge 1: SOLID Principles Integration**
Take a legacy codebase that violates all SOLID principles and refactor it systematically:
1. Start with SRP - separate concerns
2. Apply OCP - make it extensible  
3. Fix LSP violations - ensure proper substitution
4. Apply ISP - create focused interfaces
5. Implement DIP - invert dependencies

### **Challenge 2: Design Pattern Application**
Implement these SOLID-supporting design patterns:
- **Strategy Pattern** (OCP) - Extensible algorithms
- **Template Method** (OCP) - Extensible processes
- **Adapter Pattern** (DIP) - Interface adaptation  
- **Facade Pattern** (ISP) - Simplified interfaces
- **Observer Pattern** (OCP) - Extensible event handling

### **Challenge 3: Framework Design**
Create a mini-framework (e.g., web framework, ORM, testing framework) that:
- Follows all SOLID principles
- Provides extension points for users
- Has a plugin architecture
- Supports dependency injection
- Includes comprehensive examples

---

## 📊 **Self-Assessment Checklist**

After completing each exercise, verify you can:

### **Single Responsibility Principle:**
- [ ] Identify when a class has multiple responsibilities
- [ ] Extract classes with focused purposes
- [ ] Organize code around single reasons to change
- [ ] Create cohesive, focused components

### **Open/Closed Principle:**
- [ ] Design systems that are open for extension
- [ ] Use polymorphism instead of conditionals
- [ ] Implement strategy and template method patterns
- [ ] Add new features without modifying existing code

### **Liskov Substitution Principle:**
- [ ] Create reliable inheritance hierarchies
- [ ] Ensure subclasses can substitute base classes
- [ ] Design contracts that subtypes can fulfill
- [ ] Avoid breaking client expectations

### **Interface Segregation Principle:**
- [ ] Design focused, client-specific interfaces
- [ ] Avoid fat interfaces that force unused dependencies
- [ ] Use interface composition for complex contracts
- [ ] Keep interfaces stable and minimal

### **Dependency Inversion Principle:**
- [ ] Make high-level modules independent of low-level details
- [ ] Depend on abstractions, not concretions
- [ ] Use dependency injection effectively
- [ ] Create testable, flexible architectures

---

## 💡 **Tips for Success**

### **SOLID Refactoring Strategy:**
1. **Start with SRP** - It enables all other principles
2. **Look for code smells** - Long methods, large classes, tight coupling
3. **Extract gradually** - Don't try to fix everything at once
4. **Test constantly** - Ensure behavior doesn't change
5. **Think in terms of roles** - What role does each class play?

### **Common Pitfalls to Avoid:**
1. **Over-engineering** - Don't create interfaces for everything
2. **Premature abstraction** - Wait until you need flexibility
3. **Ignoring performance** - Sometimes direct calls are better
4. **Complex inheritance** - Prefer composition when in doubt
5. **Too many layers** - Balance flexibility with simplicity

### **Design Thinking:**
- **What changes together, stays together** (cohesion)
- **What changes separately, is separated** (coupling)
- **Depend on things that change less** (stability)
- **Make interfaces discoverable** (usability)
- **Design for the 80% case** (pragmatism)

---

## 🚀 **Next Steps**

**Completed the exercises?** Outstanding! Now you're ready to:

1. **[📋 Use the Daily Checklist](../../../principles/09-classes/checklist.md)** - Apply SOLID principles in daily coding
2. **[🎯 Apply to Your Projects](../../../LEARNING_PATH.md#progress-tracking-and-assessment)** - Refactor your existing classes
3. **[📖 Continue Learning](../../../LEARNING_PATH.md)** - Move to the final principle: Systems and Architecture

**Ready for the grand finale?** Continue with Principle 10: Systems and Architecture!

---

## 🔧 **Exercise Templates and Resources**

Each exercise includes:
- **Starter code** in multiple programming languages
- **Step-by-step refactoring guides** 
- **Solution examples** with detailed explanations
- **Testing strategies** for each SOLID principle
- **Real-world scenarios** and case studies

**Remember**: SOLID principles are guidelines, not rigid rules. Use them to create code that's easier to understand, test, and change. The goal is maintainable software that can evolve with changing requirements!

---

**[🔙 Back to SOLID Principles](../../../principles/09-classes/README.md)** | **[👀 Study Examples](../../../examples/before-after/classes-examples/README.md)** | **[📋 Daily Checklist](../../../principles/09-classes/checklist.md)**
