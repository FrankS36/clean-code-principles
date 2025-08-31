# Principle 6: Error Handling

> *"Error handling is important, but if it obscures logic, it's wrong."* - Robert C. Martin

## 🧭 **Navigation**
← **[Previous: Objects](../05-objects-and-data/README.md)** | **[Learning Path](../../LEARNING_PATH.md)** | **[Next: Boundaries →](../07-boundaries/README.md)**

**This Principle:** [Examples](../../examples/before-after/error-handling-examples/README.md) | [Exercises](../../exercises/principle-practice/06-error-handling/README.md) | [Checklist](./checklist.md)

## 🎯 Overview

Clean error handling is crucial for building robust, maintainable applications. It's not just about catching exceptions - it's about designing systems that gracefully handle failure, provide meaningful feedback, and maintain system integrity. This principle teaches you to write error handling code that is as clean and understandable as your business logic.

## 📚 Core Guidelines

### 1. **Use Exceptions Rather Than Return Codes**
Exceptions separate error handling from business logic, making both cleaner and more focused.

**❌ Bad (Return Codes):**
```java
public class DeviceController {
    public static final int DEVICE_SUSPENDED = -1;
    public static final int DEVICE_SHUTDOWN = -2;
    public static final int DEVICE_OK = 0;
    
    public int shutdown() {
        DeviceHandle handle = getHandle();
        if (handle == null) {
            return DEVICE_SUSPENDED;
        }
        
        if (handle.getStatus() != DEVICE_ACTIVE) {
            return DEVICE_SHUTDOWN;
        }
        
        pauseDevice(handle);
        clearDeviceWorkQueue(handle);
        closeDevice(handle);
        return DEVICE_OK;
    }
}

// Usage becomes cluttered with error checking
DeviceController controller = new DeviceController();
int result = controller.shutdown();
if (result == DeviceController.DEVICE_SUSPENDED) {
    log.error("Device was suspended");
} else if (result == DeviceController.DEVICE_SHUTDOWN) {
    log.error("Device already shutdown");
} else if (result == DeviceController.DEVICE_OK) {
    log.info("Device shutdown successfully");
}
```

**✅ Good (Exceptions):**
```java
public class DeviceController {
    public void shutdown() throws DeviceException {
        DeviceHandle handle = getHandle();
        if (handle == null) {
            throw new DeviceException("Device is suspended");
        }
        
        if (handle.getStatus() != DEVICE_ACTIVE) {
            throw new DeviceException("Device is already shutdown");
        }
        
        pauseDevice(handle);
        clearDeviceWorkQueue(handle);
        closeDevice(handle);
    }
}

// Usage is clean and focused
try {
    DeviceController controller = new DeviceController();
    controller.shutdown();
    log.info("Device shutdown successfully");
} catch (DeviceException e) {
    log.error("Device shutdown failed: " + e.getMessage());
}
```

### 2. **Write Try-Catch-Finally First**
Design your error handling structure before implementing business logic.

**✅ Good Structure:**
```python
def process_user_data(file_path: str) -> UserData:
    file_handle = None
    try:
        # Happy path logic
        file_handle = open(file_path, 'r')
        raw_data = file_handle.read()
        validated_data = validate_user_data(raw_data)
        return parse_user_data(validated_data)
        
    except FileNotFoundError:
        raise UserDataException(f"User data file not found: {file_path}")
    except ValidationError as e:
        raise UserDataException(f"Invalid user data format: {e}")
    except ParseError as e:
        raise UserDataException(f"Failed to parse user data: {e}")
    finally:
        if file_handle:
            file_handle.close()
```

### 3. **Use Unchecked Exceptions for Programming Errors**
Different types of errors require different handling strategies.

**Checked Exceptions (Expected Conditions):**
```java
// Business conditions that callers should handle
public class OrderService {
    public void processOrder(Order order) throws InsufficientInventoryException, InvalidPaymentException {
        if (!hasInventory(order)) {
            throw new InsufficientInventoryException("Not enough items in stock");
        }
        
        if (!isValidPayment(order.getPayment())) {
            throw new InvalidPaymentException("Payment method declined");
        }
        
        // Process order...
    }
}
```

**Unchecked Exceptions (Programming Errors):**
```java
// Programming errors that indicate bugs
public class CustomerRepository {
    public Customer findById(String customerId) {
        if (customerId == null || customerId.trim().isEmpty()) {
            throw new IllegalArgumentException("Customer ID cannot be null or empty");
        }
        
        if (!isValidUUID(customerId)) {
            throw new IllegalArgumentException("Customer ID must be a valid UUID");
        }
        
        return database.findCustomer(customerId);
    }
}
```

### 4. **Provide Context with Exceptions**
Exception messages should provide enough information to understand and fix the problem.

**❌ Bad (No Context):**
```javascript
class UserService {
    async createUser(userData) {
        if (!userData.email) {
            throw new Error("Invalid email");
        }
        
        if (await this.userExists(userData.email)) {
            throw new Error("User exists");
        }
        
        const user = await this.database.create(userData);
        if (!user) {
            throw new Error("Creation failed");
        }
        
        return user;
    }
}
```

**✅ Good (Rich Context):**
```javascript
class UserService {
    async createUser(userData) {
        if (!userData.email || !this.isValidEmail(userData.email)) {
            throw new ValidationError(
                `Invalid email address: '${userData.email}'. Email must be in valid format (e.g., user@domain.com)`
            );
        }
        
        if (await this.userExists(userData.email)) {
            throw new DuplicateUserError(
                `User with email '${userData.email}' already exists. Use a different email or try logging in.`
            );
        }
        
        try {
            const user = await this.database.create(userData);
            return user;
        } catch (error) {
            throw new UserCreationError(
                `Failed to create user '${userData.email}': ${error.message}. Please try again or contact support.`,
                { originalError: error, userData: this.sanitizeUserData(userData) }
            );
        }
    }
}
```

### 5. **Define Exception Classes in Terms of Caller's Needs**
Create exception hierarchies that make sense for how they'll be handled.

**✅ Good Exception Hierarchy:**
```csharp
// Base exception for all payment-related errors
public abstract class PaymentException : Exception
{
    public string TransactionId { get; }
    public decimal Amount { get; }
    
    protected PaymentException(string message, string transactionId, decimal amount) 
        : base(message)
    {
        TransactionId = transactionId;
        Amount = amount;
    }
}

// Retryable payment errors
public class TemporaryPaymentException : PaymentException
{
    public TimeSpan RetryAfter { get; }
    
    public TemporaryPaymentException(string message, string transactionId, decimal amount, TimeSpan retryAfter)
        : base(message, transactionId, amount)
    {
        RetryAfter = retryAfter;
    }
}

// Permanent payment errors
public class PermanentPaymentException : PaymentException
{
    public string ErrorCode { get; }
    
    public PermanentPaymentException(string message, string transactionId, decimal amount, string errorCode)
        : base(message, transactionId, amount)
    {
        ErrorCode = errorCode;
    }
}

// Usage allows for different handling strategies
try 
{
    paymentProcessor.ProcessPayment(order);
}
catch (TemporaryPaymentException ex)
{
    // Retry logic
    scheduleRetry(ex.TransactionId, ex.RetryAfter);
}
catch (PermanentPaymentException ex)
{
    // Log and notify customer
    logger.LogError($"Payment failed permanently: {ex.ErrorCode}");
    notificationService.NotifyPaymentFailed(order.CustomerId, ex.Message);
}
```

### 6. **Define the Normal Flow**
Don't use exceptions for normal control flow. Design your API to minimize exceptional cases.

**❌ Bad (Exception for Normal Flow):**
```python
class ExpenseService:
    def calculate_total_expenses(self, employee_id: str) -> float:
        try:
            expenses = self.get_employee_expenses(employee_id)
            return sum(expense.amount for expense in expenses)
        except NoExpensesFoundException:
            return 0.0  # Using exception for normal case
```

**✅ Good (Normal Flow Design):**
```python
class ExpenseService:
    def calculate_total_expenses(self, employee_id: str) -> float:
        expenses = self.get_employee_expenses(employee_id)  # Returns empty list if none
        return sum(expense.amount for expense in expenses)
    
    def get_employee_expenses(self, employee_id: str) -> List[Expense]:
        """Returns list of expenses. Empty list if employee has no expenses."""
        if not self.employee_exists(employee_id):
            raise EmployeeNotFoundException(f"Employee {employee_id} not found")
        
        return self.database.find_expenses_by_employee(employee_id) or []
```

### 7. **Don't Pass Null**
Avoid null returns and null parameters. Use optional types or throw exceptions.

**❌ Bad (Null Returns and Parameters):**
```java
public class CustomerService {
    // Bad: Returns null for "not found"
    public Customer findCustomer(String customerId) {
        if (customerId == null) {
            return null;  // Accepting null parameter
        }
        
        Customer customer = database.findById(customerId);
        return customer;  // Might return null
    }
    
    // Bad: Accepts null parameters
    public void updateCustomer(Customer customer, String notes) {
        if (customer == null) return;  // Silent failure
        
        customer.setNotes(notes);  // notes might be null
        database.save(customer);
    }
}
```

**✅ Good (Clear Contracts):**
```java
public class CustomerService {
    // Good: Clear contract with exceptions
    public Customer findCustomer(String customerId) throws CustomerNotFoundException {
        if (customerId == null || customerId.trim().isEmpty()) {
            throw new IllegalArgumentException("Customer ID cannot be null or empty");
        }
        
        Customer customer = database.findById(customerId);
        if (customer == null) {
            throw new CustomerNotFoundException("Customer not found: " + customerId);
        }
        
        return customer;
    }
    
    // Good: Optional with validation
    public Optional<Customer> findCustomerOptional(String customerId) {
        if (customerId == null || customerId.trim().isEmpty()) {
            return Optional.empty();
        }
        
        Customer customer = database.findById(customerId);
        return Optional.ofNullable(customer);
    }
    
    // Good: Clear parameter requirements
    public void updateCustomer(Customer customer, Optional<String> notes) {
        if (customer == null) {
            throw new IllegalArgumentException("Customer cannot be null");
        }
        
        notes.ifPresent(customer::setNotes);
        database.save(customer);
    }
}
```

### 8. **Don't Return Null**
Use alternatives to null returns that make the API more expressive and safe.

**✅ Good Alternatives to Null:**
```typescript
class UserRepository {
    // Option 1: Use Optional/Maybe types
    async findByEmail(email: string): Promise<User | null> {
        if (!email) {
            throw new Error('Email is required');
        }
        
        const user = await this.database.findOne({ email });
        return user; // Explicitly nullable, but clear
    }
    
    // Option 2: Use Result/Either types
    async findByEmailSafe(email: string): Promise<Result<User, UserError>> {
        try {
            if (!email) {
                return Result.error(new ValidationError('Email is required'));
            }
            
            const user = await this.database.findOne({ email });
            if (!user) {
                return Result.error(new NotFoundError('User not found'));
            }
            
            return Result.success(user);
        } catch (error) {
            return Result.error(new DatabaseError('Database query failed', error));
        }
    }
    
    // Option 3: Use collections for multiple results
    async findByRole(role: string): Promise<User[]> {
        if (!role) {
            throw new Error('Role is required');
        }
        
        const users = await this.database.find({ role });
        return users; // Empty array is better than null
    }
    
    // Option 4: Use special case objects
    async findByEmailOrGuest(email: string): Promise<User> {
        if (!email) {
            return User.guest(); // Special case object
        }
        
        const user = await this.database.findOne({ email });
        return user || User.guest();
    }
}
```

## 🎨 Error Handling Patterns

### 1. **Resource Management Pattern**
Always clean up resources, even when exceptions occur.

```python
from contextlib import contextmanager
import logging

@contextmanager
def managed_database_connection():
    connection = None
    try:
        connection = create_database_connection()
        connection.begin_transaction()
        yield connection
        connection.commit()
    except Exception as e:
        if connection:
            connection.rollback()
        logging.error(f"Database operation failed: {e}")
        raise
    finally:
        if connection:
            connection.close()

# Usage
def transfer_funds(from_account: str, to_account: str, amount: float):
    with managed_database_connection() as db:
        from_balance = db.get_account_balance(from_account)
        if from_balance < amount:
            raise InsufficientFundsError("Not enough funds for transfer")
        
        db.debit_account(from_account, amount)
        db.credit_account(to_account, amount)
        db.log_transaction(from_account, to_account, amount)
```

### 2. **Circuit Breaker Pattern**
Prevent cascading failures in distributed systems.

```java
public class CircuitBreaker {
    private enum State { CLOSED, OPEN, HALF_OPEN }
    
    private State state = State.CLOSED;
    private int failureCount = 0;
    private final int failureThreshold;
    private final long timeout;
    private long lastFailureTime;
    
    public CircuitBreaker(int failureThreshold, long timeout) {
        this.failureThreshold = failureThreshold;
        this.timeout = timeout;
    }
    
    public <T> T execute(Supplier<T> operation) throws CircuitBreakerOpenException {
        if (state == State.OPEN) {
            if (System.currentTimeMillis() - lastFailureTime < timeout) {
                throw new CircuitBreakerOpenException("Circuit breaker is OPEN");
            } else {
                state = State.HALF_OPEN;
            }
        }
        
        try {
            T result = operation.get();
            reset();
            return result;
        } catch (Exception e) {
            recordFailure();
            throw e;
        }
    }
    
    private void reset() {
        failureCount = 0;
        state = State.CLOSED;
    }
    
    private void recordFailure() {
        failureCount++;
        lastFailureTime = System.currentTimeMillis();
        
        if (failureCount >= failureThreshold) {
            state = State.OPEN;
        }
    }
}
```

### 3. **Retry Pattern with Exponential Backoff**
Handle transient failures gracefully.

```typescript
class RetryHandler {
    static async withRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000,
        maxDelay: number = 30000
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                
                if (attempt === maxRetries) {
                    throw new MaxRetriesExceededException(
                        `Operation failed after ${maxRetries} retries: ${lastError.message}`,
                        lastError
                    );
                }
                
                if (!this.isRetryableError(error)) {
                    throw error;
                }
                
                const delay = Math.min(
                    baseDelay * Math.pow(2, attempt),
                    maxDelay
                );
                
                console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
        
        throw lastError!;
    }
    
    private static isRetryableError(error: any): boolean {
        // Define which errors are worth retrying
        return error.code === 'NETWORK_ERROR' ||
               error.code === 'TIMEOUT' ||
               error.code === 'SERVICE_UNAVAILABLE' ||
               (error.status >= 500 && error.status < 600);
    }
    
    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Usage
async function fetchUserData(userId: string): Promise<UserData> {
    return RetryHandler.withRetry(
        async () => {
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) {
                throw new ApiError(`Failed to fetch user: ${response.status}`, response.status);
            }
            return response.json();
        },
        3,  // max retries
        1000,  // base delay
        10000  // max delay
    );
}
```

### 4. **Error Aggregation Pattern**
Collect multiple errors before reporting them.

```csharp
public class ValidationResult
{
    private readonly List<ValidationError> _errors = new List<ValidationError>();
    
    public bool IsValid => !_errors.Any();
    public IReadOnlyList<ValidationError> Errors => _errors.AsReadOnly();
    
    public ValidationResult AddError(string field, string message)
    {
        _errors.Add(new ValidationError(field, message));
        return this;
    }
    
    public ValidationResult AddErrors(IEnumerable<ValidationError> errors)
    {
        _errors.AddRange(errors);
        return this;
    }
    
    public void ThrowIfInvalid()
    {
        if (!IsValid)
        {
            throw new ValidationException("Validation failed", _errors);
        }
    }
}

public class UserValidator
{
    public ValidationResult ValidateUser(CreateUserRequest request)
    {
        var result = new ValidationResult();
        
        if (string.IsNullOrWhiteSpace(request.Email))
            result.AddError(nameof(request.Email), "Email is required");
        else if (!IsValidEmail(request.Email))
            result.AddError(nameof(request.Email), "Email format is invalid");
            
        if (string.IsNullOrWhiteSpace(request.Name))
            result.AddError(nameof(request.Name), "Name is required");
        else if (request.Name.Length < 2)
            result.AddError(nameof(request.Name), "Name must be at least 2 characters");
            
        if (request.Age < 0 || request.Age > 150)
            result.AddError(nameof(request.Age), "Age must be between 0 and 150");
            
        return result;
    }
}
```

## 🛠️ Error Handling Techniques

### 1. **Fail Fast**
Detect and report errors as early as possible.

```java
public class OrderProcessor {
    public void processOrder(Order order) {
        // Fail fast - validate everything upfront
        validateOrder(order);
        validateCustomer(order.getCustomerId());
        validateInventory(order.getItems());
        validatePayment(order.getPayment());
        
        // If we get here, we know everything is valid
        processPayment(order.getPayment());
        reserveInventory(order.getItems());
        scheduleShipping(order);
        sendConfirmation(order);
    }
    
    private void validateOrder(Order order) {
        if (order == null) {
            throw new IllegalArgumentException("Order cannot be null");
        }
        if (order.getItems().isEmpty()) {
            throw new InvalidOrderException("Order must contain at least one item");
        }
        if (order.getCustomerId() == null) {
            throw new InvalidOrderException("Order must have a customer ID");
        }
    }
}
```

### 2. **Error Context Preservation**
Maintain error context through the call stack.

```python
class ErrorContext:
    def __init__(self):
        self.context = {}
    
    def add(self, key: str, value: any) -> 'ErrorContext':
        self.context[key] = value
        return self
    
    def to_dict(self) -> dict:
        return self.context.copy()

class ProcessingError(Exception):
    def __init__(self, message: str, context: ErrorContext = None):
        super().__init__(message)
        self.context = context or ErrorContext()
    
    def add_context(self, key: str, value: any) -> 'ProcessingError':
        self.context.add(key, value)
        return self

def process_file(file_path: str) -> ProcessedData:
    context = ErrorContext().add("file_path", file_path)
    
    try:
        raw_data = read_file(file_path)
        context.add("file_size", len(raw_data))
        
        parsed_data = parse_data(raw_data)
        context.add("record_count", len(parsed_data))
        
        return transform_data(parsed_data)
        
    except FileNotFoundError as e:
        raise ProcessingError(f"File not found: {file_path}", context)
    except ParseError as e:
        context.add("parse_position", e.position)
        raise ProcessingError(f"Failed to parse file: {e}", context)
    except TransformError as e:
        context.add("failed_record", e.record_id)
        raise ProcessingError(f"Failed to transform data: {e}", context)
```

### 3. **Graceful Degradation**
Provide reduced functionality when full functionality isn't available.

```javascript
class RecommendationService {
    constructor() {
        this.mlService = new MachineLearningService();
        this.fallbackService = new BasicRecommendationService();
        this.cacheService = new CacheService();
    }
    
    async getRecommendations(userId, options = {}) {
        const cacheKey = `recommendations:${userId}:${JSON.stringify(options)}`;
        
        try {
            // Try cache first
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
            
            // Try ML service
            const recommendations = await this.mlService.getRecommendations(userId, options);
            await this.cacheService.set(cacheKey, recommendations, 3600); // 1 hour
            
            return recommendations;
            
        } catch (error) {
            console.warn(`ML recommendation service failed: ${error.message}`);
            
            try {
                // Fallback to basic service
                const basicRecommendations = await this.fallbackService.getRecommendations(userId, options);
                return {
                    ...basicRecommendations,
                    degraded: true,
                    reason: 'ML service unavailable'
                };
                
            } catch (fallbackError) {
                console.error(`Both recommendation services failed: ${fallbackError.message}`);
                
                // Last resort - return popular items
                return {
                    items: await this.getPopularItems(options.category),
                    degraded: true,
                    reason: 'All recommendation services unavailable'
                };
            }
        }
    }
}
```

## 📊 Error Monitoring and Observability

### 1. **Structured Error Logging**
Make errors searchable and actionable.

```python
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def log_error(self, 
                  message: str, 
                  exception: Exception = None,
                  user_id: str = None,
                  request_id: str = None,
                  additional_context: Dict[str, Any] = None):
        
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "ERROR",
            "message": message,
            "user_id": user_id,
            "request_id": request_id,
        }
        
        if exception:
            log_entry.update({
                "exception_type": type(exception).__name__,
                "exception_message": str(exception),
                "stack_trace": self._get_stack_trace(exception)
            })
        
        if additional_context:
            log_entry["context"] = additional_context
        
        self.logger.error(json.dumps(log_entry))
    
    def _get_stack_trace(self, exception: Exception) -> str:
        import traceback
        return traceback.format_exception(type(exception), exception, exception.__traceback__)

# Usage
logger = StructuredLogger("payment_service")

try:
    process_payment(payment_data)
except PaymentValidationError as e:
    logger.log_error(
        "Payment validation failed",
        exception=e,
        user_id=payment_data.user_id,
        request_id=payment_data.request_id,
        additional_context={
            "payment_amount": payment_data.amount,
            "payment_method": payment_data.method,
            "validation_errors": e.validation_errors
        }
    )
    raise
```

### 2. **Error Metrics and Alerts**
Track error patterns and rates.

```typescript
class ErrorMetrics {
    private static instance: ErrorMetrics;
    private metricsCollector: MetricsCollector;
    
    constructor() {
        this.metricsCollector = new MetricsCollector();
    }
    
    static getInstance(): ErrorMetrics {
        if (!ErrorMetrics.instance) {
            ErrorMetrics.instance = new ErrorMetrics();
        }
        return ErrorMetrics.instance;
    }
    
    recordError(errorType: string, service: string, metadata: Record<string, any> = {}) {
        // Increment error counter
        this.metricsCollector.increment('errors.total', {
            error_type: errorType,
            service: service,
            ...metadata
        });
        
        // Track error rate
        this.metricsCollector.gauge('errors.rate', 1, {
            service: service,
            time_window: '1m'
        });
        
        // Set alert thresholds
        if (this.getErrorRate(service) > 0.05) { // 5% error rate
            this.triggerAlert('HIGH_ERROR_RATE', {
                service,
                current_rate: this.getErrorRate(service)
            });
        }
    }
    
    private getErrorRate(service: string): number {
        const totalRequests = this.metricsCollector.getCounter(`requests.total.${service}`);
        const totalErrors = this.metricsCollector.getCounter(`errors.total.${service}`);
        
        return totalRequests > 0 ? totalErrors / totalRequests : 0;
    }
    
    private triggerAlert(alertType: string, context: Record<string, any>) {
        console.error(`ALERT: ${alertType}`, context);
        // Send to alerting system (PagerDuty, Slack, etc.)
    }
}
```

## ⚠️ Common Error Handling Anti-Patterns

### 1. **Silent Failures**
```javascript
// ❌ BAD - Swallowing exceptions
try {
    processImportantData();
} catch (error) {
    // Silent failure - error is lost
}

// ✅ GOOD - Proper error handling
try {
    processImportantData();
} catch (error) {
    logger.error('Failed to process important data', error);
    notifyAdministrators(error);
    throw new ProcessingException('Data processing failed', error);
}
```

### 2. **Generic Catch-All Handlers**
```java
// ❌ BAD - Too generic
try {
    processOrder(order);
} catch (Exception e) {
    return "Order processing failed";
}

// ✅ GOOD - Specific handling
try {
    processOrder(order);
} catch (InvalidOrderException e) {
    return "Order validation failed: " + e.getMessage();
} catch (PaymentDeclinedException e) {
    return "Payment was declined: " + e.getReason();
} catch (InventoryException e) {
    return "Items are out of stock: " + e.getUnavailableItems();
} catch (Exception e) {
    logger.error("Unexpected error processing order", e);
    return "An unexpected error occurred. Please try again.";
}
```

### 3. **Error Codes Instead of Exceptions**
```python
# ❌ BAD - Return codes obscure the happy path
def withdraw_money(account_id: str, amount: float) -> tuple[bool, str, float]:
    account = get_account(account_id)
    if not account:
        return False, "Account not found", 0.0
    
    if not account.is_active:
        return False, "Account is inactive", 0.0
    
    if account.balance < amount:
        return False, "Insufficient funds", account.balance
    
    account.balance -= amount
    save_account(account)
    return True, "Success", account.balance

# ✅ GOOD - Exceptions separate error handling
def withdraw_money(account_id: str, amount: float) -> float:
    account = get_account(account_id)
    if not account:
        raise AccountNotFoundException(f"Account {account_id} not found")
    
    if not account.is_active:
        raise InactiveAccountException(f"Account {account_id} is inactive")
    
    if account.balance < amount:
        raise InsufficientFundsException(
            f"Cannot withdraw {amount}. Available balance: {account.balance}"
        )
    
    account.balance -= amount
    save_account(account)
    return account.balance
```

## 🎯 Key Takeaways

1. **Use exceptions rather than return codes** - Separate error handling from business logic
2. **Provide rich context** - Exception messages should help diagnose and fix problems
3. **Design exception hierarchies** - Create exceptions that match how they'll be handled
4. **Fail fast** - Detect and report errors as early as possible
5. **Don't return null** - Use alternatives that make intent clear
6. **Handle resources properly** - Always clean up, even when exceptions occur
7. **Plan for failure** - Design systems that gracefully handle error conditions
8. **Monitor and learn** - Track error patterns to improve system reliability

## 🔄 Refactoring Techniques

### From Return Codes to Exceptions
1. **Identify error return patterns** in existing code
2. **Create appropriate exception classes** for different error types
3. **Convert return code checks** to try-catch blocks
4. **Simplify the happy path** by removing error code handling
5. **Add proper context** to exception messages

### From Generic to Specific Error Handling
1. **Analyze existing catch blocks** for overly broad exception handling
2. **Identify specific error conditions** that need different treatment
3. **Create targeted exception handlers** for each condition
4. **Preserve generic handler** for truly unexpected errors
5. **Add appropriate logging and recovery** for each case

---

## 🚀 **Next Steps**

**You've completed Principle 6: Error Handling! 🎉**

### **Immediate Next Actions:**
1. **[📝 Practice with Exercises →](../../exercises/principle-practice/06-error-handling/README.md)** - Master resilience patterns and exception design
2. **[📋 Use the Daily Checklist](./checklist.md)** - Apply error handling best practices
3. **[👀 Study the Examples](../../examples/before-after/error-handling-examples/README.md)** - See return codes become clean exceptions

### **Continue Your Learning Journey:**
- **[📖 Next: Principle 7 - Boundaries →](../07-boundaries/README.md)** - Learn to manage external dependencies
- **[📚 Back to Learning Path](../../LEARNING_PATH.md)** - Continue building robustness skills
- **[🎯 Apply to Your Code](../../LEARNING_PATH.md#progress-tracking-and-assessment)** - Add resilience patterns to your applications

**Ready for the next principle?** Clean boundaries and integration! **[Start Principle 7 →](../07-boundaries/README.md)**

---

Remember: Good error handling doesn't just catch errors - it helps create systems that are resilient, debuggable, and maintainable!
