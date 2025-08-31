# Exercise 2: Refactoring for Testability

Master the art of making legacy code testable by applying refactoring techniques that break dependencies and enable unit testing.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Identify testability problems in legacy code
- Apply dependency injection to break hard dependencies
- Use seams and abstractions to enable testing
- Extract testable units from complex methods
- Handle external dependencies in tests
- Transform untestable code into clean, testable code

## 📝 Exercise Format

Each problem presents legacy code that is difficult or impossible to test. Your job is to refactor the code to make it testable while preserving its original behavior.

---

## Problem 1: Hard-Coded Database Dependencies

### Current Code (Java)
```java
// ❌ Untestable - hard-coded database dependencies
public class UserService {
    
    public boolean authenticateUser(String username, String password) {
        // Hard-coded database connection
        try {
            Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/users", 
                "root", 
                "password123"
            );
            
            PreparedStatement stmt = conn.prepareStatement(
                "SELECT password_hash, salt, failed_attempts, locked_until FROM users WHERE username = ?"
            );
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();
            
            if (!rs.next()) {
                // Log failed attempt
                System.out.println("Authentication failed: user not found - " + username);
                return false;
            }
            
            String storedHash = rs.getString("password_hash");
            String salt = rs.getString("salt");
            int failedAttempts = rs.getInt("failed_attempts");
            Timestamp lockedUntil = rs.getTimestamp("locked_until");
            
            // Check if account is locked
            if (lockedUntil != null && lockedUntil.after(new Timestamp(System.currentTimeMillis()))) {
                System.out.println("Authentication failed: account locked - " + username);
                return false;
            }
            
            // Hash the provided password with stored salt
            String hashedPassword = hashPassword(password, salt);
            
            if (storedHash.equals(hashedPassword)) {
                // Reset failed attempts on successful login
                PreparedStatement updateStmt = conn.prepareStatement(
                    "UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login = NOW() WHERE username = ?"
                );
                updateStmt.setString(1, username);
                updateStmt.executeUpdate();
                updateStmt.close();
                
                System.out.println("Authentication successful: " + username);
                conn.close();
                return true;
            } else {
                // Increment failed attempts
                failedAttempts++;
                PreparedStatement updateStmt = conn.prepareStatement(
                    "UPDATE users SET failed_attempts = ? WHERE username = ?"
                );
                updateStmt.setInt(1, failedAttempts);
                updateStmt.setString(2, username);
                updateStmt.executeUpdate();
                
                // Lock account after 3 failed attempts
                if (failedAttempts >= 3) {
                    PreparedStatement lockStmt = conn.prepareStatement(
                        "UPDATE users SET locked_until = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE username = ?"
                    );
                    lockStmt.setString(1, username);
                    lockStmt.executeUpdate();
                    lockStmt.close();
                    System.out.println("Account locked due to failed attempts: " + username);
                }
                
                updateStmt.close();
                conn.close();
                System.out.println("Authentication failed: invalid password - " + username);
                return false;
            }
            
        } catch (SQLException e) {
            System.err.println("Database error during authentication: " + e.getMessage());
            return false;
        }
    }
    
    private String hashPassword(String password, String salt) {
        // Simplified hash function for example
        return password + salt; // In reality, use proper hashing
    }
}
```

### Your Task
Refactor this code to make it fully testable.

### Requirements
- [ ] **Extract database operations** into a separate repository
- [ ] **Inject dependencies** instead of hard-coding them
- [ ] **Separate business logic** from data access
- [ ] **Make logging configurable** for testing
- [ ] **Enable mocking** of external dependencies
- [ ] **Write comprehensive tests** for all scenarios
- [ ] **Preserve original behavior** exactly

### Refactoring Steps
1. **Identify seams** - where can you break dependencies?
2. **Extract interfaces** - what abstractions do you need?
3. **Apply dependency injection** - how will dependencies be provided?
4. **Separate concerns** - what belongs in which class?
5. **Write tests** - verify behavior is preserved

### Focus Areas
- Dependency injection patterns
- Repository pattern application
- Interface design for testability
- Mocking external dependencies

---

## Problem 2: Static Method Dependencies

### Current Code (C#)
```csharp
// ❌ Untestable - static dependencies and file system access
public class ReportGenerator
{
    public void GenerateUserReport(int userId)
    {
        // Static dependency on DateTime
        var reportDate = DateTime.Now;
        var fileName = $"user_report_{userId}_{reportDate:yyyyMMdd_HHmmss}.pdf";
        
        // Hard-coded file path
        var outputPath = @"C:\Reports\" + fileName;
        
        try
        {
            // Static database call
            var userData = DatabaseHelper.GetUserById(userId);
            if (userData == null)
            {
                // Static logging
                Logger.LogError($"User not found: {userId}");
                throw new UserNotFoundException($"User with ID {userId} not found");
            }
            
            // Static call to get user activities
            var activities = DatabaseHelper.GetUserActivities(userId);
            
            // File system dependency
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
            
            using (var document = new PdfDocument())
            {
                var page = document.AddPage();
                var graphics = XGraphics.FromPdfPage(page);
                var font = new XFont("Arial", 12);
                
                // Generate report content
                graphics.DrawString($"User Report - {userData.Name}", font, XBrushes.Black, 50, 50);
                graphics.DrawString($"Generated: {reportDate:yyyy-MM-dd HH:mm:ss}", font, XBrushes.Black, 50, 80);
                graphics.DrawString($"User ID: {userId}", font, XBrushes.Black, 50, 110);
                graphics.DrawString($"Email: {userData.Email}", font, XBrushes.Black, 50, 140);
                graphics.DrawString($"Registration Date: {userData.RegisteredAt:yyyy-MM-dd}", font, XBrushes.Black, 50, 170);
                
                int yPosition = 220;
                graphics.DrawString("Recent Activities:", font, XBrushes.Black, 50, yPosition);
                yPosition += 30;
                
                foreach (var activity in activities.Take(10))
                {
                    graphics.DrawString($"- {activity.Date:yyyy-MM-dd}: {activity.Description}", 
                                      font, XBrushes.Black, 50, yPosition);
                    yPosition += 20;
                }
                
                // Save to file system
                document.Save(outputPath);
                graphics.Dispose();
            }
            
            // Static logging
            Logger.LogInfo($"Report generated successfully: {outputPath}");
            
            // Send email notification - another static dependency
            EmailService.SendReportNotification(userData.Email, fileName, outputPath);
            
        }
        catch (Exception ex)
        {
            Logger.LogError($"Error generating report for user {userId}: {ex.Message}");
            throw;
        }
    }
}

// Static dependencies that make testing difficult
public static class DatabaseHelper
{
    public static UserData GetUserById(int userId) { /* Database call */ }
    public static List<ActivityData> GetUserActivities(int userId) { /* Database call */ }
}

public static class Logger
{
    public static void LogInfo(string message) { /* File logging */ }
    public static void LogError(string message) { /* File logging */ }
}

public static class EmailService
{
    public static void SendReportNotification(string email, string fileName, string filePath) { /* Email sending */ }
}
```

### Your Task
Make this report generator testable by eliminating static dependencies.

### Requirements
- [ ] **Eliminate static calls** - replace with injectable dependencies
- [ ] **Abstract file system operations** - make file I/O testable
- [ ] **Make time testable** - inject clock/time provider
- [ ] **Extract report generation logic** - separate from infrastructure
- [ ] **Create interfaces** for all external dependencies
- [ ] **Write unit tests** for business logic
- [ ] **Create integration tests** for the full workflow

### Refactoring Challenges
- How to handle PDF generation in tests?
- How to test file system operations?
- How to make DateTime.Now testable?
- How to verify email sending without actually sending emails?

### Focus Areas
- Static dependency elimination
- Clock abstraction patterns
- File system abstraction
- Test double strategies

---

## Problem 3: Mixed Concerns and Hidden Dependencies

### Current Code (Python)
```python
# ❌ Untestable - mixed concerns and hidden dependencies
import smtplib
import sqlite3
import os
import json
import requests
from datetime import datetime
from email.mime.text import MimeText

class OrderProcessor:
    
    def process_order(self, order_data):
        # Hidden dependency on current time
        timestamp = datetime.now()
        
        # Hard-coded database path
        db_path = '/var/app/orders.db'
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # Validate order data (business logic mixed with data access)
            cursor.execute("SELECT * FROM customers WHERE id = ?", (order_data['customer_id'],))
            customer = cursor.fetchone()
            
            if not customer:
                # Hard-coded logging to file
                with open('/var/log/orders.log', 'a') as log_file:
                    log_file.write(f"{timestamp}: Invalid customer ID {order_data['customer_id']}\n")
                raise ValueError("Customer not found")
            
            # Check inventory for each item
            total_amount = 0
            for item in order_data['items']:
                cursor.execute("SELECT stock, price FROM products WHERE id = ?", (item['product_id'],))
                product = cursor.fetchone()
                
                if not product:
                    with open('/var/log/orders.log', 'a') as log_file:
                        log_file.write(f"{timestamp}: Invalid product ID {item['product_id']}\n")
                    raise ValueError(f"Product {item['product_id']} not found")
                
                stock, price = product
                if stock < item['quantity']:
                    with open('/var/log/orders.log', 'a') as log_file:
                        log_file.write(f"{timestamp}: Insufficient stock for product {item['product_id']}\n")
                    raise ValueError(f"Insufficient stock for product {item['product_id']}")
                
                total_amount += price * item['quantity']
            
            # Process payment via external API
            payment_data = {
                'amount': total_amount,
                'customer_id': order_data['customer_id'],
                'payment_method': order_data['payment_method']
            }
            
            # Hard-coded API endpoint
            response = requests.post(
                'https://api.payments.com/charge',
                json=payment_data,
                headers={'Authorization': 'Bearer sk_live_abc123'},
                timeout=30
            )
            
            if response.status_code != 200:
                with open('/var/log/orders.log', 'a') as log_file:
                    log_file.write(f"{timestamp}: Payment failed for order\n")
                raise Exception("Payment processing failed")
            
            payment_result = response.json()
            
            if not payment_result.get('success'):
                with open('/var/log/orders.log', 'a') as log_file:
                    log_file.write(f"{timestamp}: Payment declined\n")
                raise Exception("Payment declined")
            
            # Create order record
            order_id = f"ORD-{timestamp.strftime('%Y%m%d')}-{os.urandom(4).hex()}"
            
            cursor.execute("""
                INSERT INTO orders (id, customer_id, total_amount, status, created_at, payment_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (order_id, order_data['customer_id'], total_amount, 'confirmed', 
                  timestamp.isoformat(), payment_result['transaction_id']))
            
            # Update inventory
            for item in order_data['items']:
                cursor.execute("""
                    UPDATE products SET stock = stock - ? WHERE id = ?
                """, (item['quantity'], item['product_id']))
            
            conn.commit()
            
            # Send confirmation email
            customer_email = customer[2]  # Assuming email is the 3rd column
            
            email_body = f"""
            Dear Customer,
            
            Your order {order_id} has been confirmed!
            Total amount: ${total_amount:.2f}
            
            Thank you for your business!
            """
            
            msg = MimeText(email_body)
            msg['Subject'] = f'Order Confirmation - {order_id}'
            msg['From'] = 'orders@company.com'
            msg['To'] = customer_email
            
            # Hard-coded SMTP settings
            smtp_server = smtplib.SMTP('smtp.gmail.com', 587)
            smtp_server.starttls()
            smtp_server.login('orders@company.com', 'hardcoded_password')
            smtp_server.send_message(msg)
            smtp_server.quit()
            
            # Log success
            with open('/var/log/orders.log', 'a') as log_file:
                log_file.write(f"{timestamp}: Order {order_id} processed successfully\n")
            
            return {
                'order_id': order_id,
                'status': 'confirmed',
                'total_amount': total_amount,
                'payment_id': payment_result['transaction_id']
            }
            
        except Exception as e:
            conn.rollback()
            # Log error
            with open('/var/log/orders.log', 'a') as log_file:
                log_file.write(f"{timestamp}: Order processing failed: {str(e)}\n")
            raise
        finally:
            conn.close()
```

### Your Task
Transform this into a testable, well-designed system.

### Requirements
- [ ] **Separate concerns** - business logic, data access, external services
- [ ] **Inject all dependencies** - database, payment service, email service, logger
- [ ] **Create domain model** - represent order, customer, product as objects
- [ ] **Extract business rules** - validation, inventory checking, pricing
- [ ] **Make time testable** - inject clock dependency
- [ ] **Create clean interfaces** - abstract all external dependencies
- [ ] **Write comprehensive tests** - unit and integration tests

### Design Questions
- How should you structure the domain model?
- What interfaces do you need for external services?
- How should you handle transactions and rollbacks?
- How can you test the complete workflow?

### Focus Areas
- Domain-driven design principles
- Service layer patterns
- Transaction management
- Integration testing strategies

---

## Problem 4: Singleton and Global State

### Current Code (JavaScript)
```javascript
// ❌ Untestable - singleton pattern and global state
class ConfigurationManager {
    constructor() {
        if (ConfigurationManager.instance) {
            return ConfigurationManager.instance;
        }
        
        this.config = {};
        this.loadConfiguration();
        ConfigurationManager.instance = this;
    }
    
    loadConfiguration() {
        // Hard-coded file reading
        const fs = require('fs');
        const path = require('path');
        
        try {
            const configPath = path.join(process.cwd(), 'config.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            this.config = JSON.parse(configData);
        } catch (error) {
            console.error('Failed to load configuration:', error.message);
            this.config = this.getDefaultConfig();
        }
    }
    
    getDefaultConfig() {
        return {
            database: {
                host: 'localhost',
                port: 5432,
                name: 'myapp'
            },
            cache: {
                ttl: 3600,
                maxSize: 1000
            },
            features: {
                enableLogging: true,
                enableMetrics: false
            }
        };
    }
    
    get(key) {
        return this.config[key];
    }
    
    set(key, value) {
        this.config[key] = value;
        this.saveConfiguration();
    }
    
    saveConfiguration() {
        const fs = require('fs');
        const path = require('path');
        
        try {
            const configPath = path.join(process.cwd(), 'config.json');
            fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.error('Failed to save configuration:', error.message);
        }
    }
}

// Application service that uses the singleton
class UserService {
    constructor() {
        this.config = new ConfigurationManager();
        this.users = [];
    }
    
    createUser(userData) {
        // Global state dependency
        const config = new ConfigurationManager();
        
        // Business logic mixed with configuration access
        if (!config.get('features').enableUserRegistration) {
            throw new Error('User registration is disabled');
        }
        
        // Validation using configuration
        const minPasswordLength = config.get('security')?.minPasswordLength || 8;
        if (userData.password.length < minPasswordLength) {
            throw new Error(`Password must be at least ${minPasswordLength} characters`);
        }
        
        // Create user with global state
        const user = {
            id: this.generateUserId(),
            ...userData,
            createdAt: new Date(),
            status: 'active'
        };
        
        this.users.push(user);
        
        // Log using configuration
        if (config.get('features').enableLogging) {
            console.log(`User created: ${user.id}`);
        }
        
        return user;
    }
    
    generateUserId() {
        // Using global state for ID generation
        const config = new ConfigurationManager();
        const prefix = config.get('system')?.userIdPrefix || 'USER';
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    validateUserAccess(userId, resource) {
        const config = new ConfigurationManager();
        const user = this.users.find(u => u.id === userId);
        
        if (!user) {
            return false;
        }
        
        // Complex business logic using global configuration
        const accessRules = config.get('access') || {};
        const userRole = user.role || 'user';
        const allowedResources = accessRules[userRole] || [];
        
        const hasAccess = allowedResources.includes(resource) || 
                         allowedResources.includes('*') ||
                         user.status === 'admin';
        
        if (config.get('features').enableLogging) {
            console.log(`Access ${hasAccess ? 'granted' : 'denied'} for user ${userId} to resource ${resource}`);
        }
        
        return hasAccess;
    }
}

// Analytics service also using global state
class AnalyticsService {
    track(event, data) {
        const config = new ConfigurationManager();
        
        if (!config.get('features').enableMetrics) {
            return;
        }
        
        const analyticsData = {
            event,
            data,
            timestamp: Date.now(),
            sessionId: this.getSessionId()
        };
        
        // Send to analytics endpoint from configuration
        const endpoint = config.get('analytics')?.endpoint;
        if (endpoint) {
            this.sendToAnalytics(endpoint, analyticsData);
        }
    }
    
    getSessionId() {
        // More global state usage
        const config = new ConfigurationManager();
        return config.get('session')?.id || 'anonymous';
    }
    
    sendToAnalytics(endpoint, data) {
        // Simplified - would make HTTP request
        console.log(`Sending to ${endpoint}:`, data);
    }
}
```

### Your Task
Eliminate the singleton pattern and global state to make this code testable.

### Requirements
- [ ] **Remove singleton pattern** - use dependency injection instead
- [ ] **Eliminate global state** - pass configuration explicitly
- [ ] **Create configuration interfaces** - abstract configuration access
- [ ] **Separate concerns** - configuration loading vs. business logic
- [ ] **Make file operations testable** - abstract file system access
- [ ] **Enable configuration mocking** - for different test scenarios
- [ ] **Write tests for all behaviors** - with different configuration states

### Refactoring Strategy
1. **Identify all global state access points**
2. **Create abstractions for external dependencies**
3. **Apply dependency injection throughout**
4. **Create test-friendly configuration objects**
5. **Write tests that verify behavior with different configurations**

### Focus Areas
- Singleton elimination patterns
- Configuration management design
- Dependency injection containers
- Test data builders for configuration

---

## 🏆 Success Criteria

For each refactoring challenge, demonstrate:

### Testability Improvements
- **No Hard Dependencies**: All external dependencies are injected or abstracted
- **Pure Business Logic**: Core logic can be tested without external systems
- **Mockable Dependencies**: All external dependencies can be mocked or stubbed
- **Fast Tests**: Tests run quickly without hitting real databases, files, or networks

### Design Quality
- **Separation of Concerns**: Business logic, data access, and infrastructure are separate
- **Single Responsibility**: Each class has one clear responsibility
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Interface Segregation**: Interfaces are focused and client-specific

### Test Coverage
- **Business Logic**: All business rules and calculations are tested
- **Error Scenarios**: Exception cases and edge conditions are tested
- **Integration Points**: Interaction with external systems is tested
- **Configuration Variants**: Different configuration scenarios are tested

---

## 💡 Testability Patterns

### **Dependency Injection**
```java
// ❌ Hard to test - hard-coded dependency
public class OrderService {
    public void processOrder(Order order) {
        EmailService emailService = new EmailService(); // Hard-coded
        emailService.sendConfirmation(order);
    }
}

// ✅ Testable - injected dependency
public class OrderService {
    private final EmailService emailService;
    
    public OrderService(EmailService emailService) {
        this.emailService = emailService;
    }
    
    public void processOrder(Order order) {
        emailService.sendConfirmation(order);
    }
}
```

### **Abstract Dependencies**
```python
# ❌ Hard to test - concrete file system dependency
class ReportGenerator:
    def save_report(self, report_data):
        with open('/reports/report.pdf', 'wb') as f:
            f.write(report_data)

# ✅ Testable - abstracted file system
class ReportGenerator:
    def __init__(self, file_system):
        self.file_system = file_system
    
    def save_report(self, report_data):
        self.file_system.write_file('/reports/report.pdf', report_data)

# Test with mock file system
class MockFileSystem:
    def __init__(self):
        self.files = {}
    
    def write_file(self, path, data):
        self.files[path] = data
```

### **Clock Abstraction**
```csharp
// ❌ Hard to test - static time dependency
public class OrderService
{
    public Order CreateOrder(OrderData data)
    {
        return new Order
        {
            Id = Guid.NewGuid(),
            Data = data,
            CreatedAt = DateTime.Now // Hard to test
        };
    }
}

// ✅ Testable - injected clock
public class OrderService
{
    private readonly IClock clock;
    
    public OrderService(IClock clock)
    {
        this.clock = clock;
    }
    
    public Order CreateOrder(OrderData data)
    {
        return new Order
        {
            Id = Guid.NewGuid(),
            Data = data,
            CreatedAt = clock.Now
        };
    }
}

// Test with fixed time
public class FixedClock : IClock
{
    public DateTime Now { get; set; }
}
```

---

## 🎯 Self-Assessment

After completing each refactoring challenge:

### **Testability Achievement (1-5 scale)**
- [ ] **Dependency Elimination**: Removed all hard-coded dependencies
- [ ] **Pure Logic Extraction**: Separated business logic from infrastructure
- [ ] **Interface Creation**: Created appropriate abstractions for testing
- [ ] **Test Coverage**: Achieved comprehensive test coverage

### **Design Improvement (1-5 scale)**
- [ ] **Separation of Concerns**: Clear separation between different responsibilities
- [ ] **SOLID Principles**: Applied dependency inversion and single responsibility
- [ ] **Maintainability**: Code is easier to understand and modify
- [ ] **Extensibility**: Easy to add new features and behaviors

**Target**: All scores should be 4 or 5. This represents mastery of testability refactoring.

---

## 🚀 Next Steps

Once you've mastered refactoring for testability:

1. **Apply to your legacy code** - Identify untestable areas in your real projects
2. **Practice dependency injection** - Make it your default approach to design
3. **Move to [Exercise 3: Mocking and Test Doubles](./exercise-3-mocking.md)** - Learn advanced testing techniques
4. **Study testing frameworks** - Master the tools for your language

Remember: Making code testable often improves its design. The constraints of testing force you to create loosely coupled, well-designed systems!
