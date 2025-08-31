# Side Effects: Before & After Examples

This directory contains concrete examples showing how to identify, manage, and clearly communicate side effects in your code.

## 📚 Example Categories

### 1. **Hidden vs. Explicit Side Effects**
- **Files**: `hidden-side-effects.js`, `explicit-side-effects.js`
- **Focus**: Making side effects obvious through naming and design
- **Key Learning**: Functions should be honest about what they do

### 2. **Pure vs. Impure Functions**
- **Files**: `mixed-concerns.py`, `separated-concerns.py`
- **Focus**: Separating pure calculations from side effects
- **Key Learning**: Isolation makes code easier to test and reason about

### 3. **Command-Query Separation**
- **Files**: `command-query-mixed.java`, `command-query-separated.java`
- **Focus**: Functions should either do something OR return something, not both
- **Key Learning**: Clear separation of responsibilities

### 4. **Dependency Management**
- **Files**: `hidden-dependencies.ts`, `explicit-dependencies.ts`
- **Focus**: Making external dependencies explicit and injectable
- **Key Learning**: Dependencies should be visible, not hidden

## 🎯 How to Use These Examples

1. **Start with the "bad" examples** - Identify the side effect problems
2. **Think about solutions** - How would you improve each case?
3. **Study the "good" examples** - See clean approaches to the same problems
4. **Practice with your code** - Apply these patterns to your current projects

## 💡 Key Patterns You'll Learn

- **Honest naming** that reveals all function behaviors
- **Dependency injection** to make external dependencies explicit
- **Pure function extraction** to isolate business logic
- **Command-query separation** to clarify function purposes
- **Return value patterns** that make changes explicit

---

Ready to see side effects managed cleanly? Start with [Hidden vs. Explicit Side Effects](./hidden-side-effects.js)!
