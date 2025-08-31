# Objects and Data Structures - Daily Checklist

Use this checklist for code reviews, design decisions, and daily development to ensure proper abstraction and encapsulation.

## 🎯 Quick Decision Guide

### When designing a new class, ask:
- **Primary purpose**: Is this for data transport or business behavior?
- **Complexity**: Are there business rules to encapsulate?
- **Responsibilities**: Does it have a single, clear purpose?
- **Interactions**: Will other objects need to coordinate with this?

**→ Business behavior = Object | Data transport = Data Structure**

## 📋 Pre-Commit Checklist

### ✅ Objects (Business Logic)

#### **Encapsulation**
- [ ] Private fields with controlled access
- [ ] Public methods express intent, not implementation
- [ ] No getters/setters for core business data
- [ ] Invariants are protected and validated
- [ ] Internal state cannot be corrupted from outside

#### **Tell Don't Ask**
- [ ] Methods tell objects what to do
- [ ] Avoid asking objects for data to manipulate
- [ ] Business logic is inside the object, not scattered
- [ ] Method names are commands or queries, not both
- [ ] Objects make decisions about their own data

#### **Single Responsibility**
- [ ] Class has one reason to change
- [ ] All methods relate to the core responsibility
- [ ] No god objects with multiple concerns
- [ ] Clear, focused purpose that's easy to explain
- [ ] Cohesive behavior around a central concept

#### **Rich Domain Model**
- [ ] Objects contain both data and behavior
- [ ] Business rules are encapsulated within domain objects
- [ ] Objects validate their own state changes
- [ ] Meaningful domain methods, not just CRUD
- [ ] Objects can explain their current state

### ✅ Data Structures (Data Transport)

#### **Data Exposure**
- [ ] Fields are public or have simple accessors
- [ ] Minimal or no business logic
- [ ] Focused on data transport between boundaries
- [ ] Clear, simple structure
- [ ] No complex state management

#### **Immutability (when appropriate)**
- [ ] Immutable for value objects and DTOs
- [ ] Constructor validates required data
- [ ] No setter methods that break immutability
- [ ] Thread-safe by design
- [ ] Clear value semantics

#### **Clear Purpose**
- [ ] Obviously a data container
- [ ] Used for serialization, APIs, configuration
- [ ] No mixing of data and complex behavior
- [ ] Simple, understandable structure
- [ ] Minimal dependencies

## 🔍 Code Review Checklist

### **Objects Review**

#### **Look for these RED FLAGS:**
- [ ] **Anemic Model**: Objects with only getters/setters
- [ ] **God Object**: Classes doing too many things
- [ ] **Data Exposure**: Public fields on business objects
- [ ] **Asking Pattern**: Constantly querying object state
- [ ] **Hybrid Confusion**: Mix of data structure and object patterns

#### **Look for these GOOD PATTERNS:**
- [ ] **Rich Behavior**: Methods that encapsulate business logic
- [ ] **Protected State**: Private fields with controlled access
- [ ] **Clear Intent**: Method names that express what, not how
- [ ] **Validation**: Constructors that ensure valid object state
- [ ] **Immutable Values**: Value objects that can't be corrupted

### **Data Structures Review**

#### **Look for these RED FLAGS:**
- [ ] **Business Logic**: Complex behavior in data containers
- [ ] **State Management**: Mutable state in value objects
- [ ] **Validation**: Complex validation in simple DTOs
- [ ] **Dependencies**: Many imports for simple data containers
- [ ] **Mutation**: Changing data after creation when shouldn't

#### **Look for these GOOD PATTERNS:**
- [ ] **Simple Structure**: Clear, obvious data layout
- [ ] **Appropriate Use**: Used for correct scenarios (APIs, config, etc.)
- [ ] **Minimal Behavior**: Only essential data transformation
- [ ] **Clear Boundaries**: Used at system boundaries
- [ ] **Proper Immutability**: Immutable when it should be

## 🎨 Design Patterns Checklist

### **Value Objects**
- [ ] Immutable by design
- [ ] Equality based on values, not identity
- [ ] No public setters
- [ ] Validates state in constructor
- [ ] Small, focused responsibility
- [ ] Methods return new instances rather than mutating

### **Entities**
- [ ] Identity-based equality
- [ ] Mutable business state when appropriate
- [ ] Protected invariants
- [ ] Rich domain behavior
- [ ] Clear lifecycle management
- [ ] Proper encapsulation of state changes

### **Data Transfer Objects (DTOs)**
- [ ] Simple data containers
- [ ] Used at application boundaries
- [ ] No business logic
- [ ] Serialization-friendly
- [ ] Immutable for safety
- [ ] Clear mapping to/from domain objects

### **Services (when needed)**
- [ ] Stateless operations
- [ ] Coordinate between objects
- [ ] Don't contain business logic that belongs in domain objects
- [ ] Thin layer over domain model
- [ ] Clear, single responsibility

## ⚠️ Common Anti-Patterns to Avoid

### **Anemic Domain Model**
```javascript
// ❌ BAD - Just a data holder
class Order {
    constructor() {
        this.items = [];
        this.total = 0;
        this.status = 'pending';
    }
    
    getItems() { return this.items; }
    setItems(items) { this.items = items; }
    // ... more getters/setters
}

// ✅ GOOD - Rich behavior
class Order {
    constructor(customerId) {
        this._items = [];
        this._status = 'pending';
        this._customerId = customerId;
    }
    
    addItem(product, quantity) {
        // Business logic here
    }
    
    calculateTotal() {
        // Business logic here
    }
}
```

### **God Object**
```python
# ❌ BAD - Too many responsibilities
class User:
    def authenticate(self): pass
    def send_email(self): pass
    def process_payment(self): pass
    def generate_report(self): pass
    def update_inventory(self): pass

# ✅ GOOD - Single responsibility
class User:
    def authenticate(self): pass
    def get_profile(self): pass

class EmailService:
    def send_email(self, user, message): pass
```

### **Inappropriate Intimacy**
```java
// ❌ BAD - Reaching through objects
customer.getAddress().getCity().toLowerCase()

// ✅ GOOD - Tell don't ask
customer.getCityName()  // Let customer handle the details
```

## 🧪 Testing Checklist

### **Testing Objects**
- [ ] Test behavior, not internal state
- [ ] Verify business rules are enforced
- [ ] Test invariant protection
- [ ] Mock dependencies appropriately
- [ ] Test edge cases and error conditions

### **Testing Data Structures**
- [ ] Test data integrity
- [ ] Verify serialization/deserialization
- [ ] Test immutability constraints
- [ ] Validate constructor parameters
- [ ] Test equality and comparison methods

## 🚀 Refactoring Checklist

### **From Anemic to Rich Model**
- [ ] Identify scattered business logic
- [ ] Move logic into appropriate domain objects
- [ ] Replace getters/setters with behavior methods
- [ ] Add validation to constructors
- [ ] Protect invariants with encapsulation

### **From God Object to Focused Objects**
- [ ] Identify distinct responsibilities
- [ ] Extract cohesive behavior into new classes
- [ ] Use composition over inheritance
- [ ] Maintain clear object boundaries
- [ ] Ensure single responsibility per class

### **From Hybrid to Clear Pattern**
- [ ] Decide: Object or Data Structure?
- [ ] Remove inappropriate behavior/data exposure
- [ ] Apply consistent pattern throughout
- [ ] Update all usage sites
- [ ] Verify improved clarity and maintainability

## 📊 Self-Assessment Scoring

Rate yourself on each area (1-5 scale):

### **Object Design**
- [ ] I consistently create rich domain models (vs anemic models)
- [ ] I apply Tell Don't Ask principle naturally
- [ ] I protect object invariants effectively
- [ ] I avoid god objects and maintain single responsibility
- [ ] I design clear object boundaries and interactions

### **Data Structure Design**
- [ ] I know when to use data structures vs objects
- [ ] I create appropriate DTOs for data transfer
- [ ] I design immutable value objects correctly
- [ ] I avoid mixing data and behavior inappropriately
- [ ] I use data structures at appropriate boundaries

### **Encapsulation**
- [ ] I hide implementation details behind clean interfaces
- [ ] I control access to object state appropriately
- [ ] I validate object state and maintain invariants
- [ ] I design abstractions that express intent clearly
- [ ] I avoid inappropriate intimacy between objects

**Target Score**: 4-5 in all areas before moving to next principle

## 💡 Daily Practice Tips

1. **Morning Review**: Before coding, decide which new classes need to be objects vs data structures
2. **Lunch Check**: Review morning code for anemic models or god objects
3. **End of Day**: Verify that business logic is properly encapsulated
4. **Code Review**: Use this checklist to review team member code
5. **Refactoring Time**: Dedicate time weekly to improving object design

## 🎯 Quick Reference

**Objects**: Hide data, expose behavior, maintain invariants
**Data Structures**: Expose data, minimal behavior, simple transport
**Tell Don't Ask**: Give commands, don't query for data to manipulate
**Encapsulation**: Control access, protect state, express intent clearly

Remember: The goal is code that clearly expresses business intent and is easy to understand, test, and modify!
