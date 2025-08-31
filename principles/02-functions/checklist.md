# Functions Quick Reference Checklist

Use this checklist during code writing and code reviews to ensure your functions follow clean code principles.

## 📝 Pre-Commit Checklist

Before committing code, check each function against these criteria:

### ✅ Size and Focus
- [ ] **Single Screen**: Can the entire function fit on one screen without scrolling?
- [ ] **Line Count**: Is the function under 20 lines? (Rarely over 50?)
- [ ] **Single Purpose**: Does this function do only one thing?
- [ ] **Extract Opportunity**: Can I extract another meaningful function from this one?
- [ ] **One Level of Abstraction**: Are all statements in the function at the same level of abstraction?

### ✅ Naming and Intent
- [ ] **Verb Phrase**: Does the function name start with a verb that describes what it does?
- [ ] **Intention Revealing**: Can someone understand what the function does without reading the implementation?
- [ ] **Side Effects Clear**: If the function has side effects, are they indicated in the name?
- [ ] **Searchable**: Is the function name specific enough to find when searching?
- [ ] **Pronounceable**: Can I easily say this function name in conversation?

### ✅ Parameters
- [ ] **Minimal Count**: Does the function have 3 or fewer parameters?
- [ ] **Meaningful Names**: Do parameter names clearly indicate what should be passed?
- [ ] **No Flag Parameters**: Are there boolean parameters that control function behavior?
- [ ] **Parameter Objects**: Could related parameters be grouped into objects?
- [ ] **Dependencies Explicit**: Are external dependencies passed as parameters rather than accessed globally?

### ✅ Return Values and Side Effects
- [ ] **Command or Query**: Does the function either DO something or RETURN something, but not both?
- [ ] **Consistent Return Type**: Does the function always return the same type?
- [ ] **No Hidden Mutations**: Does the function avoid modifying input parameters unexpectedly?
- [ ] **Error Handling**: Are error conditions handled appropriately with exceptions or return values?

## 🎯 Code Review Checklist

When reviewing others' code, look for these function design issues:

### 🚨 Red Flags - Must Fix
- [ ] Functions longer than one screen (50+ lines)
- [ ] Functions doing multiple distinct things
- [ ] Function names that don't match what the function actually does
- [ ] More than 3 parameters without good justification
- [ ] Hidden side effects not indicated in the name
- [ ] Functions that are impossible to test in isolation

### ⚠️ Yellow Flags - Should Improve
- [ ] Functions that could be broken down further
- [ ] Inconsistent naming patterns across similar functions
- [ ] Complex parameter lists that could be simplified
- [ ] Mixed levels of abstraction within a function
- [ ] Functions with complex error handling mixed with business logic

### ✅ Green Flags - Good Examples
- [ ] Functions that tell a clear story
- [ ] Self-documenting function names
- [ ] Consistent abstraction levels
- [ ] Easy to test and mock
- [ ] Clear separation of concerns

## 🔧 Common Function Problems & Solutions

### Problem: Too Many Parameters
```javascript
// ❌ Problem
function createUser(firstName, lastName, email, phone, street, city, state, zip) { }

// ✅ Solution: Parameter Object
function createUser(userInfo) {
    const { personalInfo, contactInfo, address } = userInfo;
}
```

### Problem: Functions Doing Multiple Things
```python
# ❌ Problem
def process_user(user_data):
    # validates, saves, and sends email - too many responsibilities
    pass

# ✅ Solution: Extract Functions
def validate_user_data(user_data): pass
def save_user(user): pass
def send_welcome_email(user): pass

def process_user(user_data):
    validate_user_data(user_data)
    user = save_user(user_data)
    send_welcome_email(user)
```

### Problem: Hidden Side Effects
```java
// ❌ Problem
public User getUser(String id) {
    User user = database.find(id);
    user.lastAccessed = new Date();  // Hidden side effect
    database.save(user);             // Hidden side effect
    return user;
}

// ✅ Solution: Explicit Operations
public User findUser(String id) {         // Query only
    return database.find(id);
}

public void updateUserLastAccessed(String id) {  // Command only
    User user = findUser(id);
    user.lastAccessed = new Date();
    database.save(user);
}
```

### Problem: Mixed Command and Query
```javascript
// ❌ Problem
function setUserActive(user) {
    user.active = true;        // Command
    database.save(user);       // Command
    return user.isActive();    // Query
}

// ✅ Solution: Separate Command and Query
function activateUser(user) {     // Command only
    user.active = true;
    database.save(user);
}

function isUserActive(user) {     // Query only
    return user.active;
}
```

## 📚 Function Categories and Patterns

### Pure Functions (Preferred)
```javascript
// No side effects, same input always produces same output
function calculateTax(amount, rate) {
    return amount * rate;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}
```

### Query Functions
```python
# Return information, no side effects
def find_user_by_email(email, database):
    return database.users.find_by_email(email)

def is_valid_email(email):
    return '@' in email and '.' in email

def count_active_users(users):
    return len([u for u in users if u.is_active])
```

### Command Functions
```java
// Perform actions, minimal return values
public void saveUser(User user) {
    database.save(user);
}

public void sendEmail(String recipient, String message) {
    emailService.send(recipient, message);
}

public void logUserAction(String userId, String action) {
    auditLog.record(userId, action, new Date());
}
```

### Orchestration Functions
```typescript
// Coordinate multiple operations
function registerNewUser(userData: UserData, services: Services): User {
    validateUserData(userData);
    const user = createUser(userData);
    saveUser(user, services.database);
    sendWelcomeEmail(user, services.emailService);
    trackUserRegistration(user, services.analytics);
    return user;
}
```

## 🧪 Testing Considerations

### Easy to Test Functions
- [ ] **Pure functions**: Same input, same output, no dependencies
- [ ] **Explicit dependencies**: All dependencies passed as parameters
- [ ] **Single responsibility**: Test one thing at a time
- [ ] **Clear return values**: Easy to assert on results

### Hard to Test Functions (Avoid)
- [ ] **Global dependencies**: Functions that access global state
- [ ] **Hidden side effects**: Unclear what the function actually does
- [ ] **Multiple responsibilities**: Need to test many things at once
- [ ] **Complex setup**: Require extensive mocking and setup

### Testing Strategies
```javascript
// Pure function - simple test
function test_calculateTax() {
    assert.equal(calculateTax(100, 0.08), 8);
}

// Function with dependencies - inject mocks
function test_sendWelcomeEmail() {
    const mockEmailService = createMock();
    const user = { email: 'test@example.com', name: 'Test' };
    
    sendWelcomeEmail(user, mockEmailService);
    
    assert(mockEmailService.send.calledWith('test@example.com'));
}
```

## 🎭 Context-Specific Guidelines

### API/Public Interface Functions
- [ ] **Defensive**: Validate all inputs thoroughly
- [ ] **Consistent**: Follow established patterns
- [ ] **Documented**: Clear contracts and error conditions
- [ ] **Backward Compatible**: Consider version compatibility

### Internal/Private Functions
- [ ] **Trusting**: Can assume valid inputs from controlled callers
- [ ] **Focused**: Very specific, single-purpose functions
- [ ] **Composable**: Designed to work together
- [ ] **Extractable**: Easy to extract and reuse

### Utility Functions
- [ ] **Stateless**: No dependencies on external state
- [ ] **Reusable**: Work in multiple contexts
- [ ] **Well-tested**: High confidence in correctness
- [ ] **Performance-aware**: Optimized for common usage patterns

## 💡 Pro Tips

### 1. **Read Your Code Aloud**
If it's hard to explain what a function does in one sentence, it probably does too much.

### 2. **Use the Newspaper Metaphor**
Functions should read like a well-written newspaper article - headline (function name), lead paragraph (first few lines), supporting details (rest of function).

### 3. **Apply the Extract Method Refactoring**
When you see a comment explaining what a block of code does, extract that block into a function with the comment as the function name.

### 4. **Think in Terms of Abstraction Levels**
Each function should operate at one level of abstraction. Mix high-level operations OR low-level details, not both.

### 5. **Consider the Single Responsibility Principle**
A function should have one reason to change. If you can think of multiple reasons why you might need to modify a function, it probably does too much.

## 🚀 Quick Self-Assessment

Rate your current codebase (1-5 scale):

- [ ] **Function Size**: Functions are appropriately sized (1=too large, 5=just right)
- [ ] **Single Purpose**: Functions do one thing well (1=do many things, 5=single purpose)
- [ ] **Clear Names**: Function names reveal intent (1=confusing, 5=self-documenting)
- [ ] **Parameter Design**: Functions have appropriate parameter counts (1=too many params, 5=minimal params)
- [ ] **Testability**: Functions are easy to test (1=hard to test, 5=easy to test)

**Target**: All scores should be 4 or 5. If any score is 3 or below, focus on improving that aspect.

---

*Remember: The goal is to write functions that are easy to read, understand, test, and modify. Small, focused functions with clear names are the building blocks of maintainable software.*
