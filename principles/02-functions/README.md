# Principle 2: Functions

> *"Functions should do one thing. They should do it well. They should do it only."* - Robert C. Martin

## 🎯 Learning Objectives

By the end of this section, you will:
- Write functions that are small, focused, and easy to understand
- Apply the Single Responsibility Principle to function design
- Design clean function signatures with meaningful parameters
- Understand when and how to extract functions from larger blocks of code
- Manage side effects in functions effectively
- Create functions that are easy to test and maintain

## 💡 Why Function Design Matters

**The Problem**: Large, complex functions are hard to understand, test, and modify. They often try to do multiple things, making them brittle and error-prone.

**The Solution**: Small, well-named functions that do one thing make code easier to read, test, and maintain.

**The Impact**:
- ✅ Faster debugging and troubleshooting
- ✅ Easier testing with focused test cases
- ✅ Better code reuse and composition
- ✅ Simpler refactoring and modification
- ✅ Clearer code organization and flow

---

## 📚 Core Guidelines

### 1. Small Functions

Functions should be small - ideally fitting on a single screen without scrolling.

**Rule of Thumb**: 5-20 lines is ideal, rarely over 50 lines.

**❌ Bad - Large Function:**
```javascript
function processUserRegistration(userData) {
    // 50+ lines of mixed concerns
    
    // Validation logic (10 lines)
    if (!userData.email || !userData.email.includes('@')) {
        throw new Error('Invalid email');
    }
    if (!userData.password || userData.password.length < 8) {
        throw new Error('Password too short');
    }
    // ... more validation
    
    // Data transformation (15 lines)
    const user = {
        id: generateId(),
        email: userData.email.toLowerCase().trim(),
        password: hashPassword(userData.password),
        firstName: capitalizeFirst(userData.firstName),
        lastName: capitalizeFirst(userData.lastName),
        createdAt: new Date(),
        status: 'pending'
    };
    
    // Database operations (10 lines)
    const existingUser = database.findUserByEmail(user.email);
    if (existingUser) {
        throw new Error('User already exists');
    }
    database.saveUser(user);
    
    // Email operations (15 lines)
    const emailTemplate = loadEmailTemplate('welcome');
    const personalizedEmail = emailTemplate
        .replace('{{firstName}}', user.firstName)
        .replace('{{confirmationLink}}', generateConfirmationLink(user.id));
    emailService.send(user.email, 'Welcome!', personalizedEmail);
    
    // Analytics and logging
    analytics.track('user_registered', { userId: user.id });
    logger.info(`User registered: ${user.email}`);
    
    return user;
}
```

**✅ Good - Small, Focused Functions:**
```javascript
function validateUserRegistrationData(userData) {
    validateEmail(userData.email);
    validatePassword(userData.password);
    validateRequiredFields(userData, ['firstName', 'lastName']);
}

function createUserFromRegistrationData(userData) {
    return {
        id: generateId(),
        email: normalizeEmail(userData.email),
        password: hashPassword(userData.password),
        firstName: capitalizeFirst(userData.firstName),
        lastName: capitalizeFirst(userData.lastName),
        createdAt: new Date(),
        status: 'pending'
    };
}

function checkUserDoesNotExist(email, database) {
    const existingUser = database.findUserByEmail(email);
    if (existingUser) {
        throw new Error('User already exists');
    }
}

function sendWelcomeEmail(user, emailService) {
    const personalizedEmail = buildWelcomeEmail(user);
    emailService.send(user.email, 'Welcome!', personalizedEmail);
}

function trackUserRegistration(user, analytics, logger) {
    analytics.track('user_registered', { userId: user.id });
    logger.info(`User registered: ${user.email}`);
}

function processUserRegistration(userData, dependencies) {
    const { database, emailService, analytics, logger } = dependencies;
    
    validateUserRegistrationData(userData);
    const user = createUserFromRegistrationData(userData);
    checkUserDoesNotExist(user.email, database);
    
    database.saveUser(user);
    sendWelcomeEmail(user, emailService);
    trackUserRegistration(user, analytics, logger);
    
    return user;
}
```

### 2. Do One Thing

Each function should have a single, clear responsibility.

**How to Identify**: If you can extract another function from a function with a meaningful name, then the original function is doing more than one thing.

**❌ Bad - Multiple Responsibilities:**
```python
def process_order_and_update_inventory(order):
    # Responsibility 1: Calculate order totals
    subtotal = sum(item.price * item.quantity for item in order.items)
    tax = subtotal * 0.08
    shipping = calculate_shipping_cost(order.address)
    total = subtotal + tax + shipping
    
    # Responsibility 2: Update inventory
    for item in order.items:
        product = inventory.get_product(item.product_id)
        if product.stock < item.quantity:
            raise InsufficientStockError(f"Not enough {product.name}")
        product.stock -= item.quantity
        inventory.save_product(product)
    
    # Responsibility 3: Process payment
    payment_result = payment_gateway.charge(order.payment_method, total)
    if not payment_result.success:
        # Rollback inventory changes
        for item in order.items:
            product = inventory.get_product(item.product_id)
            product.stock += item.quantity
            inventory.save_product(product)
        raise PaymentFailedError(payment_result.error)
    
    # Responsibility 4: Update order status
    order.status = 'confirmed'
    order.total = total
    order.confirmed_at = datetime.now()
    
    return order
```

**✅ Good - Single Responsibilities:**
```python
def calculate_order_total(order):
    subtotal = sum(item.price * item.quantity for item in order.items)
    tax = subtotal * 0.08
    shipping = calculate_shipping_cost(order.address)
    return subtotal + tax + shipping

def reserve_inventory_for_order(order, inventory):
    for item in order.items:
        reserve_product_quantity(item.product_id, item.quantity, inventory)

def reserve_product_quantity(product_id, quantity, inventory):
    product = inventory.get_product(product_id)
    if product.stock < quantity:
        raise InsufficientStockError(f"Not enough {product.name}")
    product.stock -= quantity
    inventory.save_product(product)

def process_payment_for_amount(payment_method, amount, payment_gateway):
    result = payment_gateway.charge(payment_method, amount)
    if not result.success:
        raise PaymentFailedError(result.error)
    return result

def confirm_order_with_total(order, total):
    order.status = 'confirmed'
    order.total = total
    order.confirmed_at = datetime.now()

def process_order(order, dependencies):
    total = calculate_order_total(order)
    
    try:
        reserve_inventory_for_order(order, dependencies.inventory)
        process_payment_for_amount(order.payment_method, total, dependencies.payment_gateway)
        confirm_order_with_total(order, total)
        return order
    except (InsufficientStockError, PaymentFailedError):
        rollback_inventory_reservations(order, dependencies.inventory)
        raise
```

### 3. Use Descriptive Names

Function names should clearly describe what the function does, following the verb-phrase pattern.

**Naming Patterns**:
- **Actions**: `saveUser()`, `sendEmail()`, `calculateTax()`
- **Queries**: `findUserById()`, `getUserPreferences()`, `isValidEmail()`
- **Boolean checks**: `isUserActive()`, `hasPermission()`, `canProcessPayment()`
- **Transformations**: `formatCurrency()`, `normalizePhoneNumber()`, `parseUserInput()`

**❌ Bad Function Names:**
```java
public void process(User user) { }           // Too vague
public boolean check(String input) { }       // What are we checking?
public void doStuff() { }                    // Completely meaningless
public void handleData(Data data) { }        // Handle how?
public String format(Object obj) { }         // Format to what?
```

**✅ Good Function Names:**
```java
public void activateUserAccount(User user) { }
public boolean isValidEmailFormat(String email) { }
public void sendWelcomeEmail(User user) { }
public void validateOrderItems(Order order) { }
public String formatCurrencyAmount(BigDecimal amount) { }
```

### 4. Function Arguments

Minimize the number of function arguments. Ideal is zero, good is one or two, three should be avoided, and more than three requires special justification.

**❌ Bad - Too Many Parameters:**
```javascript
function createUser(firstName, lastName, email, phone, address, city, state, zip, country, birthDate, gender, newsletter) {
    // Too many parameters to remember and pass correctly
}

function calculateShipping(weight, dimensions, origin, destination, speed, insurance, signature, packaging) {
    // Hard to call correctly
}
```

**✅ Good - Grouped Parameters:**
```javascript
function createUser(personalInfo, contactInfo, preferences) {
    // Clear groupings of related data
}

function calculateShipping(shipment, options) {
    // Shipment contains item details, options contains delivery preferences
}

// Or use objects for complex parameters
function createUser(userData) {
    const { personalInfo, contactInfo, preferences } = userData;
    // Destructure for clarity
}
```

**Parameter Design Guidelines**:

**Zero Parameters (Niladic) - Best:**
```python
def get_current_timestamp():
    return datetime.now()

def generate_unique_id():
    return str(uuid.uuid4())
```

**One Parameter (Monadic) - Good:**
```python
def validate_email(email):
    return '@' in email and '.' in email

def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())
```

**Two Parameters (Dyadic) - Acceptable:**
```python
def calculate_distance(point1, point2):
    return math.sqrt((point2.x - point1.x)**2 + (point2.y - point1.y)**2)

def send_email(recipient, message):
    email_service.send(recipient, message)
```

**Three Parameters (Triadic) - Avoid When Possible:**
```python
# Consider if these could be grouped
def create_point(x, y, z):  # Might be acceptable for coordinate systems
    return Point(x, y, z)

# Better: Use an object or separate the concerns
def create_point(coordinates):  # coordinates = {x: 1, y: 2, z: 3}
    return Point(coordinates.x, coordinates.y, coordinates.z)
```

### 5. No Side Effects

Functions should not have unexpected side effects. If a function does have side effects, they should be clearly indicated in the name.

**For detailed information on side effects, see**: [Understanding Side Effects](../../resources/concepts/side-effects.md)

**❌ Bad - Hidden Side Effects:**
```javascript
function calculateTax(order) {
    const tax = order.subtotal * 0.08;
    
    // Hidden side effect: modifies the order
    order.tax = tax;
    
    // Hidden side effect: logs to external system
    auditLogger.log('tax_calculated', order.id, tax);
    
    return tax;
}
```

**✅ Good - Explicit Side Effects:**
```javascript
function calculateTaxAmount(subtotal) {
    // Pure function - no side effects
    return subtotal * 0.08;
}

function calculateAndSetOrderTax(order, auditLogger) {
    // Name clearly indicates it modifies the order
    const tax = calculateTaxAmount(order.subtotal);
    order.tax = tax;
    auditLogger.log('tax_calculated', order.id, tax);
    return tax;
}
```

### 6. Command Query Separation

Functions should either do something (command) or return something (query), but not both.

**❌ Bad - Mixed Command and Query:**
```java
public boolean setUserActive(User user) {
    user.setActive(true);              // Command: modifies state
    user.setLastModified(new Date());  // Command: modifies state
    database.saveUser(user);           // Command: persists changes
    return user.isActive();            // Query: returns information
}
```

**✅ Good - Separated Command and Query:**
```java
// Command: Does something, returns minimal success indicator
public void activateUser(User user) {
    user.setActive(true);
    user.setLastModified(new Date());
    database.saveUser(user);
}

// Query: Returns information, no side effects
public boolean isUserActive(User user) {
    return user.isActive();
}

// Usage is explicit about intent
activateUser(user);
if (isUserActive(user)) {
    // User is now active
}
```

### 7. Extract Till You Drop

When you see a function doing multiple things, extract functions until each does only one thing.

**Extraction Process**:

```python
# Original function doing multiple things
def process_customer_order(order_data):
    # Validation
    if not order_data.get('customer_id'):
        raise ValueError("Customer ID required")
    if not order_data.get('items') or len(order_data['items']) == 0:
        raise ValueError("Order must have items")
    
    # Price calculation
    subtotal = 0
    for item in order_data['items']:
        if item['quantity'] <= 0:
            raise ValueError("Item quantity must be positive")
        subtotal += item['price'] * item['quantity']
    
    discount = calculate_customer_discount(order_data['customer_id'], subtotal)
    total = subtotal - discount
    
    # Order creation
    order = {
        'id': generate_order_id(),
        'customer_id': order_data['customer_id'],
        'items': order_data['items'],
        'subtotal': subtotal,
        'discount': discount,
        'total': total,
        'status': 'pending',
        'created_at': datetime.now()
    }
    
    # Persistence and notifications
    database.save_order(order)
    send_order_confirmation_email(order)
    update_inventory(order['items'])
    
    return order
```

**After Extraction**:
```python
def validate_order_data(order_data):
    if not order_data.get('customer_id'):
        raise ValueError("Customer ID required")
    if not order_data.get('items') or len(order_data['items']) == 0:
        raise ValueError("Order must have items")

def validate_order_items(items):
    for item in items:
        if item['quantity'] <= 0:
            raise ValueError("Item quantity must be positive")

def calculate_order_subtotal(items):
    return sum(item['price'] * item['quantity'] for item in items)

def calculate_order_total(subtotal, discount):
    return subtotal - discount

def build_order_object(order_data, subtotal, discount, total):
    return {
        'id': generate_order_id(),
        'customer_id': order_data['customer_id'],
        'items': order_data['items'],
        'subtotal': subtotal,
        'discount': discount,
        'total': total,
        'status': 'pending',
        'created_at': datetime.now()
    }

def persist_and_notify_order(order):
    database.save_order(order)
    send_order_confirmation_email(order)
    update_inventory(order['items'])

def process_customer_order(order_data):
    validate_order_data(order_data)
    validate_order_items(order_data['items'])
    
    subtotal = calculate_order_subtotal(order_data['items'])
    discount = calculate_customer_discount(order_data['customer_id'], subtotal)
    total = calculate_order_total(subtotal, discount)
    
    order = build_order_object(order_data, subtotal, discount, total)
    persist_and_notify_order(order)
    
    return order
```

---

## 🏗️ Function Design Patterns

### 1. Pure Functions

Functions that always return the same output for the same input and have no side effects.

```javascript
// Pure functions - easy to test and reason about
function addNumbers(a, b) {
    return a + b;
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function calculateTaxAmount(subtotal, taxRate) {
    return subtotal * taxRate;
}
```

### 2. Higher-Order Functions

Functions that take other functions as parameters or return functions.

```javascript
// Higher-order function for filtering
function createValidator(criteria) {
    return function(item) {
        return Object.keys(criteria).every(key => 
            item[key] === criteria[key]
        );
    };
}

// Usage
const activeUserValidator = createValidator({ status: 'active' });
const activeUsers = users.filter(activeUserValidator);

// Higher-order function for error handling
function withErrorHandling(fn) {
    return function(...args) {
        try {
            return fn(...args);
        } catch (error) {
            logger.error('Function error:', error);
            throw error;
        }
    };
}

// Usage
const safeProcessPayment = withErrorHandling(processPayment);
```

### 3. Function Composition

Building complex operations by combining simple functions.

```python
def compose(*functions):
    """Compose multiple functions into a single function"""
    return lambda x: reduce(lambda acc, f: f(acc), functions, x)

# Simple functions
def normalize_email(email):
    return email.strip().lower()

def validate_email_format(email):
    if '@' not in email or '.' not in email:
        raise ValueError("Invalid email format")
    return email

def check_email_domain_allowed(email):
    domain = email.split('@')[1]
    if domain in BLOCKED_DOMAINS:
        raise ValueError("Email domain not allowed")
    return email

# Composed function
process_email = compose(
    normalize_email,
    validate_email_format,
    check_email_domain_allowed
)

# Usage
try:
    clean_email = process_email("  USER@EXAMPLE.COM  ")
except ValueError as e:
    print(f"Email processing failed: {e}")
```

### 4. Error Handling Patterns

Clear patterns for handling errors in functions.

```java
// Option 1: Exception throwing with clear error types
public void validateUser(User user) throws ValidationException {
    if (user.getEmail() == null || user.getEmail().isEmpty()) {
        throw new ValidationException("Email is required");
    }
    if (!isValidEmailFormat(user.getEmail())) {
        throw new ValidationException("Invalid email format");
    }
}

// Option 2: Result objects for more controlled error handling
public class ValidationResult {
    private final boolean isValid;
    private final List<String> errors;
    
    // Constructor and getters...
}

public ValidationResult validateUser(User user) {
    List<String> errors = new ArrayList<>();
    
    if (user.getEmail() == null || user.getEmail().isEmpty()) {
        errors.add("Email is required");
    } else if (!isValidEmailFormat(user.getEmail())) {
        errors.add("Invalid email format");
    }
    
    return new ValidationResult(errors.isEmpty(), errors);
}

// Option 3: Optional for functions that might not return a value
public Optional<User> findUserByEmail(String email) {
    User user = database.findUserByEmail(email);
    return Optional.ofNullable(user);
}
```

---

## 🧪 Testing Functions

### 1. Pure Functions - Easy Testing
```python
def test_calculate_tax_amount():
    # Pure function - easy to test
    assert calculate_tax_amount(100, 0.08) == 8.0
    assert calculate_tax_amount(0, 0.08) == 0.0
    assert calculate_tax_amount(100, 0) == 0.0

def test_format_currency():
    assert format_currency(1234.56) == "$1,234.56"
    assert format_currency(0) == "$0.00"
```

### 2. Functions with Dependencies - Use Injection
```python
def test_send_welcome_email():
    # Mock dependencies
    mock_email_service = Mock()
    user = User(email="test@example.com", name="Test User")
    
    # Test function with injected dependency
    send_welcome_email(user, mock_email_service)
    
    # Verify interaction
    mock_email_service.send.assert_called_once_with(
        "test@example.com",
        "Welcome!",
        any(str)  # Email content
    )

def test_process_order():
    # Mock all dependencies
    mock_database = Mock()
    mock_email_service = Mock()
    mock_inventory = Mock()
    
    dependencies = Dependencies(
        database=mock_database,
        email_service=mock_email_service,
        inventory=mock_inventory
    )
    
    order_data = {...}  # Test data
    
    result = process_customer_order(order_data, dependencies)
    
    # Verify all interactions
    mock_database.save_order.assert_called_once()
    mock_email_service.send_confirmation.assert_called_once()
    mock_inventory.update.assert_called_once()
```

### 3. Testing Error Conditions
```python
def test_validate_email_with_invalid_input():
    with pytest.raises(ValueError, match="Invalid email format"):
        validate_email_format("invalid-email")
    
    with pytest.raises(ValueError, match="Email is required"):
        validate_email_format("")

def test_process_order_with_insufficient_inventory():
    mock_inventory = Mock()
    mock_inventory.reserve_items.side_effect = InsufficientStockError("Not enough stock")
    
    with pytest.raises(InsufficientStockError):
        process_customer_order(order_data, dependencies_with_mock_inventory)
```

---

## 📝 Quick Function Design Checklist

When writing or reviewing functions, ask:

### ✅ **Size and Focus**
- [ ] Can this function fit on one screen?
- [ ] Does this function do only one thing?
- [ ] Can I extract a meaningful function from this function?
- [ ] Is the function's responsibility clear from its name?

### ✅ **Naming and Interface**
- [ ] Does the function name clearly describe what it does?
- [ ] Are there 3 or fewer parameters?
- [ ] Could any parameters be grouped into objects?
- [ ] Do parameter names clearly indicate what should be passed?

### ✅ **Side Effects and Dependencies**
- [ ] Are all side effects indicated in the function name?
- [ ] Are external dependencies explicitly passed as parameters?
- [ ] Can this function be tested without complex setup?
- [ ] Does this function follow command-query separation?

### ✅ **Error Handling**
- [ ] Are error conditions handled appropriately?
- [ ] Are error messages clear and actionable?
- [ ] Are exceptions used for exceptional conditions, not control flow?
- [ ] Is the error handling strategy consistent with the rest of the codebase?

---

## 🔗 What's Next?

Once you've mastered function design, you're ready for:
- **[Principle 3: Comments](../03-comments/README.md)** - When and how to write good comments
- **[Function Examples](./examples/README.md)** - See function principles in action
- **[Function Exercises](../../exercises/principle-practice/02-functions/README.md)** - Practice function design skills

---

*Remember: The goal of good function design is to make your code tell a story. Each function should be a paragraph in that story, clearly expressing one idea and leading naturally to the next.*
