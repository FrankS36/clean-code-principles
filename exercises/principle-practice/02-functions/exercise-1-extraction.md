# Exercise 1: Function Extraction Practice

Master the art of breaking down large, complex functions into small, focused, well-named functions that are easy to understand, test, and maintain.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Recognize when functions are doing too much
- Apply the Extract Method refactoring technique systematically
- Create functions with single, clear responsibilities
- Improve code readability through function decomposition
- Practice meaningful function naming

## 📝 Exercise Format

Each problem presents a large, complex function that violates the Single Responsibility Principle. Your job is to extract smaller functions that each do one thing well.

---

## Problem 1: E-commerce Order Processing

### Current Code (JavaScript)
```javascript
// ❌ Large function doing too much
function processOrder(orderData) {
    // Validate order data
    if (!orderData || !orderData.customerId) {
        throw new Error('Invalid order: missing customer ID');
    }
    if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Invalid order: no items');
    }
    for (let item of orderData.items) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
            throw new Error('Invalid order: invalid item');
        }
        if (!item.price || item.price <= 0) {
            throw new Error('Invalid order: invalid item price');
        }
    }

    // Calculate totals
    let subtotal = 0;
    for (let item of orderData.items) {
        subtotal += item.price * item.quantity;
    }
    
    let taxRate = 0.08;
    if (orderData.shippingAddress && orderData.shippingAddress.state === 'CA') {
        taxRate = 0.0975;
    } else if (orderData.shippingAddress && orderData.shippingAddress.state === 'NY') {
        taxRate = 0.08375;
    }
    let tax = subtotal * taxRate;
    
    let shippingCost = 0;
    if (subtotal < 50) {
        shippingCost = 8.99;
    } else if (subtotal < 100) {
        shippingCost = 4.99;
    }
    // Free shipping for orders $100+
    
    let total = subtotal + tax + shippingCost;

    // Apply discounts
    let discount = 0;
    if (orderData.promoCode) {
        if (orderData.promoCode === 'SAVE10' && subtotal >= 50) {
            discount = subtotal * 0.10;
        } else if (orderData.promoCode === 'SAVE20' && subtotal >= 100) {
            discount = subtotal * 0.20;
        } else if (orderData.promoCode === 'NEWCUSTOMER') {
            // Check if customer is new (created within last 30 days)
            let customer = database.getCustomer(orderData.customerId);
            let thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (customer.createdAt > thirtyDaysAgo) {
                discount = 15; // Flat $15 discount
            }
        }
    }
    total = total - discount;

    // Update inventory
    for (let item of orderData.items) {
        let product = database.getProduct(item.productId);
        if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.productId}`);
        }
        product.stock -= item.quantity;
        database.saveProduct(product);
    }

    // Create order record
    let order = {
        id: generateOrderId(),
        customerId: orderData.customerId,
        items: orderData.items,
        subtotal: subtotal,
        tax: tax,
        shippingCost: shippingCost,
        discount: discount,
        total: total,
        status: 'confirmed',
        createdAt: new Date()
    };
    database.saveOrder(order);

    // Send confirmation email
    let customer = database.getCustomer(orderData.customerId);
    let emailContent = `
        Dear ${customer.firstName},
        
        Your order #${order.id} has been confirmed!
        
        Order Summary:
        Subtotal: $${subtotal.toFixed(2)}
        Tax: $${tax.toFixed(2)}
        Shipping: $${shippingCost.toFixed(2)}
        Discount: $${discount.toFixed(2)}
        Total: $${total.toFixed(2)}
        
        Thank you for your order!
    `;
    emailService.send(customer.email, 'Order Confirmation', emailContent);

    return order;
}
```

### Your Task
Extract this large function into multiple smaller functions. Focus on:
- Single responsibility for each function
- Clear, descriptive function names
- Proper parameter passing
- Logical grouping of related operations

### Requirements
- [ ] Validation logic should be in separate function(s)
- [ ] Tax calculation should be extracted
- [ ] Shipping calculation should be extracted  
- [ ] Discount calculation should be extracted
- [ ] Inventory update should be extracted
- [ ] Email generation should be extracted
- [ ] Each extracted function should have a single, clear purpose
- [ ] Function names should clearly indicate what they do

### Hints
- Start by identifying distinct responsibilities in the current function
- Group related operations together
- Think about what parameters each extracted function needs
- Consider return values - what does each function produce?
- Don't extract everything at once - work incrementally

---

## Problem 2: User Registration System

### Current Code (Python)
```python
# ❌ Large function handling multiple concerns
def register_user(user_data):
    # Validate input data
    if not user_data.get('email'):
        return {'success': False, 'error': 'Email is required'}
    if not user_data.get('password'):
        return {'success': False, 'error': 'Password is required'}
    if not user_data.get('first_name'):
        return {'success': False, 'error': 'First name is required'}
    if not user_data.get('last_name'):
        return {'success': False, 'error': 'Last name is required'}
    
    # Validate email format
    import re
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, user_data['email']):
        return {'success': False, 'error': 'Invalid email format'}
    
    # Check if email already exists
    existing_user = database.find_user_by_email(user_data['email'])
    if existing_user:
        return {'success': False, 'error': 'Email already registered'}
    
    # Validate password strength
    password = user_data['password']
    if len(password) < 8:
        return {'success': False, 'error': 'Password must be at least 8 characters'}
    if not re.search(r'[A-Z]', password):
        return {'success': False, 'error': 'Password must contain uppercase letter'}
    if not re.search(r'[a-z]', password):
        return {'success': False, 'error': 'Password must contain lowercase letter'}
    if not re.search(r'\d', password):
        return {'success': False, 'error': 'Password must contain number'}
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return {'success': False, 'error': 'Password must contain special character'}
    
    # Hash password
    import hashlib
    import secrets
    salt = secrets.token_hex(32)
    password_hash = hashlib.pbkdf2_hmac('sha256', 
                                       password.encode('utf-8'), 
                                       salt.encode('utf-8'), 
                                       100000)
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Create user record
    user = {
        'id': generate_user_id(),
        'email': user_data['email'].lower(),
        'first_name': user_data['first_name'].strip(),
        'last_name': user_data['last_name'].strip(),
        'password_hash': password_hash.hex(),
        'salt': salt,
        'email_verified': False,
        'verification_token': verification_token,
        'created_at': datetime.now(),
        'last_login': None,
        'login_attempts': 0,
        'account_locked': False
    }
    
    # Save to database
    try:
        database.save_user(user)
    except Exception as e:
        return {'success': False, 'error': 'Failed to create account'}
    
    # Send verification email
    verification_link = f"https://example.com/verify?token={verification_token}"
    email_content = f"""
    Dear {user['first_name']},
    
    Welcome to our platform! Please verify your email address by clicking the link below:
    
    {verification_link}
    
    This link will expire in 24 hours.
    
    If you didn't create this account, please ignore this email.
    
    Best regards,
    The Team
    """
    
    try:
        email_service.send_email(
            to=user['email'],
            subject='Please verify your email address',
            content=email_content
        )
    except Exception as e:
        # User created but email failed - log the error
        logger.error(f"Failed to send verification email to {user['email']}: {e}")
    
    # Log registration event
    logger.info(f"New user registered: {user['email']} (ID: {user['id']})")
    
    # Update registration metrics
    metrics.increment('user_registrations')
    metrics.increment(f'user_registrations_by_domain.{user["email"].split("@")[1]}')
    
    return {
        'success': True, 
        'user_id': user['id'],
        'message': 'Account created successfully. Please check your email for verification.'
    }
```

### Your Task
Break down this registration function into smaller, focused functions.

### Requirements
- [ ] Input validation should be separate functions
- [ ] Email validation should be extracted
- [ ] Password validation should be extracted
- [ ] Password hashing should be extracted
- [ ] User creation should be extracted
- [ ] Email sending should be extracted
- [ ] Metrics/logging should be extracted
- [ ] Each function should have a clear, single purpose

---

## Problem 3: Report Generation System

### Current Code (Java)
```java
// ❌ Large method with multiple responsibilities
public class ReportGenerator {
    
    public String generateSalesReport(Date startDate, Date endDate, String format) {
        // Validate date range
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start and end dates are required");
        }
        if (startDate.after(endDate)) {
            throw new IllegalArgumentException("Start date must be before end date");
        }
        Date now = new Date();
        if (startDate.after(now) || endDate.after(now)) {
            throw new IllegalArgumentException("Dates cannot be in the future");
        }
        
        // Get sales data
        List<Sale> sales = new ArrayList<>();
        try {
            Connection conn = database.getConnection();
            PreparedStatement stmt = conn.prepareStatement(
                "SELECT * FROM sales WHERE sale_date BETWEEN ? AND ? ORDER BY sale_date"
            );
            stmt.setDate(1, new java.sql.Date(startDate.getTime()));
            stmt.setDate(2, new java.sql.Date(endDate.getTime()));
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                Sale sale = new Sale();
                sale.setId(rs.getInt("id"));
                sale.setSaleDate(rs.getDate("sale_date"));
                sale.setCustomerId(rs.getInt("customer_id"));
                sale.setProductId(rs.getInt("product_id"));
                sale.setQuantity(rs.getInt("quantity"));
                sale.setUnitPrice(rs.getBigDecimal("unit_price"));
                sale.setTotalAmount(rs.getBigDecimal("total_amount"));
                sales.add(sale);
            }
            
            rs.close();
            stmt.close();
            conn.close();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to retrieve sales data: " + e.getMessage());
        }
        
        // Calculate summary statistics
        BigDecimal totalRevenue = BigDecimal.ZERO;
        int totalQuantity = 0;
        Set<Integer> uniqueCustomers = new HashSet<>();
        Map<Integer, BigDecimal> productRevenue = new HashMap<>();
        Map<String, BigDecimal> dailyRevenue = new HashMap<>();
        
        SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd");
        
        for (Sale sale : sales) {
            totalRevenue = totalRevenue.add(sale.getTotalAmount());
            totalQuantity += sale.getQuantity();
            uniqueCustomers.add(sale.getCustomerId());
            
            // Product revenue
            productRevenue.put(sale.getProductId(), 
                productRevenue.getOrDefault(sale.getProductId(), BigDecimal.ZERO)
                    .add(sale.getTotalAmount()));
            
            // Daily revenue
            String dateKey = dateFormatter.format(sale.getSaleDate());
            dailyRevenue.put(dateKey, 
                dailyRevenue.getOrDefault(dateKey, BigDecimal.ZERO)
                    .add(sale.getTotalAmount()));
        }
        
        // Generate report content
        StringBuilder report = new StringBuilder();
        
        if ("HTML".equalsIgnoreCase(format)) {
            report.append("<html><head><title>Sales Report</title></head><body>");
            report.append("<h1>Sales Report</h1>");
            report.append("<p>Period: ").append(dateFormatter.format(startDate))
                  .append(" to ").append(dateFormatter.format(endDate)).append("</p>");
            
            report.append("<h2>Summary</h2>");
            report.append("<ul>");
            report.append("<li>Total Revenue: $").append(totalRevenue).append("</li>");
            report.append("<li>Total Items Sold: ").append(totalQuantity).append("</li>");
            report.append("<li>Unique Customers: ").append(uniqueCustomers.size()).append("</li>");
            report.append("</ul>");
            
            report.append("<h2>Top Products by Revenue</h2>");
            report.append("<table border='1'>");
            report.append("<tr><th>Product ID</th><th>Revenue</th></tr>");
            productRevenue.entrySet().stream()
                .sorted(Map.Entry.<Integer, BigDecimal>comparingByValue().reversed())
                .limit(10)
                .forEach(entry -> {
                    report.append("<tr><td>").append(entry.getKey())
                          .append("</td><td>$").append(entry.getValue()).append("</td></tr>");
                });
            report.append("</table>");
            
            report.append("</body></html>");
            
        } else if ("CSV".equalsIgnoreCase(format)) {
            report.append("Sales Report\n");
            report.append("Period,").append(dateFormatter.format(startDate))
                  .append(" to ").append(dateFormatter.format(endDate)).append("\n\n");
            
            report.append("Summary\n");
            report.append("Total Revenue,$").append(totalRevenue).append("\n");
            report.append("Total Items Sold,").append(totalQuantity).append("\n");
            report.append("Unique Customers,").append(uniqueCustomers.size()).append("\n\n");
            
            report.append("Product ID,Revenue\n");
            productRevenue.entrySet().stream()
                .sorted(Map.Entry.<Integer, BigDecimal>comparingByValue().reversed())
                .forEach(entry -> {
                    report.append(entry.getKey()).append(",$")
                          .append(entry.getValue()).append("\n");
                });
                
        } else {
            // Plain text format
            report.append("SALES REPORT\n");
            report.append("===========\n\n");
            report.append("Period: ").append(dateFormatter.format(startDate))
                  .append(" to ").append(dateFormatter.format(endDate)).append("\n\n");
            
            report.append("SUMMARY\n");
            report.append("-------\n");
            report.append("Total Revenue: $").append(totalRevenue).append("\n");
            report.append("Total Items Sold: ").append(totalQuantity).append("\n");
            report.append("Unique Customers: ").append(uniqueCustomers.size()).append("\n\n");
            
            report.append("TOP PRODUCTS BY REVENUE\n");
            report.append("-----------------------\n");
            productRevenue.entrySet().stream()
                .sorted(Map.Entry.<Integer, BigDecimal>comparingByValue().reversed())
                .limit(10)
                .forEach(entry -> {
                    report.append("Product ").append(entry.getKey())
                          .append(": $").append(entry.getValue()).append("\n");
                });
        }
        
        return report.toString();
    }
}
```

### Your Task
Extract smaller methods from this report generation method.

### Requirements
- [ ] Date validation should be extracted
- [ ] Data retrieval should be extracted
- [ ] Summary calculations should be extracted
- [ ] Report formatting should be extracted by format type
- [ ] Each method should have a single, clear responsibility
- [ ] Consider creating helper classes for complex data structures

---

## 🏆 Success Criteria

For each problem, your refactored solution should achieve:

### Function Design Quality
- **Single Responsibility**: Each function does exactly one thing
- **Descriptive Names**: Function names clearly indicate their purpose
- **Appropriate Size**: Functions are small enough to understand quickly
- **Clear Parameters**: Function signatures are clean and intuitive

### Code Organization
- **Logical Grouping**: Related functions are organized together
- **Dependency Clarity**: Function dependencies are explicit
- **Reduced Complexity**: Overall code is easier to understand
- **Improved Testability**: Each function can be tested independently

### Readability Improvement
- **Self-Documenting**: Code explains itself through good structure
- **Reduced Cognitive Load**: Less mental effort required to understand
- **Easier Maintenance**: Changes can be made to individual functions
- **Better Debugging**: Problems can be isolated to specific functions

---

## 💡 Extraction Strategies

### **1. Extract by Concern**
Group operations that handle the same type of work:
- All validation logic together
- All calculation logic together  
- All data access logic together
- All formatting logic together

### **2. Extract by Data Flow**
Follow the natural flow of data through the function:
- Input processing and validation
- Core business logic and calculations
- Output formatting and presentation
- Side effects (database, email, logging)

### **3. Extract by Abstraction Level**
Separate high-level orchestration from low-level details:
- Keep high-level workflow in main function
- Extract implementation details to helper functions
- Create clear abstraction layers

### **4. Extract Pure Functions First**
Start with functions that don't have side effects:
- Calculations and transformations
- Validation logic
- Data formatting
- These are easier to test and understand

---

## 🔧 Common Extraction Patterns

### **Validation Functions**
```javascript
// Before: Inline validation
if (!data.email || !isValidEmail(data.email)) {
    throw new Error('Invalid email');
}

// After: Extracted validation
function validateEmail(email) {
    if (!email) {
        throw new Error('Email is required');
    }
    if (!isValidEmailFormat(email)) {
        throw new Error('Invalid email format');
    }
}
```

### **Calculation Functions**
```javascript
// Before: Inline calculation
let tax = subtotal * (state === 'CA' ? 0.0975 : 0.08);

// After: Extracted calculation
function calculateTax(subtotal, shippingState) {
    const taxRate = getTaxRateForState(shippingState);
    return subtotal * taxRate;
}

function getTaxRateForState(state) {
    const taxRates = { CA: 0.0975, NY: 0.08375 };
    return taxRates[state] || 0.08;
}
```

### **Builder/Factory Functions**
```javascript
// Before: Inline object creation
let order = {
    id: generateOrderId(),
    customerId: orderData.customerId,
    items: orderData.items,
    subtotal: subtotal,
    tax: tax,
    total: total,
    status: 'confirmed',
    createdAt: new Date()
};

// After: Extracted factory
function createOrder(orderData, calculations) {
    return {
        id: generateOrderId(),
        customerId: orderData.customerId,
        items: orderData.items,
        subtotal: calculations.subtotal,
        tax: calculations.tax,
        total: calculations.total,
        status: 'confirmed',
        createdAt: new Date()
    };
}
```

---

## 🎯 Self-Assessment

After completing each problem, evaluate your solution:

### **Function Quality (1-5 scale)**
- [ ] **Single Responsibility**: Each function has one clear purpose
- [ ] **Descriptive Naming**: Function names clearly indicate what they do
- [ ] **Appropriate Size**: Functions are small and focused
- [ ] **Parameter Design**: Function signatures are clean and minimal

### **Code Organization (1-5 scale)**
- [ ] **Logical Structure**: Related functions are grouped sensibly
- [ ] **Dependency Clarity**: Function relationships are clear
- [ ] **Abstraction Levels**: High-level and low-level concerns are separated
- [ ] **Testability**: Each function can be tested independently

**Target**: All scores should be 4 or 5. If any score is 3 or below, revise your extraction.

---

## 🚀 Next Steps

Once you've completed all problems:

1. **Compare your solutions** with the [solutions file](./exercise-1-solutions.md)
2. **Apply to your real code** - Find large functions in your current projects
3. **Practice the Extract Method refactoring** - Make it a habit in your daily coding
4. **Move to [Exercise 2: Parameter Design](./exercise-2-parameters.md)** - Learn clean function signatures

Remember: Function extraction is a skill that improves with practice. Start with obvious separations and gradually develop intuition for more subtle extraction opportunities!
