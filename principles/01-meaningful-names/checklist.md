# Meaningful Names Quick Reference Checklist

Use this checklist during code writing and code reviews to ensure your names follow clean code principles.

## 📝 Pre-Commit Checklist

Before committing code, check each name against these criteria:

### ✅ Variables
- [ ] **Intention-Revealing**: Does the name clearly indicate what this variable represents?
- [ ] **No Abbreviations**: Are all words spelled out fully? (except well-known conventions like `id`, `url`)
- [ ] **Searchable**: Can I easily find this variable when searching the codebase?
- [ ] **Pronounceable**: Can I easily say this name in a conversation?
- [ ] **Context-Appropriate**: Does this name make sense given where it's used?
- [ ] **No Magic Numbers**: Are numeric values extracted to named constants?
- [ ] **Type-Agnostic**: Does the name avoid including type information? (no `userString`, `accountArray`)

### ✅ Functions/Methods
- [ ] **Verb Phrases**: Does the function name start with a verb that describes what it does?
- [ ] **Single Responsibility**: Does the name suggest the function does only one thing?
- [ ] **Side Effects Clear**: If the function has side effects, are they indicated in the name?
- [ ] **Consistent Vocabulary**: Do I use the same verb for similar operations? (`get`, not mix of `get`/`fetch`/`retrieve`)
- [ ] **Return Type Clear**: For boolean functions, do I use `is`/`has`/`can` prefixes?
- [ ] **Parameter Purpose**: Do parameter names clearly indicate what should be passed?

### ✅ Classes/Types
- [ ] **Noun Phrases**: Is the class name a noun or noun phrase that represents what it is?
- [ ] **Single Responsibility**: Does the name suggest a focused, cohesive responsibility?
- [ ] **No Generic Terms**: Do I avoid vague words like `Manager`, `Handler`, `Data`, `Info`?
- [ ] **Domain-Appropriate**: Does the name use the right vocabulary (business vs. technical)?
- [ ] **Unambiguous**: Is there only one reasonable interpretation of what this class represents?

### ✅ Constants
- [ ] **ALL_CAPS**: Are constants in UPPER_SNAKE_CASE format?
- [ ] **Descriptive**: Does the name explain what the value represents, not just its value?
- [ ] **Context**: Is it clear where/how this constant should be used?

## 🎯 Code Review Checklist

When reviewing others' code, look for these naming issues:

### 🚨 Red Flags - Must Fix
- [ ] Single-letter variables (except short loop counters)
- [ ] Misleading names (plurals for singular, wrong data types)
- [ ] Functions that don't indicate their purpose
- [ ] Magic numbers without named constants
- [ ] Inconsistent vocabulary for similar operations
- [ ] Names that require comments to understand

### ⚠️ Yellow Flags - Should Improve
- [ ] Abbreviations that could be spelled out
- [ ] Generic names that could be more specific
- [ ] Long names that could be simplified without losing meaning
- [ ] Names that don't match the current context
- [ ] Inconsistent naming patterns within the same module

### ✅ Green Flags - Good Examples
- [ ] Names that immediately reveal intent
- [ ] Consistent vocabulary throughout the codebase
- [ ] Self-documenting code that rarely needs comments
- [ ] Names that make the code read like well-written prose
- [ ] Domain-appropriate terminology

## 🔧 Quick Fixes

### Common Problems & Solutions

**Problem**: `let d = new Date();`
**Fix**: `let currentDate = new Date();` or `let orderCreatedAt = new Date();`

**Problem**: `function process(data) { ... }`
**Fix**: `function validateUserInput(userData) { ... }`

**Problem**: `class DataManager { ... }`
**Fix**: `class UserAccountService { ... }` or `class PaymentProcessor { ... }`

**Problem**: `if (user.status == 1) { ... }`
**Fix**: 
```javascript
const ACTIVE_USER_STATUS = 1;
if (user.status == ACTIVE_USER_STATUS) { ... }
```

**Problem**: `getUserData()`, `fetchUserProfile()`, `retrieveUserSettings()`
**Fix**: `getUser()`, `getUserProfile()`, `getUserSettings()`

## 📚 Language-Specific Conventions

### JavaScript/TypeScript
```javascript
// Variables & functions: camelCase
const userAccountBalance = 1000;
function calculateMonthlyPayment() { }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Classes: PascalCase
class PaymentProcessor { }

// Boolean variables: is/has/can prefix
const isUserActive = true;
const hasValidSubscription = checkSubscription();
const canAccessPremiumFeatures = user.tier === 'premium';
```

### Python
```python
# Variables & functions: snake_case
user_account_balance = 1000
def calculate_monthly_payment():
    pass

# Constants: UPPER_SNAKE_CASE
MAX_RETRY_ATTEMPTS = 3

# Classes: PascalCase
class PaymentProcessor:
    pass

# Boolean variables: is/has/can prefix
is_user_active = True
has_valid_subscription = check_subscription()
can_access_premium_features = user.tier == 'premium'
```

### Java
```java
// Variables & methods: camelCase
int userAccountBalance = 1000;
public void calculateMonthlyPayment() { }

// Constants: UPPER_SNAKE_CASE
public static final int MAX_RETRY_ATTEMPTS = 3;

// Classes: PascalCase
public class PaymentProcessor { }

// Boolean variables: is/has/can prefix
boolean isUserActive = true;
boolean hasValidSubscription = checkSubscription();
boolean canAccessPremiumFeatures = user.getTier().equals("premium");
```

## 🎭 Context Considerations

### When Shorter Names Are OK
- **Loop counters in short loops**: `for (int i = 0; i < 10; i++)`
- **Well-established conventions**: `url`, `id`, `api`
- **Mathematical formulas**: `a`, `b`, `c` in `ax² + bx + c`
- **Very limited scope**: temporary variables in 3-5 line functions

### When Longer Names Are Worth It
- **Class and interface names**: `CustomerAccountManager` vs `CAM`
- **Public API methods**: `calculateTotalOrderAmount()` vs `calcTotal()`
- **Configuration constants**: `DATABASE_CONNECTION_TIMEOUT_SECONDS` vs `DB_TIMEOUT`
- **Domain-specific concepts**: `monthlyRecurringRevenue` vs `mrr`

## 💡 Pro Tips

1. **Read your code aloud** - If it's hard to pronounce or sounds awkward, improve the names
2. **Think like a new team member** - Would someone unfamiliar with the code understand these names?
3. **Use the domain language** - Prefer business terms over technical terms when appropriate
4. **Be consistent within modules** - Pick patterns and stick to them
5. **Refactor names as understanding evolves** - Don't be afraid to improve names as the code matures

## 🚀 Quick Self-Assessment

Rate your current codebase (1-5 scale):

- [ ] **Intention-Revealing**: Names clearly communicate purpose (1=never, 5=always)
- [ ] **Searchability**: I can easily find things when searching (1=difficult, 5=easy)
- [ ] **Consistency**: Similar operations use similar naming patterns (1=inconsistent, 5=very consistent)
- [ ] **Self-Documentation**: Code rarely needs comments to explain names (1=lots of comments needed, 5=self-explanatory)
- [ ] **Team Clarity**: New team members understand names quickly (1=lots of questions, 5=intuitive)

**Target**: All scores should be 4 or 5. If any score is 3 or below, focus on improving that aspect.

---

*Remember: The goal isn't perfect names, but names that clearly communicate intent to the human readers of your code.*
