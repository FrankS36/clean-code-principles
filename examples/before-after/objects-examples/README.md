# Objects and Data Structures - Before/After Examples

This directory contains practical examples showing the transformation from poorly designed object structures to clean, well-abstracted designs. These examples demonstrate the principles of proper encapsulation, the distinction between objects and data structures, and the Tell Don't Ask principle.

## 📁 Examples Overview

### 1. **anemic-domain-bad.js** → **rich-domain-good.js**
**Transformation**: Anemic Domain Model → Rich Domain Model
- **Before**: Business logic scattered across service classes with objects that are just data holders
- **After**: Objects encapsulate behavior and maintain their own invariants
- **Key Principles**: Tell Don't Ask, Encapsulation, Single Responsibility

### 2. **god-object-bad.py** → **separated-concerns-good.py**
**Transformation**: God Object → Proper Separation of Concerns
- **Before**: One massive class handling users, orders, payments, and notifications
- **After**: Focused objects with clear responsibilities and proper interfaces
- **Key Principles**: Single Responsibility, Interface Segregation, Composition

### 3. **data-vs-objects-examples.ts**
**Demonstration**: When to use Objects vs Data Structures
- Shows appropriate use cases for each approach
- Demonstrates proper DTOs for data transfer
- Illustrates value objects vs entities

## 🎯 Learning Objectives

After studying these examples, you should be able to:

1. **Identify anemic domain models** and understand why they're problematic
2. **Distinguish between objects and data structures** and know when to use each
3. **Apply the Tell Don't Ask principle** in object design
4. **Create rich domain models** that encapsulate business logic
5. **Design proper abstractions** that hide implementation details
6. **Avoid inappropriate intimacy** between objects

## 📚 How to Study These Examples

### Step 1: Analyze the "Bad" Examples
- Read through the poorly designed code
- Identify specific problems:
  - What business logic is scattered?
  - What encapsulation is broken?
  - What makes the code hard to maintain?

### Step 2: Study the Transformation
- Compare the before and after versions
- Notice how responsibilities are redistributed
- See how encapsulation improves maintainability

### Step 3: Apply the Patterns
- Look for similar patterns in your own code
- Practice refactoring using these techniques
- Consider how these principles apply to your domain

## 🎨 Key Patterns Demonstrated

### **Rich Domain Model**
Objects that contain both data and the behavior that operates on that data, encapsulating business rules and maintaining invariants.

### **Data Transfer Objects (DTOs)**
Simple data structures used purely for transferring data between system boundaries, with no business logic.

### **Value Objects**
Immutable objects that represent a concept or measurement, identified by their values rather than identity.

### **Tell Don't Ask**
Object interaction pattern where you tell objects what to do rather than asking for their data to manipulate it externally.

### **Law of Demeter**
Design principle that objects should only interact with their immediate collaborators, not reach through them to access other objects.

## 🔍 What to Look For

When studying these examples, pay attention to:

- **Before**: How are business rules scattered across multiple classes?
- **After**: How are business rules encapsulated within appropriate objects?
- **Before**: What data is exposed that shouldn't be?
- **After**: How is data properly encapsulated and accessed through behavior?
- **Before**: Where do you see inappropriate intimacy between objects?
- **After**: How are object boundaries properly maintained?

## 🚀 Next Steps

1. **Read the examples** in order, starting with the anemic domain transformation
2. **Complete the exercises** in `/exercises/principle-practice/05-objects/`
3. **Apply these patterns** to your current projects
4. **Use the checklist** in `/principles/05-objects-and-data/checklist.md` for code reviews

Remember: The goal is not just to learn the syntax, but to understand the principles that make code more maintainable, testable, and expressive of business intent.
