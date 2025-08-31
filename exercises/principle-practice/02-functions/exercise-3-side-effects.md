# Exercise 3: Side Effect Management

Master the crucial skill of separating pure functions from side effects, applying command-query separation, and creating predictable, testable code.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Identify hidden side effects in existing code
- Separate pure logic from side effects
- Apply command-query separation principle
- Create functions that are easier to test and reason about
- Understand when side effects are necessary and how to manage them cleanly

## 📝 Exercise Format

Each problem presents code with mixed concerns where pure logic is entangled with side effects. Your job is to separate them, creating pure functions for business logic and clearly identified functions for side effects.

---

## Problem 1: Mixed Data Processing and I/O

### Current Code (JavaScript)
```javascript
// ❌ Pure calculation mixed with side effects
function processUserAnalytics(userId) {
    console.log(`Starting analytics processing for user ${userId}`);
    
    // Fetch user data (side effect)
    const userData = database.getUser(userId);
    if (!userData) {
        console.error(`User ${userId} not found`);
        return null;
    }
    
    console.log(`Processing data for ${userData.name}`);
    
    // Fetch user activities (side effect)
    const activities = database.getUserActivities(userId);
    console.log(`Found ${activities.length} activities`);
    
    // Pure calculation buried in side effects
    let totalScore = 0;
    let categoryScores = {};
    
    for (let activity of activities) {
        const baseScore = activity.duration * activity.intensity;
        const timeBonus = activity.completedAt > Date.now() - (7 * 24 * 60 * 60 * 1000) ? 1.2 : 1.0;
        const difficultyMultiplier = {
            'easy': 1.0,
            'medium': 1.5,
            'hard': 2.0
        }[activity.difficulty] || 1.0;
        
        const activityScore = baseScore * timeBonus * difficultyMultiplier;
        totalScore += activityScore;
        
        if (!categoryScores[activity.category]) {
            categoryScores[activity.category] = 0;
        }
        categoryScores[activity.category] += activityScore;
    }
    
    // More pure calculation
    const averageScore = totalScore / activities.length;
    const topCategory = Object.keys(categoryScores)
        .reduce((a, b) => categoryScores[a] > categoryScores[b] ? a : b);
    
    const performanceLevel = averageScore > 1000 ? 'excellent' : 
                           averageScore > 500 ? 'good' : 
                           averageScore > 200 ? 'fair' : 'needs improvement';
    
    // Create result object
    const analytics = {
        userId: userId,
        totalScore: totalScore,
        averageScore: averageScore,
        categoryScores: categoryScores,
        topCategory: topCategory,
        performanceLevel: performanceLevel,
        activitiesCount: activities.length,
        generatedAt: new Date()
    };
    
    // Save result (side effect)
    database.saveUserAnalytics(userId, analytics);
    console.log(`Analytics saved for user ${userId}`);
    
    // Send notification (side effect)
    if (performanceLevel === 'excellent') {
        emailService.sendCongratulations(userData.email, analytics);
        console.log(`Congratulations email sent to ${userData.email}`);
    } else if (performanceLevel === 'needs improvement') {
        emailService.sendEncouragement(userData.email, analytics);
        console.log(`Encouragement email sent to ${userData.email}`);
    }
    
    console.log(`Analytics processing completed for user ${userId}`);
    return analytics;
}
```

### Your Task
Separate the pure calculation logic from the side effects.

### Requirements
- [ ] Extract pure functions for score calculations
- [ ] Create pure functions for performance level determination
- [ ] Separate I/O operations from business logic
- [ ] Apply command-query separation
- [ ] Make the pure functions easily testable
- [ ] Keep side effects explicit and contained

### Focus Areas
- Pure function extraction
- Command-query separation
- Side effect isolation
- Testability improvement

---

## Problem 2: Authentication with Hidden Side Effects

### Current Code (Python)
```python
# ❌ Authentication logic mixed with logging, caching, and notifications
def authenticate_user(username, password):
    # Log attempt (side effect)
    logger.info(f"Authentication attempt for user: {username}")
    
    # Check cache first (side effect)
    cached_result = cache.get(f"auth_failure_{username}")
    if cached_result and cached_result['attempts'] >= 3:
        if time.time() - cached_result['last_attempt'] < 300:  # 5 minutes
            logger.warning(f"User {username} is temporarily locked out")
            # Send alert to security team (side effect)
            security_alerts.send_lockout_alert(username, cached_result['attempts'])
            return {'success': False, 'error': 'Account temporarily locked', 'locked_until': cached_result['last_attempt'] + 300}
    
    # Fetch user from database (side effect)
    user = database.get_user_by_username(username)
    if not user:
        logger.warning(f"Authentication failed: user {username} not found")
        # Track failed attempt (side effect)
        failure_count = cached_result['attempts'] + 1 if cached_result else 1
        cache.set(f"auth_failure_{username}", {
            'attempts': failure_count,
            'last_attempt': time.time()
        }, ttl=300)
        return {'success': False, 'error': 'Invalid credentials'}
    
    # Verify password (contains side effect of checking hash)
    import bcrypt
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        logger.warning(f"Authentication failed: invalid password for user {username}")
        
        # Update failed attempts (side effect)
        user['failed_login_attempts'] = user.get('failed_login_attempts', 0) + 1
        user['last_failed_login'] = datetime.now()
        
        if user['failed_login_attempts'] >= 3:
            user['account_locked_until'] = datetime.now() + timedelta(minutes=30)
            logger.error(f"Account locked for user {username} due to multiple failed attempts")
            # Send security notification (side effect)
            security_alerts.send_account_locked_notification(user['email'], user['account_locked_until'])
        
        database.update_user(user)
        
        # Cache failure (side effect)
        failure_count = cached_result['attempts'] + 1 if cached_result else 1
        cache.set(f"auth_failure_{username}", {
            'attempts': failure_count,
            'last_attempt': time.time()
        }, ttl=300)
        
        return {'success': False, 'error': 'Invalid credentials'}
    
    # Check if account is locked
    if user.get('account_locked_until') and user['account_locked_until'] > datetime.now():
        logger.warning(f"Authentication failed: account locked for user {username}")
        return {'success': False, 'error': 'Account is locked', 'locked_until': user['account_locked_until']}
    
    # Successful authentication - update user record (side effect)
    user['last_login'] = datetime.now()
    user['failed_login_attempts'] = 0
    user['account_locked_until'] = None
    database.update_user(user)
    
    # Clear failure cache (side effect)
    cache.delete(f"auth_failure_{username}")
    
    # Generate session token (contains randomness - side effect)
    import secrets
    session_token = secrets.token_urlsafe(32)
    session_data = {
        'user_id': user['id'],
        'username': username,
        'created_at': time.time(),
        'expires_at': time.time() + 3600  # 1 hour
    }
    
    # Store session (side effect)
    cache.set(f"session_{session_token}", session_data, ttl=3600)
    
    # Log successful login (side effect)
    logger.info(f"Successful authentication for user: {username}")
    
    # Send login notification if enabled (side effect)
    if user.get('login_notifications_enabled', False):
        notification_service.send_login_notification(user['email'], {
            'timestamp': datetime.now(),
            'ip_address': get_client_ip(),
            'user_agent': get_user_agent()
        })
    
    # Update login analytics (side effect)
    analytics.track_user_login(user['id'], {
        'timestamp': datetime.now(),
        'success': True
    })
    
    return {
        'success': True,
        'session_token': session_token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'last_login': user['last_login']
        }
    }
```

### Your Task
Separate authentication logic from side effects like logging, caching, and notifications.

### Requirements
- [ ] Create pure functions for credential validation
- [ ] Extract lockout logic into pure functions
- [ ] Separate session creation from storage
- [ ] Create command functions for side effects
- [ ] Apply command-query separation consistently
- [ ] Make business logic testable without external dependencies

### Focus Areas
- Authentication business logic extraction
- Side effect command pattern
- Session management separation
- Security logic testability

---

## Problem 3: Order Processing with Entangled Concerns

### Current Code (Java)
```java
// ❌ Order processing with mixed pure logic and side effects
public class OrderProcessor {
    
    public OrderResult processOrder(OrderRequest request) throws Exception {
        // Log order start (side effect)
        logger.info("Processing order request: " + request.getOrderId());
        
        // Validate request (pure logic mixed with exceptions)
        if (request.getItems() == null || request.getItems().isEmpty()) {
            logger.error("Order validation failed: no items");
            throw new IllegalArgumentException("Order must contain items");
        }
        
        if (request.getCustomerId() == null) {
            logger.error("Order validation failed: no customer ID");
            throw new IllegalArgumentException("Customer ID is required");
        }
        
        // Fetch customer data (side effect)
        Customer customer = customerService.getCustomer(request.getCustomerId());
        if (customer == null) {
            logger.error("Customer not found: " + request.getCustomerId());
            throw new CustomerNotFoundException("Customer not found");
        }
        
        // Check customer credit limit (pure logic with side effect of data access)
        BigDecimal orderTotal = BigDecimal.ZERO;
        for (OrderItem item : request.getItems()) {
            // Fetch product price (side effect)
            Product product = productService.getProduct(item.getProductId());
            if (product == null) {
                logger.error("Product not found: " + item.getProductId());
                throw new ProductNotFoundException("Product not found: " + item.getProductId());
            }
            
            // Pure calculation
            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            orderTotal = orderTotal.add(itemTotal);
            
            // Check inventory (side effect)
            if (!inventoryService.isAvailable(item.getProductId(), item.getQuantity())) {
                logger.warn("Insufficient inventory for product: " + item.getProductId());
                throw new InsufficientInventoryException("Insufficient inventory: " + item.getProductId());
            }
        }
        
        // Apply discounts (pure logic)
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (customer.getLoyaltyLevel().equals("GOLD") && orderTotal.compareTo(new BigDecimal("100")) >= 0) {
            discountAmount = orderTotal.multiply(new BigDecimal("0.1")); // 10% discount
        } else if (customer.getLoyaltyLevel().equals("SILVER") && orderTotal.compareTo(new BigDecimal("200")) >= 0) {
            discountAmount = orderTotal.multiply(new BigDecimal("0.05")); // 5% discount
        }
        
        // Calculate tax (pure logic with side effect of tax service call)
        BigDecimal taxAmount = taxService.calculateTax(orderTotal.subtract(discountAmount), 
                                                       customer.getShippingAddress());
        
        BigDecimal finalTotal = orderTotal.subtract(discountAmount).add(taxAmount);
        
        // Check credit limit (pure logic)
        if (customer.getCreditLimit().compareTo(finalTotal) < 0) {
            logger.warn("Credit limit exceeded for customer: " + customer.getId());
            // Send credit limit notification (side effect)
            notificationService.sendCreditLimitExceeded(customer.getEmail(), finalTotal, customer.getCreditLimit());
            throw new CreditLimitExceededException("Credit limit exceeded");
        }
        
        // Reserve inventory (side effect)
        for (OrderItem item : request.getItems()) {
            inventoryService.reserveProduct(item.getProductId(), item.getQuantity());
        }
        
        // Process payment (side effect)
        PaymentResult paymentResult = paymentService.processPayment(
            customer.getId(), finalTotal, request.getPaymentMethod());
        
        if (!paymentResult.isSuccessful()) {
            // Release reserved inventory (side effect)
            for (OrderItem item : request.getItems()) {
                inventoryService.releaseReservation(item.getProductId(), item.getQuantity());
            }
            logger.error("Payment failed for order: " + request.getOrderId());
            throw new PaymentFailedException("Payment failed: " + paymentResult.getErrorMessage());
        }
        
        // Create order entity (pure logic)
        Order order = new Order();
        order.setId(generateOrderId());
        order.setCustomerId(customer.getId());
        order.setItems(request.getItems());
        order.setSubtotal(orderTotal);
        order.setDiscountAmount(discountAmount);
        order.setTaxAmount(taxAmount);
        order.setTotal(finalTotal);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setCreatedAt(new Date());
        
        // Save order (side effect)
        orderRepository.save(order);
        
        // Update customer data (side effect)
        customer.setLastOrderDate(new Date());
        customer.setTotalSpent(customer.getTotalSpent().add(finalTotal));
        customerService.updateCustomer(customer);
        
        // Send confirmation email (side effect)
        emailService.sendOrderConfirmation(customer.getEmail(), order);
        
        // Update analytics (side effect)
        analyticsService.recordOrderPlaced(order.getId(), finalTotal, customer.getLoyaltyLevel());
        
        // Log completion (side effect)
        logger.info("Order processed successfully: " + order.getId());
        
        return new OrderResult(true, order.getId(), "Order processed successfully");
    }
    
    private String generateOrderId() {
        // Side effect - generates random ID
        return "ORD-" + System.currentTimeMillis() + "-" + new Random().nextInt(1000);
    }
}
```

### Your Task
Separate the pure order processing logic from all the side effects.

### Requirements
- [ ] Extract pure validation functions
- [ ] Create pure calculation functions for totals, discounts, and taxes
- [ ] Separate order creation logic from persistence
- [ ] Create command functions for side effects
- [ ] Apply command-query separation throughout
- [ ] Make core business logic testable without external services

### Focus Areas
- Business rule extraction
- Calculation function purity
- Command pattern for side effects
- Domain model creation

---

## Problem 4: Data Transformation with Mixed Concerns

### Current Code (Python)
```python
# ❌ Data processing with mixed pure transformations and side effects
def process_sales_data(input_file_path, output_file_path):
    print(f"Starting processing of {input_file_path}")
    
    # Read file (side effect)
    import csv
    import json
    from datetime import datetime, timedelta
    
    sales_data = []
    error_count = 0
    
    try:
        with open(input_file_path, 'r') as file:
            reader = csv.DictReader(file)
            for row_num, row in enumerate(reader, 1):
                try:
                    # Data validation and transformation (pure logic mixed with logging)
                    if not row.get('date'):
                        print(f"Row {row_num}: Missing date")
                        error_count += 1
                        continue
                    
                    # Parse date (pure logic)
                    try:
                        sale_date = datetime.strptime(row['date'], '%Y-%m-%d')
                    except ValueError:
                        print(f"Row {row_num}: Invalid date format: {row['date']}")
                        error_count += 1
                        continue
                    
                    # Validate amount (pure logic)
                    try:
                        amount = float(row.get('amount', 0))
                        if amount <= 0:
                            print(f"Row {row_num}: Invalid amount: {amount}")
                            error_count += 1
                            continue
                    except ValueError:
                        print(f"Row {row_num}: Non-numeric amount: {row.get('amount')}")
                        error_count += 1
                        continue
                    
                    # Category normalization (pure logic)
                    category = row.get('category', '').strip().lower()
                    category_mapping = {
                        'electronics': 'Electronics',
                        'electronic': 'Electronics',
                        'tech': 'Electronics',
                        'clothing': 'Apparel',
                        'clothes': 'Apparel',
                        'apparel': 'Apparel',
                        'books': 'Books',
                        'book': 'Books',
                        'literature': 'Books'
                    }
                    normalized_category = category_mapping.get(category, 'Other')
                    
                    # Region classification (pure logic)
                    state = row.get('state', '').strip().upper()
                    region_mapping = {
                        'CA': 'West', 'WA': 'West', 'OR': 'West', 'NV': 'West',
                        'NY': 'East', 'NJ': 'East', 'CT': 'East', 'MA': 'East',
                        'TX': 'South', 'FL': 'South', 'GA': 'South', 'NC': 'South',
                        'IL': 'Midwest', 'OH': 'Midwest', 'MI': 'Midwest', 'WI': 'Midwest'
                    }
                    region = region_mapping.get(state, 'Unknown')
                    
                    # Calculate additional fields (pure logic)
                    # Seasonal classification
                    month = sale_date.month
                    if month in [12, 1, 2]:
                        season = 'Winter'
                    elif month in [3, 4, 5]:
                        season = 'Spring'
                    elif month in [6, 7, 8]:
                        season = 'Summer'
                    else:
                        season = 'Fall'
                    
                    # Recency classification
                    days_ago = (datetime.now() - sale_date).days
                    if days_ago <= 30:
                        recency = 'Recent'
                    elif days_ago <= 90:
                        recency = 'Moderate'
                    else:
                        recency = 'Old'
                    
                    # Amount classification
                    if amount >= 1000:
                        amount_tier = 'High'
                    elif amount >= 100:
                        amount_tier = 'Medium'
                    else:
                        amount_tier = 'Low'
                    
                    # Create processed record
                    processed_record = {
                        'original_date': row['date'],
                        'parsed_date': sale_date.isoformat(),
                        'amount': amount,
                        'original_category': row.get('category', ''),
                        'normalized_category': normalized_category,
                        'state': state,
                        'region': region,
                        'season': season,
                        'recency': recency,
                        'amount_tier': amount_tier,
                        'customer_id': row.get('customer_id', ''),
                        'salesperson': row.get('salesperson', ''),
                        'processed_at': datetime.now().isoformat()
                    }
                    
                    sales_data.append(processed_record)
                    
                except Exception as e:
                    print(f"Row {row_num}: Unexpected error: {str(e)}")
                    error_count += 1
                    continue
    
    except FileNotFoundError:
        print(f"Error: Input file not found: {input_file_path}")
        return False
    except Exception as e:
        print(f"Error reading file: {str(e)}")
        return False
    
    # Calculate summary statistics (pure logic)
    if not sales_data:
        print("No valid sales data found")
        return False
    
    total_amount = sum(record['amount'] for record in sales_data)
    average_amount = total_amount / len(sales_data)
    
    # Category analysis (pure logic)
    category_totals = {}
    for record in sales_data:
        cat = record['normalized_category']
        category_totals[cat] = category_totals.get(cat, 0) + record['amount']
    
    # Region analysis (pure logic)
    region_totals = {}
    for record in sales_data:
        reg = record['region']
        region_totals[reg] = region_totals.get(reg, 0) + record['amount']
    
    # Create summary
    summary = {
        'total_records_processed': len(sales_data),
        'error_count': error_count,
        'total_amount': total_amount,
        'average_amount': average_amount,
        'category_breakdown': category_totals,
        'region_breakdown': region_totals,
        'processing_date': datetime.now().isoformat()
    }
    
    # Write output file (side effect)
    try:
        output_data = {
            'summary': summary,
            'data': sales_data
        }
        
        with open(output_file_path, 'w') as file:
            json.dump(output_data, file, indent=2)
        
        print(f"Processing complete. Output written to: {output_file_path}")
        print(f"Processed {len(sales_data)} records with {error_count} errors")
        
    except Exception as e:
        print(f"Error writing output file: {str(e)}")
        return False
    
    return True
```

### Your Task
Separate the pure data transformation logic from the file I/O and logging.

### Requirements
- [ ] Extract pure functions for data validation
- [ ] Create pure transformation functions
- [ ] Separate calculation logic from I/O
- [ ] Create command functions for file operations
- [ ] Make data processing logic independently testable
- [ ] Apply functional programming principles

### Focus Areas
- Data transformation purity
- Validation function extraction
- I/O separation
- Functional programming patterns

---

## 🏆 Success Criteria

For each problem, your refactored solution should achieve:

### Separation Quality
- **Pure Functions**: Business logic functions have no side effects
- **Command Functions**: Side effects are isolated in command functions
- **Query Functions**: Data retrieval functions don't modify state
- **Clear Boundaries**: Pure and impure code are clearly separated

### Testability Improvements
- **Unit Testable**: Pure functions can be tested without mocks
- **Isolated Testing**: Business logic tests don't require external dependencies
- **Predictable Results**: Pure functions always return the same output for the same input
- **Fast Tests**: Pure function tests run quickly without I/O

### Code Clarity
- **Obvious Side Effects**: Functions with side effects are clearly identifiable
- **Single Responsibility**: Each function has one clear purpose
- **Functional Composition**: Pure functions can be composed together
- **Reasoning**: Code behavior is easier to understand and predict

---

## 💡 Side Effect Management Patterns

### **1. Command-Query Separation**
```javascript
// ❌ Mixed command and query
function getUserAndLogAccess(userId) {
    logger.info(`Accessing user ${userId}`);
    return database.getUser(userId);
}

// ✅ Separate command and query
function getUser(userId) {
    return database.getUser(userId);
}

function logUserAccess(userId) {
    logger.info(`Accessing user ${userId}`);
}

// Usage
logUserAccess(userId);
const user = getUser(userId);
```

### **2. Pure Function Extraction**
```javascript
// ❌ Pure logic mixed with side effects
function processOrderWithLogging(order) {
    console.log('Processing order...');
    
    const tax = order.total * 0.08;
    const shipping = order.total > 100 ? 0 : 9.99;
    const total = order.total + tax + shipping;
    
    console.log(`Order total: ${total}`);
    database.saveOrder({ ...order, tax, shipping, total });
    
    return total;
}

// ✅ Pure calculation extracted
function calculateOrderTotal(orderTotal) {
    const tax = orderTotal * 0.08;
    const shipping = orderTotal > 100 ? 0 : 9.99;
    return {
        tax,
        shipping,
        total: orderTotal + tax + shipping
    };
}

function processOrder(order) {
    console.log('Processing order...');
    
    const calculations = calculateOrderTotal(order.total);
    const processedOrder = { ...order, ...calculations };
    
    console.log(`Order total: ${calculations.total}`);
    database.saveOrder(processedOrder);
    
    return calculations.total;
}
```

### **3. Dependency Injection for Side Effects**
```javascript
// ❌ Hard-coded dependencies
function authenticateUser(username, password) {
    const user = database.getUser(username);
    logger.info(`Authentication attempt for ${username}`);
    
    if (verifyPassword(password, user.hash)) {
        emailService.sendLoginNotification(user.email);
        return createSession(user);
    }
    
    return null;
}

// ✅ Dependencies injected
function authenticateUser(username, password, dependencies) {
    const { database, logger, emailService } = dependencies;
    
    const user = database.getUser(username);
    logger.info(`Authentication attempt for ${username}`);
    
    if (verifyPassword(password, user.hash)) {
        emailService.sendLoginNotification(user.email);
        return createSession(user);
    }
    
    return null;
}

// Or even better - separate pure and impure parts
function verifyCredentials(username, password, user) {
    return user && verifyPassword(password, user.hash);
}

function authenticateUser(username, password, dependencies) {
    const { database, logger, emailService } = dependencies;
    
    const user = database.getUser(username);
    logger.info(`Authentication attempt for ${username}`);
    
    if (verifyCredentials(username, password, user)) {
        emailService.sendLoginNotification(user.email);
        return createSession(user);
    }
    
    return null;
}
```

### **4. Side Effect Isolation**
```javascript
// ❌ Side effects scattered throughout
function processData(inputData) {
    console.log('Starting processing...');
    
    const validated = inputData.filter(item => {
        if (!item.id) {
            console.log('Invalid item: missing ID');
            return false;
        }
        return true;
    });
    
    const transformed = validated.map(item => {
        console.log(`Processing item ${item.id}`);
        return {
            ...item,
            processed: true,
            timestamp: new Date()
        };
    });
    
    database.saveAll(transformed);
    console.log('Processing complete');
    
    return transformed;
}

// ✅ Side effects isolated
function validateData(inputData) {
    return inputData.filter(item => item.id);
}

function transformData(validData) {
    return validData.map(item => ({
        ...item,
        processed: true,
        timestamp: new Date()
    }));
}

function processData(inputData, { logger, database }) {
    logger.info('Starting processing...');
    
    const validated = validateData(inputData);
    const invalidCount = inputData.length - validated.length;
    if (invalidCount > 0) {
        logger.warn(`${invalidCount} invalid items skipped`);
    }
    
    const transformed = transformData(validated);
    logger.info(`Processing ${transformed.length} items`);
    
    database.saveAll(transformed);
    logger.info('Processing complete');
    
    return transformed;
}
```

---

## 🔧 Common Side Effect Problems & Solutions

### **Problem: Hidden Database Calls**
```python
# ❌ Hidden side effect
def calculate_user_score(user_id):
    user = database.get_user(user_id)  # Hidden side effect
    activities = database.get_activities(user_id)  # Hidden side effect
    return sum(activity.points for activity in activities)

# ✅ Side effects explicit
def calculate_user_score(activities):
    return sum(activity.points for activity in activities)

def get_user_score(user_id):
    user = database.get_user(user_id)
    activities = database.get_activities(user_id)
    return calculate_user_score(activities)
```

### **Problem: Logging Mixed with Logic**
```python
# ❌ Logging scattered throughout logic
def process_payment(amount, payment_method):
    logger.info(f"Processing payment of ${amount}")
    
    if amount <= 0:
        logger.error("Invalid payment amount")
        raise ValueError("Amount must be positive")
    
    fee = amount * 0.03 if payment_method == 'credit' else 0
    logger.info(f"Calculated fee: ${fee}")
    
    total = amount + fee
    logger.info(f"Total charge: ${total}")
    
    return total

# ✅ Pure calculation separated
def calculate_payment_total(amount, payment_method):
    if amount <= 0:
        raise ValueError("Amount must be positive")
    
    fee = amount * 0.03 if payment_method == 'credit' else 0
    return {
        'amount': amount,
        'fee': fee,
        'total': amount + fee
    }

def process_payment(amount, payment_method, logger):
    logger.info(f"Processing payment of ${amount}")
    
    try:
        result = calculate_payment_total(amount, payment_method)
        logger.info(f"Calculated fee: ${result['fee']}")
        logger.info(f"Total charge: ${result['total']}")
        return result['total']
    except ValueError as e:
        logger.error(f"Payment processing error: {e}")
        raise
```

### **Problem: Random Values in Business Logic**
```python
# ❌ Random generation mixed with business logic
def create_order(customer_id, items):
    import random
    order_id = f"ORD-{random.randint(100000, 999999)}"
    
    total = sum(item.price * item.quantity for item in items)
    
    return {
        'id': order_id,
        'customer_id': customer_id,
        'items': items,
        'total': total,
        'created_at': datetime.now()
    }

# ✅ ID generation separated
def calculate_order_details(customer_id, items):
    total = sum(item.price * item.quantity for item in items)
    return {
        'customer_id': customer_id,
        'items': items,
        'total': total
    }

def create_order(customer_id, items, id_generator):
    order_details = calculate_order_details(customer_id, items)
    return {
        'id': id_generator(),
        **order_details,
        'created_at': datetime.now()
    }
```

---

## 🎯 Self-Assessment

After completing each problem, evaluate your solution:

### **Pure Function Quality (1-5 scale)**
- [ ] **No Side Effects**: Pure functions don't modify external state
- [ ] **Deterministic**: Same input always produces same output
- [ ] **Testable**: Can be tested without mocks or external dependencies
- [ ] **Composable**: Can be combined with other pure functions

### **Side Effect Management (1-5 scale)**
- [ ] **Explicit**: Side effects are clearly identifiable
- [ ] **Isolated**: Side effects are contained in specific functions
- [ ] **Command-Query Separation**: Commands and queries are separate
- [ ] **Dependency Injection**: External dependencies are explicit

**Target**: All scores should be 4 or 5. If any score is 3 or below, review your separation strategy.

---

## 🚀 Next Steps

Once you've completed all problems:

1. **Review the [solutions file](./exercise-3-solutions.md)** to see different approaches
2. **Apply to your real code** - Look for hidden side effects in your current projects
3. **Practice pure function extraction** - Make it a habit to separate calculations from I/O
4. **Move to [Exercise 4: Function Composition](./exercise-4-composition.md)** - Learn to build complex operations from simple functions

Remember: Side effect management is one of the most important skills for writing maintainable, testable code. Pure functions are easier to understand, test, and debug - invest time in separating them from side effects!
