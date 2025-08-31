# 🌐 Boundaries and Integration Examples

These examples demonstrate how to transform tightly coupled external integrations into clean, manageable boundaries.

## 📚 **Quick Navigation**
- **[🔙 Back to Principle 7](../../../principles/07-boundaries/README.md)** - Boundaries and Integration
- **[📝 Practice Exercises](../../../exercises/principle-practice/07-boundaries/README.md)**
- **[📋 Daily Checklist](../../../principles/07-boundaries/checklist.md)**

---

## 🎯 **What You'll Learn**

### **The Problem: Tight Coupling**
- External dependencies spread throughout business logic
- Difficult to test and modify
- Vendor lock-in and fragile integrations
- Mixed concerns and unclear boundaries

### **The Solution: Clean Boundaries**
- Adapter and Facade patterns
- Domain-focused interfaces
- Isolated external dependencies
- Clean, testable architecture

---

## 📁 **Example Files**

### **1. API Integration Examples**
- **[`direct-api-calls-bad.ts`](./direct-api-calls-bad.ts)** - Scattered external API calls
- **[`clean-api-boundary-good.ts`](./clean-api-boundary-good.ts)** - Clean adapter pattern

### **2. Database Integration Examples**
- **[`mixed-concerns-bad.java`](./mixed-concerns-bad.java)** - Business logic mixed with database
- **[`repository-pattern-good.java`](./repository-pattern-good.java)** - Clean repository boundary

### **3. Third-Party Service Examples**
- **[`vendor-lock-in-bad.py`](./vendor-lock-in-bad.py)** - Tight coupling to vendor API
- **[`abstracted-service-good.py`](./abstracted-service-good.py)** - Clean service abstraction

---

## 🚀 **Key Transformations**

### **Before: Chaos**
```
Business Logic ←→ External API
      ↓               ↓
Database ←→ Third-party Service
```

### **After: Clean Boundaries**
```
Business Logic
      ↓
Domain Interface
      ↓
Adapter/Repository
      ↓
External Systems
```

---

## 💡 **Study Order**

1. **Start with API examples** - See direct calls become clean adapters
2. **Review database examples** - Understand repository pattern benefits
3. **Examine service examples** - Learn vendor abstraction techniques
4. **Compare side-by-side** - Notice the reduced coupling and improved testability

Each example shows the same functionality implemented with and without proper boundaries - the difference in maintainability is dramatic!

---

**[📖 Back to Boundaries Principle](../../../principles/07-boundaries/README.md)** | **[📝 Practice with Exercises](../../../exercises/principle-practice/07-boundaries/README.md)**
