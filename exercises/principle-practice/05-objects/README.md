# Objects and Data Structures - Practice Exercises

Master the art of proper abstraction, encapsulation, and the distinction between objects and data structures through hands-on practice. These exercises progress from basic concepts to complex real-world scenarios.

## 🎯 Learning Objectives

After completing these exercises, you will:

- **Distinguish clearly** between when to use objects vs data structures
- **Apply the Tell Don't Ask principle** effectively in object design
- **Create rich domain models** that encapsulate business logic
- **Design proper abstractions** that hide implementation details
- **Avoid anemic domain models** and god objects
- **Master encapsulation** to protect object invariants

## 📋 Exercise Overview

| Exercise | Focus Area | Difficulty | Time Estimate |
|----------|------------|------------|---------------|
| 1 | Objects vs Data Structures | ⭐⭐ Beginner | 30 minutes |
| 2 | Rich Domain Design | ⭐⭐⭐ Intermediate | 45 minutes |
| 3 | Tell Don't Ask Refactoring | ⭐⭐⭐ Intermediate | 40 minutes |
| 4 | Encapsulation Patterns | ⭐⭐⭐⭐ Advanced | 60 minutes |
| 5 | Complex Domain Modeling | ⭐⭐⭐⭐⭐ Expert | 90 minutes |

**Total Estimated Time**: 4-5 hours (can be spread across multiple sessions)

## 🏋️ Exercise 1: Objects vs Data Structures (30 minutes)

### Objective
Learn to identify when to use objects versus data structures and practice creating appropriate abstractions.

### Scenario
You're building a library management system and need to decide how to model different aspects of the system.

### Tasks

#### Part A: Classification (10 minutes)
For each scenario below, decide whether you should use an **Object** or a **Data Structure**. Explain your reasoning.

1. **Library Book Information** for displaying in search results
   - Book ID, Title, Author, ISBN, Publication Year, Available Copies
   
2. **Book Checkout Process** including validation and due date calculation
   - Current checkout status, member eligibility, fine calculations
   
3. **API Response** for mobile app showing user's current checkouts
   - List of checked out books with due dates and renewal status
   
4. **Fine Calculation Engine** for overdue books
   - Business rules for different member types, grace periods, maximum fines

#### Part B: Implementation (20 minutes)
Implement your decisions from Part A:

1. Create appropriate **data structures** for scenarios you identified
2. Create appropriate **objects** with encapsulated behavior for scenarios you identified
3. Demonstrate usage of each in a small example

### Success Criteria
- ✅ Correctly identified which scenarios need objects vs data structures
- ✅ Data structures expose data with minimal behavior
- ✅ Objects encapsulate business logic and hide implementation details
- ✅ Clear justification for each design decision

## 🏗️ Exercise 2: Rich Domain Design (45 minutes)

### Objective
Transform an anemic domain model into a rich domain model with proper encapsulation.

### Starting Code (Anemic Model)
```python
class BankAccount:
    def __init__(self):
        self.account_number = ""
        self.balance = 0.0
        self.account_type = "checking"
        self.is_active = True
        self.overdraft_limit = 0.0
        
    # Only getters and setters...

class AccountService:
    def withdraw(self, account, amount):
        if not account.is_active:
            return False
        if account.account_type == "savings" and amount > account.balance:
            return False
        if account.account_type == "checking" and amount > (account.balance + account.overdraft_limit):
            return False
        account.balance -= amount
        return True
```

### Tasks

#### Part A: Identify Problems (10 minutes)
1. List specific problems with the anemic model above
2. Identify business logic that's scattered outside the domain object
3. Find examples of violated encapsulation

#### Part B: Rich Model Design (25 minutes)
1. **Redesign BankAccount** as a rich domain object:
   - Encapsulate business logic within the object
   - Protect invariants and validate state changes
   - Hide implementation details
   - Apply Tell Don't Ask principle

2. **Add proper behavior** for:
   - Account creation with validation
   - Deposit and withdrawal with business rules
   - Account activation/deactivation
   - Overdraft limit management

#### Part C: Demonstrate Benefits (10 minutes)
1. Show usage examples that demonstrate improved design
2. Explain how the rich model is easier to test and maintain
3. Describe how business rules are now properly encapsulated

### Success Criteria
- ✅ Business logic is encapsulated within domain objects
- ✅ Objects control their own state and maintain invariants
- ✅ Follows Tell Don't Ask principle
- ✅ Clear demonstration of improved maintainability

## 🔄 Exercise 3: Tell Don't Ask Refactoring (40 minutes)

### Objective
Practice refactoring code that violates the Tell Don't Ask principle.

### Scenario: E-commerce Order Processing
You have an order processing system with poor encapsulation that constantly asks objects for their data.

### Starting Code (Violates Tell Don't Ask)
```java
public class OrderProcessor {
    public void processOrder(Order order, Customer customer) {
        // Asking for data to make decisions
        if (customer.getLoyaltyLevel().equals("Gold") && 
            customer.getYearsSinceJoined() > 5) {
            order.setDiscountPercent(0.15);
        }
        
        // Calculating total manually
        double total = 0;
        for (OrderItem item : order.getItems()) {
            total += item.getPrice() * item.getQuantity();
        }
        total = total * (1 - order.getDiscountPercent());
        order.setTotal(total);
        
        // Checking inventory manually
        for (OrderItem item : order.getItems()) {
            if (item.getProduct().getStockLevel() < item.getQuantity()) {
                order.setStatus("OUT_OF_STOCK");
                return;
            }
        }
        
        order.setStatus("CONFIRMED");
    }
}
```

### Tasks

#### Part A: Analysis (10 minutes)
1. Identify all instances where the code "asks" objects for data
2. Find business logic that should be encapsulated within objects
3. List problems this approach creates

#### Part B: Refactoring (25 minutes)
1. **Refactor Customer** to handle loyalty benefits internally
2. **Refactor Order** to calculate its own total and manage status
3. **Refactor OrderItem** to handle quantity and stock validation
4. **Simplify OrderProcessor** to coordinate high-level flow only

#### Part C: Comparison (5 minutes)
1. Compare the before and after code
2. Explain benefits of the Tell Don't Ask approach
3. Identify what each object is now responsible for

### Success Criteria
- ✅ Objects are told what to do rather than asked for data
- ✅ Business logic is properly encapsulated
- ✅ Reduced coupling between classes
- ✅ Clearer responsibilities and improved testability

## 🛡️ Exercise 4: Encapsulation Patterns (60 minutes)

### Objective
Master advanced encapsulation techniques including value objects, immutability, and controlled state access.

### Scenario: Financial Trading System
Build a trading system with proper encapsulation for money, positions, and trades.

### Tasks

#### Part A: Value Objects (20 minutes)
Create immutable value objects for:

1. **Money** with currency validation and arithmetic operations
2. **Price** with bid/ask spread management
3. **Quantity** with positive value enforcement
4. **TradeId** with unique identifier generation

Requirements:
- Immutable objects
- Proper validation in constructors
- Meaningful equality comparison
- Arithmetic operations that return new instances

#### Part B: Entity Design (25 minutes)
Create entities with controlled state access:

1. **TradingAccount** that:
   - Protects account balance invariants
   - Validates trades before execution
   - Maintains transaction history
   - Prevents unauthorized access

2. **Trade** that:
   - Ensures consistent state transitions
   - Validates trade parameters
   - Calculates profit/loss correctly
   - Prevents modification after execution

#### Part C: Aggregate Design (15 minutes)
Create a **Portfolio** aggregate that:
- Manages multiple trading accounts
- Calculates total value across accounts
- Enforces business rules across accounts
- Provides controlled access to account information

### Success Criteria
- ✅ Value objects are immutable and validate invariants
- ✅ Entities control state changes and maintain consistency
- ✅ Aggregates enforce business rules across multiple objects
- ✅ Clear boundaries and controlled access patterns

## 🌟 Exercise 5: Complex Domain Modeling (90 minutes)

### Objective
Apply all concepts to model a complex domain with multiple entities, value objects, and business rules.

### Scenario: Hotel Reservation System
Design a comprehensive hotel reservation system with complex business rules.

### Requirements

#### Domain Entities Needed:
- **Hotel** with rooms, amenities, and policies
- **Guest** with preferences and loyalty status  
- **Reservation** with dates, rooms, and modifications
- **Room** with type, capacity, and availability
- **Payment** with methods and refund policies

#### Business Rules to Implement:
1. **Availability Management**: Rooms can't be double-booked
2. **Pricing Rules**: Rates vary by season, demand, and guest loyalty
3. **Cancellation Policies**: Different rules based on room type and timing
4. **Upgrade Logic**: Automatic upgrades based on availability and loyalty
5. **Group Bookings**: Special handling for multiple rooms

### Tasks

#### Part A: Domain Analysis (20 minutes)
1. **Identify objects vs data structures** for each requirement
2. **Define entity boundaries** and responsibilities
3. **Map relationships** between domain objects
4. **List business invariants** that must be protected

#### Part B: Core Implementation (50 minutes)
1. **Implement value objects** (dates, money, room numbers, etc.)
2. **Create rich entities** with encapsulated business logic
3. **Design aggregates** that maintain consistency
4. **Apply encapsulation patterns** throughout

#### Part C: Business Logic Integration (20 minutes)
1. **Implement complex scenarios**:
   - Making a reservation with availability checking
   - Modifying a reservation with business rule validation
   - Processing cancellations with appropriate policies
   - Handling group bookings with coordination

2. **Demonstrate encapsulation benefits**:
   - Show how business rules are protected
   - Prove that invariants are maintained
   - Illustrate clean object interactions

### Success Criteria
- ✅ Complex domain properly modeled with clear boundaries
- ✅ Business rules encapsulated within appropriate objects
- ✅ Entities maintain invariants under all operations
- ✅ Clean separation between objects and data structures
- ✅ System demonstrates real-world complexity handling

## 🎯 Self-Assessment Questions

After completing the exercises, evaluate your understanding:

### Objects vs Data Structures
- [ ] Can I clearly explain when to use objects vs data structures?
- [ ] Do I consistently choose the right approach for different scenarios?
- [ ] Can I identify hybrid confusion in existing code?

### Tell Don't Ask
- [ ] Do I naturally design object interactions using Tell Don't Ask?
- [ ] Can I refactor asking-style code to telling-style code?
- [ ] Do I understand the benefits this provides?

### Encapsulation
- [ ] Do I consistently protect object invariants?
- [ ] Can I design proper abstractions that hide implementation details?
- [ ] Do I understand different encapsulation patterns and when to use them?

### Rich Domain Modeling
- [ ] Can I transform anemic models into rich models?
- [ ] Do I naturally encapsulate business logic within domain objects?
- [ ] Can I design complex domains with proper object boundaries?

## 🚀 Next Steps

1. **Apply to your projects**: Look for opportunities to improve encapsulation in your current codebase
2. **Study the checklist**: Use `/principles/05-objects-and-data/checklist.md` for code reviews
3. **Practice more**: Create additional examples in your preferred programming language
4. **Advanced reading**: Explore Domain-Driven Design patterns and enterprise patterns

**Target Mastery**: You should feel confident making design decisions about object structure and able to explain your choices based on solid principles rather than just "it feels right."
