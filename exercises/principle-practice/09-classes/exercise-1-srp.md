# Exercise 1: Single Responsibility Principle (SRP)

Master the first and most important SOLID principle by learning to identify responsibilities, recognize SRP violations, and refactor classes to have single, clear purposes.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Identify multiple responsibilities within a single class
- Recognize the symptoms of SRP violations
- Apply systematic refactoring to separate concerns
- Design classes with single, cohesive responsibilities
- Understand the relationship between SRP and maintainability
- Practice responsibility-driven design

## 📝 Exercise Format

Each problem presents a class that violates the Single Responsibility Principle by handling multiple concerns. Your job is to identify the responsibilities and refactor the class into multiple focused classes.

---

## Problem 1: User Account Manager

### Current Code (Java)
```java
// ❌ Violates SRP - handles multiple responsibilities
import java.util.*;
import java.security.MessageDigest;
import java.io.*;
import java.time.LocalDateTime;
import javax.mail.*;
import javax.mail.internet.*;

public class UserAccountManager {
    private Map<String, User> users = new HashMap<>();
    private Properties emailConfig;
    
    public UserAccountManager() {
        loadEmailConfiguration();
    }
    
    // User management responsibility
    public boolean createUser(String username, String email, String password, String firstName, String lastName) {
        // Validate input
        if (username == null || username.trim().isEmpty()) {
            return false;
        }
        if (email == null || !isValidEmail(email)) {
            return false;
        }
        if (password == null || password.length() < 8) {
            return false;
        }
        
        // Check if user already exists
        if (users.containsKey(username)) {
            return false;
        }
        
        // Hash password
        String hashedPassword = hashPassword(password);
        
        // Create user
        User user = new User(username, email, hashedPassword, firstName, lastName);
        users.put(username, user);
        
        // Save to file
        saveUserToFile(user);
        
        // Send welcome email
        sendWelcomeEmail(user);
        
        // Log the action
        logAction("User created: " + username);
        
        return true;
    }
    
    public User authenticateUser(String username, String password) {
        User user = users.get(username);
        if (user == null) {
            logAction("Authentication failed - user not found: " + username);
            return null;
        }
        
        String hashedPassword = hashPassword(password);
        if (!user.getPasswordHash().equals(hashedPassword)) {
            logAction("Authentication failed - invalid password: " + username);
            return null;
        }
        
        user.setLastLoginTime(LocalDateTime.now());
        updateUserInFile(user);
        logAction("User authenticated: " + username);
        
        return user;
    }
    
    public boolean updateUserProfile(String username, String email, String firstName, String lastName) {
        User user = users.get(username);
        if (user == null) {
            return false;
        }
        
        if (email != null && isValidEmail(email)) {
            user.setEmail(email);
        }
        if (firstName != null && !firstName.trim().isEmpty()) {
            user.setFirstName(firstName);
        }
        if (lastName != null && !lastName.trim().isEmpty()) {
            user.setLastName(lastName);
        }
        
        updateUserInFile(user);
        logAction("User profile updated: " + username);
        
        return true;
    }
    
    public boolean changePassword(String username, String oldPassword, String newPassword) {
        User user = users.get(username);
        if (user == null) {
            return false;
        }
        
        // Verify old password
        String hashedOldPassword = hashPassword(oldPassword);
        if (!user.getPasswordHash().equals(hashedOldPassword)) {
            logAction("Password change failed - invalid old password: " + username);
            return false;
        }
        
        // Validate new password
        if (newPassword == null || newPassword.length() < 8) {
            return false;
        }
        
        // Update password
        String hashedNewPassword = hashPassword(newPassword);
        user.setPasswordHash(hashedNewPassword);
        
        updateUserInFile(user);
        
        // Send password change notification
        sendPasswordChangeNotification(user);
        
        logAction("Password changed: " + username);
        
        return true;
    }
    
    public void deleteUser(String username) {
        User user = users.get(username);
        if (user != null) {
            users.remove(username);
            deleteUserFromFile(username);
            sendAccountDeletionNotification(user);
            logAction("User deleted: " + username);
        }
    }
    
    // Validation responsibility
    private boolean isValidEmail(String email) {
        return email.contains("@") && email.contains(".");
    }
    
    // Cryptography responsibility
    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashedBytes = md.digest(password.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hashedBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }
    
    // File I/O responsibility
    private void saveUserToFile(User user) {
        try {
            File file = new File("users.txt");
            FileWriter writer = new FileWriter(file, true);
            writer.write(user.getUsername() + "," + user.getEmail() + "," + 
                        user.getPasswordHash() + "," + user.getFirstName() + "," + 
                        user.getLastName() + "," + user.getCreatedTime() + "\n");
            writer.close();
        } catch (IOException e) {
            System.err.println("Error saving user to file: " + e.getMessage());
        }
    }
    
    private void updateUserInFile(User user) {
        // This is a simplified implementation - would need to read, modify, and rewrite
        try {
            List<String> lines = new ArrayList<>();
            File file = new File("users.txt");
            
            if (file.exists()) {
                Scanner scanner = new Scanner(file);
                while (scanner.hasNextLine()) {
                    String line = scanner.nextLine();
                    String[] parts = line.split(",");
                    if (parts.length > 0 && parts[0].equals(user.getUsername())) {
                        // Replace with updated user data
                        line = user.getUsername() + "," + user.getEmail() + "," + 
                               user.getPasswordHash() + "," + user.getFirstName() + "," + 
                               user.getLastName() + "," + user.getCreatedTime();
                    }
                    lines.add(line);
                }
                scanner.close();
            }
            
            FileWriter writer = new FileWriter(file);
            for (String line : lines) {
                writer.write(line + "\n");
            }
            writer.close();
        } catch (IOException e) {
            System.err.println("Error updating user in file: " + e.getMessage());
        }
    }
    
    private void deleteUserFromFile(String username) {
        try {
            List<String> lines = new ArrayList<>();
            File file = new File("users.txt");
            
            if (file.exists()) {
                Scanner scanner = new Scanner(file);
                while (scanner.hasNextLine()) {
                    String line = scanner.nextLine();
                    String[] parts = line.split(",");
                    if (parts.length == 0 || !parts[0].equals(username)) {
                        lines.add(line);
                    }
                }
                scanner.close();
            }
            
            FileWriter writer = new FileWriter(file);
            for (String line : lines) {
                writer.write(line + "\n");
            }
            writer.close();
        } catch (IOException e) {
            System.err.println("Error deleting user from file: " + e.getMessage());
        }
    }
    
    // Email responsibility
    private void loadEmailConfiguration() {
        emailConfig = new Properties();
        emailConfig.put("mail.smtp.host", "smtp.gmail.com");
        emailConfig.put("mail.smtp.port", "587");
        emailConfig.put("mail.smtp.auth", "true");
        emailConfig.put("mail.smtp.starttls.enable", "true");
    }
    
    private void sendWelcomeEmail(User user) {
        try {
            Session session = Session.getInstance(emailConfig, new Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication("system@company.com", "password");
                }
            });
            
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress("system@company.com"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(user.getEmail()));
            message.setSubject("Welcome to Our Platform!");
            message.setText("Dear " + user.getFirstName() + ",\n\nWelcome to our platform! Your account has been created successfully.\n\nBest regards,\nThe Team");
            
            Transport.send(message);
        } catch (MessagingException e) {
            System.err.println("Error sending welcome email: " + e.getMessage());
        }
    }
    
    private void sendPasswordChangeNotification(User user) {
        try {
            Session session = Session.getInstance(emailConfig, new Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication("system@company.com", "password");
                }
            });
            
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress("system@company.com"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(user.getEmail()));
            message.setSubject("Password Changed");
            message.setText("Dear " + user.getFirstName() + ",\n\nYour password has been changed successfully.\n\nIf you didn't make this change, please contact support immediately.\n\nBest regards,\nThe Team");
            
            Transport.send(message);
        } catch (MessagingException e) {
            System.err.println("Error sending password change notification: " + e.getMessage());
        }
    }
    
    private void sendAccountDeletionNotification(User user) {
        try {
            Session session = Session.getInstance(emailConfig, new Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication("system@company.com", "password");
                }
            });
            
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress("system@company.com"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(user.getEmail()));
            message.setSubject("Account Deleted");
            message.setText("Dear " + user.getFirstName() + ",\n\nYour account has been deleted as requested.\n\nThank you for using our platform.\n\nBest regards,\nThe Team");
            
            Transport.send(message);
        } catch (MessagingException e) {
            System.err.println("Error sending account deletion notification: " + e.getMessage());
        }
    }
    
    // Logging responsibility
    private void logAction(String action) {
        try {
            File logFile = new File("user_actions.log");
            FileWriter writer = new FileWriter(logFile, true);
            writer.write(LocalDateTime.now() + ": " + action + "\n");
            writer.close();
        } catch (IOException e) {
            System.err.println("Error logging action: " + e.getMessage());
        }
    }
}

// User entity
class User {
    private String username;
    private String email;
    private String passwordHash;
    private String firstName;
    private String lastName;
    private LocalDateTime createdTime;
    private LocalDateTime lastLoginTime;
    
    public User(String username, String email, String passwordHash, String firstName, String lastName) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.firstName = firstName;
        this.lastName = lastName;
        this.createdTime = LocalDateTime.now();
    }
    
    // Getters and setters...
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public LocalDateTime getCreatedTime() { return createdTime; }
    public LocalDateTime getLastLoginTime() { return lastLoginTime; }
    public void setLastLoginTime(LocalDateTime lastLoginTime) { this.lastLoginTime = lastLoginTime; }
}
```

### Your Task
Identify the responsibilities and refactor into separate classes following SRP.

### Requirements
- [ ] **Identify responsibilities** - list all the different things this class does
- [ ] **Create focused classes** - each class should have one clear responsibility
- [ ] **Maintain functionality** - all original features should still work
- [ ] **Apply dependency injection** - classes should depend on abstractions
- [ ] **Design clean interfaces** - clear contracts between classes
- [ ] **Test the refactored design** - ensure each class can be tested independently

### Refactoring Steps
1. **List Responsibilities**: What different jobs does this class perform?
2. **Group Related Operations**: Which methods belong together?
3. **Extract Classes**: Create new classes for each responsibility
4. **Define Interfaces**: Create abstractions for dependencies
5. **Compose the Solution**: Wire the classes together
6. **Verify Functionality**: Ensure everything still works

### Focus Areas
- Responsibility identification
- Interface design
- Dependency management
- Class composition

---

## Problem 2: Order Processing System

### Current Code (Python)
```python
# ❌ Violates SRP - handles multiple responsibilities
import json
import smtplib
import sqlite3
import logging
import requests
from datetime import datetime, timedelta
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart

class OrderProcessor:
    def __init__(self):
        self.db_connection = sqlite3.connect('orders.db')
        self.setup_database()
        self.setup_logging()
        self.payment_api_key = "sk_test_abc123"
        self.email_config = {
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'username': 'orders@company.com',
            'password': 'email_password'
        }
    
    def setup_database(self):
        cursor = self.db_connection.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_email TEXT NOT NULL,
                items TEXT NOT NULL,
                total_amount REAL NOT NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                payment_id TEXT,
                shipping_address TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS inventory (
                product_id TEXT PRIMARY KEY,
                stock_quantity INTEGER NOT NULL,
                price REAL NOT NULL
            )
        ''')
        self.db_connection.commit()
    
    def setup_logging(self):
        logging.basicConfig(
            filename='orders.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def process_order(self, order_data):
        """Main order processing method"""
        try:
            # Validate order data
            if not self.validate_order_data(order_data):
                self.logger.error(f"Invalid order data: {order_data}")
                return {'success': False, 'error': 'Invalid order data'}
            
            # Check inventory
            if not self.check_inventory_availability(order_data['items']):
                self.logger.warning(f"Insufficient inventory for order: {order_data}")
                return {'success': False, 'error': 'Insufficient inventory'}
            
            # Calculate total
            total_amount = self.calculate_order_total(order_data['items'])
            
            # Process payment
            payment_result = self.process_payment(order_data['customer_email'], total_amount)
            if not payment_result['success']:
                self.logger.error(f"Payment failed for order: {order_data}")
                return {'success': False, 'error': 'Payment failed'}
            
            # Update inventory
            self.update_inventory(order_data['items'])
            
            # Create order record
            order_id = self.create_order_record(order_data, total_amount, payment_result['payment_id'])
            
            # Send confirmation email
            self.send_order_confirmation(order_data['customer_email'], order_id, order_data['items'], total_amount)
            
            # Schedule shipping
            self.schedule_shipping(order_id, order_data['shipping_address'])
            
            self.logger.info(f"Order processed successfully: {order_id}")
            return {'success': True, 'order_id': order_id}
            
        except Exception as e:
            self.logger.error(f"Error processing order: {str(e)}")
            return {'success': False, 'error': 'Internal server error'}
    
    # Validation responsibility
    def validate_order_data(self, order_data):
        """Validate order data structure and content"""
        if not isinstance(order_data, dict):
            return False
        
        required_fields = ['customer_email', 'items', 'shipping_address']
        for field in required_fields:
            if field not in order_data:
                return False
        
        # Validate email format
        email = order_data['customer_email']
        if '@' not in email or '.' not in email.split('@')[-1]:
            return False
        
        # Validate items
        if not isinstance(order_data['items'], list) or len(order_data['items']) == 0:
            return False
        
        for item in order_data['items']:
            if not isinstance(item, dict):
                return False
            if 'product_id' not in item or 'quantity' not in item:
                return False
            if not isinstance(item['quantity'], int) or item['quantity'] <= 0:
                return False
        
        # Validate shipping address
        address = order_data['shipping_address']
        if not isinstance(address, dict):
            return False
        
        required_address_fields = ['street', 'city', 'state', 'zip_code']
        for field in required_address_fields:
            if field not in address or not address[field].strip():
                return False
        
        return True
    
    # Inventory management responsibility
    def check_inventory_availability(self, items):
        """Check if all items are available in sufficient quantities"""
        cursor = self.db_connection.cursor()
        
        for item in items:
            product_id = item['product_id']
            requested_quantity = item['quantity']
            
            cursor.execute('SELECT stock_quantity FROM inventory WHERE product_id = ?', (product_id,))
            result = cursor.fetchone()
            
            if not result:
                return False  # Product not found
            
            available_quantity = result[0]
            if available_quantity < requested_quantity:
                return False  # Insufficient stock
        
        return True
    
    def update_inventory(self, items):
        """Update inventory quantities after successful order"""
        cursor = self.db_connection.cursor()
        
        for item in items:
            product_id = item['product_id']
            quantity = item['quantity']
            
            cursor.execute(
                'UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
                (quantity, product_id)
            )
        
        self.db_connection.commit()
    
    def get_product_price(self, product_id):
        """Get product price from inventory"""
        cursor = self.db_connection.cursor()
        cursor.execute('SELECT price FROM inventory WHERE product_id = ?', (product_id,))
        result = cursor.fetchone()
        return result[0] if result else 0
    
    # Pricing responsibility
    def calculate_order_total(self, items):
        """Calculate total order amount including tax and shipping"""
        subtotal = 0
        
        for item in items:
            product_price = self.get_product_price(item['product_id'])
            item_total = product_price * item['quantity']
            subtotal += item_total
        
        # Calculate tax (8% for simplicity)
        tax = subtotal * 0.08
        
        # Calculate shipping
        shipping = self.calculate_shipping_cost(subtotal)
        
        return subtotal + tax + shipping
    
    def calculate_shipping_cost(self, subtotal):
        """Calculate shipping cost based on order value"""
        if subtotal >= 100:
            return 0  # Free shipping
        elif subtotal >= 50:
            return 5.99
        else:
            return 9.99
    
    # Payment responsibility
    def process_payment(self, customer_email, amount):
        """Process payment through external payment API"""
        try:
            payment_data = {
                'amount': int(amount * 100),  # Convert to cents
                'currency': 'usd',
                'customer_email': customer_email,
                'description': 'Order payment'
            }
            
            headers = {
                'Authorization': f'Bearer {self.payment_api_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                'https://api.stripe.com/v1/charges',
                json=payment_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'payment_id': result.get('id'),
                    'transaction_id': result.get('balance_transaction')
                }
            else:
                return {'success': False, 'error': 'Payment processing failed'}
                
        except requests.RequestException as e:
            self.logger.error(f"Payment API error: {str(e)}")
            return {'success': False, 'error': 'Payment service unavailable'}
    
    # Database responsibility
    def create_order_record(self, order_data, total_amount, payment_id):
        """Create order record in database"""
        cursor = self.db_connection.cursor()
        
        cursor.execute('''
            INSERT INTO orders (customer_email, items, total_amount, status, payment_id, shipping_address)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            order_data['customer_email'],
            json.dumps(order_data['items']),
            total_amount,
            'confirmed',
            payment_id,
            json.dumps(order_data['shipping_address'])
        ))
        
        order_id = cursor.lastrowid
        self.db_connection.commit()
        return order_id
    
    def get_order_by_id(self, order_id):
        """Retrieve order by ID"""
        cursor = self.db_connection.cursor()
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        return cursor.fetchone()
    
    def update_order_status(self, order_id, status):
        """Update order status"""
        cursor = self.db_connection.cursor()
        cursor.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
        self.db_connection.commit()
    
    # Email responsibility
    def send_order_confirmation(self, customer_email, order_id, items, total_amount):
        """Send order confirmation email to customer"""
        try:
            # Create email content
            subject = f"Order Confirmation - Order #{order_id}"
            
            body = f"""
            Dear Customer,
            
            Thank you for your order! Your order has been confirmed and is being processed.
            
            Order Details:
            Order ID: {order_id}
            Total Amount: ${total_amount:.2f}
            
            Items Ordered:
            """
            
            for item in items:
                product_price = self.get_product_price(item['product_id'])
                item_total = product_price * item['quantity']
                body += f"- Product {item['product_id']}: {item['quantity']} x ${product_price:.2f} = ${item_total:.2f}\n"
            
            body += f"""
            
            We'll send you another email once your order ships.
            
            Thank you for your business!
            Best regards,
            The Sales Team
            """
            
            # Send email
            self.send_email(customer_email, subject, body)
            
        except Exception as e:
            self.logger.error(f"Error sending confirmation email: {str(e)}")
    
    def send_email(self, to_email, subject, body):
        """Send email using SMTP"""
        try:
            msg = MimeMultipart()
            msg['From'] = self.email_config['username']
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MimeText(body, 'plain'))
            
            server = smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port'])
            server.starttls()
            server.login(self.email_config['username'], self.email_config['password'])
            
            server.send_message(msg)
            server.quit()
            
            self.logger.info(f"Email sent successfully to {to_email}")
            
        except Exception as e:
            self.logger.error(f"Error sending email to {to_email}: {str(e)}")
    
    # Shipping responsibility
    def schedule_shipping(self, order_id, shipping_address):
        """Schedule shipping for the order"""
        try:
            # In a real system, this would integrate with a shipping API
            # For now, we'll just log the shipping request
            
            shipping_data = {
                'order_id': order_id,
                'address': shipping_address,
                'service_type': 'standard',
                'scheduled_date': (datetime.now() + timedelta(days=1)).isoformat()
            }
            
            # Simulate API call
            self.logger.info(f"Shipping scheduled for order {order_id}: {shipping_data}")
            
            # Update order status
            self.update_order_status(order_id, 'processing')
            
        except Exception as e:
            self.logger.error(f"Error scheduling shipping for order {order_id}: {str(e)}")
    
    def cancel_order(self, order_id, reason):
        """Cancel an order and refund payment"""
        try:
            # Get order details
            order = self.get_order_by_id(order_id)
            if not order:
                return {'success': False, 'error': 'Order not found'}
            
            # Process refund
            refund_result = self.process_refund(order[6], order[3])  # payment_id, amount
            if not refund_result['success']:
                return {'success': False, 'error': 'Refund failed'}
            
            # Restore inventory
            items = json.loads(order[2])
            self.restore_inventory(items)
            
            # Update order status
            self.update_order_status(order_id, 'cancelled')
            
            # Send cancellation email
            self.send_cancellation_email(order[1], order_id, reason)
            
            self.logger.info(f"Order {order_id} cancelled successfully")
            return {'success': True}
            
        except Exception as e:
            self.logger.error(f"Error cancelling order {order_id}: {str(e)}")
            return {'success': False, 'error': 'Cancellation failed'}
    
    def process_refund(self, payment_id, amount):
        """Process refund through payment API"""
        try:
            refund_data = {
                'charge': payment_id,
                'amount': int(amount * 100)
            }
            
            headers = {
                'Authorization': f'Bearer {self.payment_api_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                'https://api.stripe.com/v1/refunds',
                json=refund_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return {'success': True}
            else:
                return {'success': False, 'error': 'Refund processing failed'}
                
        except requests.RequestException as e:
            self.logger.error(f"Refund API error: {str(e)}")
            return {'success': False, 'error': 'Refund service unavailable'}
    
    def restore_inventory(self, items):
        """Restore inventory quantities after cancellation"""
        cursor = self.db_connection.cursor()
        
        for item in items:
            product_id = item['product_id']
            quantity = item['quantity']
            
            cursor.execute(
                'UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
                (quantity, product_id)
            )
        
        self.db_connection.commit()
    
    def send_cancellation_email(self, customer_email, order_id, reason):
        """Send order cancellation email"""
        subject = f"Order Cancellation - Order #{order_id}"
        body = f"""
        Dear Customer,
        
        We regret to inform you that your order #{order_id} has been cancelled.
        
        Reason: {reason}
        
        A full refund will be processed and should appear in your account within 3-5 business days.
        
        We apologize for any inconvenience.
        
        Best regards,
        The Customer Service Team
        """
        
        self.send_email(customer_email, subject, body)
```

### Your Task
Refactor this monolithic order processor into focused classes following SRP.

### Requirements
- [ ] **Identify all responsibilities** - this class handles many different concerns
- [ ] **Extract service classes** - payment, inventory, email, shipping, etc.
- [ ] **Create proper abstractions** - interfaces for external dependencies
- [ ] **Implement dependency injection** - services should be injected
- [ ] **Maintain all functionality** - order processing should work exactly the same
- [ ] **Improve testability** - each service should be testable in isolation

### Responsibility Categories
Think about these areas:
- Order orchestration and workflow
- Data validation and business rules
- Inventory management
- Payment processing
- Email notifications
- Database operations
- Shipping coordination
- Logging and auditing

### Focus Areas
- Service extraction
- Interface design
- Workflow orchestration
- Dependency management

---

## Problem 3: Report Generation Engine

### Current Code (C#)
```csharp
// ❌ Violates SRP - handles multiple responsibilities
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.IO;
using System.Text;
using System.Net.Mail;
using System.Linq;
using System.Configuration;

public class ReportGenerator
{
    private string connectionString;
    private string smtpServer;
    private string smtpUsername;
    private string smtpPassword;
    
    public ReportGenerator()
    {
        LoadConfiguration();
    }
    
    // Configuration responsibility
    private void LoadConfiguration()
    {
        connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;
        smtpServer = ConfigurationManager.AppSettings["SmtpServer"];
        smtpUsername = ConfigurationManager.AppSettings["SmtpUsername"];
        smtpPassword = ConfigurationManager.AppSettings["SmtpPassword"];
    }
    
    // Main report generation responsibility
    public void GenerateMonthlySalesReport(int year, int month, string recipientEmail)
    {
        try
        {
            // Validate input parameters
            if (!ValidateReportParameters(year, month, recipientEmail))
            {
                LogError("Invalid report parameters");
                return;
            }
            
            // Fetch sales data
            var salesData = FetchSalesData(year, month);
            
            if (salesData == null || salesData.Count == 0)
            {
                LogWarning($"No sales data found for {month}/{year}");
                SendNoDataNotification(recipientEmail, year, month);
                return;
            }
            
            // Calculate metrics
            var metrics = CalculateSalesMetrics(salesData);
            
            // Generate different report formats
            var htmlReport = GenerateHtmlReport(salesData, metrics, year, month);
            var csvReport = GenerateCsvReport(salesData);
            var pdfReport = GeneratePdfReport(salesData, metrics, year, month);
            
            // Save reports to file system
            var reportDate = $"{year}-{month:D2}";
            var htmlPath = SaveHtmlReport(htmlReport, reportDate);
            var csvPath = SaveCsvReport(csvReport, reportDate);
            var pdfPath = SavePdfReport(pdfReport, reportDate);
            
            // Update report metadata in database
            var reportId = SaveReportMetadata(year, month, htmlPath, csvPath, pdfPath);
            
            // Send email with reports
            SendReportEmail(recipientEmail, htmlReport, csvPath, pdfPath, year, month);
            
            // Update report status
            UpdateReportStatus(reportId, "completed");
            
            LogInfo($"Monthly sales report generated successfully for {month}/{year}");
        }
        catch (Exception ex)
        {
            LogError($"Error generating report: {ex.Message}");
            SendErrorNotification(recipientEmail, ex.Message);
        }
    }
    
    // Validation responsibility
    private bool ValidateReportParameters(int year, int month, string email)
    {
        if (year < 2000 || year > DateTime.Now.Year)
            return false;
        
        if (month < 1 || month > 12)
            return false;
        
        if (string.IsNullOrEmpty(email) || !email.Contains("@"))
            return false;
        
        // Check if month is not in the future
        var reportDate = new DateTime(year, month, 1);
        if (reportDate > DateTime.Now.AddDays(-DateTime.Now.Day + 1))
            return false;
        
        return true;
    }
    
    // Database responsibility
    private List<SaleRecord> FetchSalesData(int year, int month)
    {
        var salesData = new List<SaleRecord>();
        
        using (var connection = new SqlConnection(connectionString))
        {
            connection.Open();
            
            var query = @"
                SELECT s.SaleId, s.SaleDate, s.Amount, s.Quantity, 
                       c.CustomerName, c.CustomerEmail, 
                       p.ProductName, p.Category, p.UnitPrice
                FROM Sales s
                INNER JOIN Customers c ON s.CustomerId = c.CustomerId
                INNER JOIN Products p ON s.ProductId = p.ProductId
                WHERE YEAR(s.SaleDate) = @year AND MONTH(s.SaleDate) = @month
                ORDER BY s.SaleDate DESC";
            
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@year", year);
                command.Parameters.AddWithValue("@month", month);
                
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var sale = new SaleRecord
                        {
                            SaleId = reader.GetInt32("SaleId"),
                            SaleDate = reader.GetDateTime("SaleDate"),
                            Amount = reader.GetDecimal("Amount"),
                            Quantity = reader.GetInt32("Quantity"),
                            CustomerName = reader.GetString("CustomerName"),
                            CustomerEmail = reader.GetString("CustomerEmail"),
                            ProductName = reader.GetString("ProductName"),
                            Category = reader.GetString("Category"),
                            UnitPrice = reader.GetDecimal("UnitPrice")
                        };
                        
                        salesData.Add(sale);
                    }
                }
            }
        }
        
        return salesData;
    }
    
    private int SaveReportMetadata(int year, int month, string htmlPath, string csvPath, string pdfPath)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            connection.Open();
            
            var query = @"
                INSERT INTO ReportMetadata (Year, Month, HtmlPath, CsvPath, PdfPath, GeneratedAt, Status)
                VALUES (@year, @month, @htmlPath, @csvPath, @pdfPath, @generatedAt, @status);
                SELECT CAST(SCOPE_IDENTITY() as int);";
            
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@year", year);
                command.Parameters.AddWithValue("@month", month);
                command.Parameters.AddWithValue("@htmlPath", htmlPath);
                command.Parameters.AddWithValue("@csvPath", csvPath);
                command.Parameters.AddWithValue("@pdfPath", pdfPath);
                command.Parameters.AddWithValue("@generatedAt", DateTime.Now);
                command.Parameters.AddWithValue("@status", "generating");
                
                return (int)command.ExecuteScalar();
            }
        }
    }
    
    private void UpdateReportStatus(int reportId, string status)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            connection.Open();
            
            var query = "UPDATE ReportMetadata SET Status = @status WHERE ReportId = @reportId";
            
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@status", status);
                command.Parameters.AddWithValue("@reportId", reportId);
                command.ExecuteNonQuery();
            }
        }
    }
    
    // Calculation responsibility
    private SalesMetrics CalculateSalesMetrics(List<SaleRecord> salesData)
    {
        var metrics = new SalesMetrics
        {
            TotalSales = salesData.Sum(s => s.Amount),
            TotalQuantity = salesData.Sum(s => s.Quantity),
            AverageOrderValue = salesData.Average(s => s.Amount),
            UniqueCustomers = salesData.Select(s => s.CustomerEmail).Distinct().Count()
        };
        
        // Category breakdown
        metrics.CategoryBreakdown = salesData
            .GroupBy(s => s.Category)
            .ToDictionary(g => g.Key, g => g.Sum(s => s.Amount));
        
        // Top products
        metrics.TopProducts = salesData
            .GroupBy(s => s.ProductName)
            .Select(g => new ProductSummary
            {
                ProductName = g.Key,
                TotalSales = g.Sum(s => s.Amount),
                TotalQuantity = g.Sum(s => s.Quantity)
            })
            .OrderByDescending(p => p.TotalSales)
            .Take(10)
            .ToList();
        
        // Daily breakdown
        metrics.DailyBreakdown = salesData
            .GroupBy(s => s.SaleDate.Date)
            .ToDictionary(g => g.Key, g => g.Sum(s => s.Amount));
        
        return metrics;
    }
    
    // HTML Report generation responsibility
    private string GenerateHtmlReport(List<SaleRecord> salesData, SalesMetrics metrics, int year, int month)
    {
        var html = new StringBuilder();
        
        html.AppendLine("<html><head><title>Monthly Sales Report</title>");
        html.AppendLine("<style>");
        html.AppendLine("body { font-family: Arial, sans-serif; margin: 20px; }");
        html.AppendLine("table { border-collapse: collapse; width: 100%; }");
        html.AppendLine("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }");
        html.AppendLine("th { background-color: #f2f2f2; }");
        html.AppendLine(".summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }");
        html.AppendLine("</style></head><body>");
        
        html.AppendLine($"<h1>Monthly Sales Report - {month:D2}/{year}</h1>");
        html.AppendLine($"<p>Generated on: {DateTime.Now:yyyy-MM-dd HH:mm:ss}</p>");
        
        // Summary section
        html.AppendLine("<div class='summary'>");
        html.AppendLine("<h2>Summary</h2>");
        html.AppendLine($"<p><strong>Total Sales:</strong> ${metrics.TotalSales:N2}</p>");
        html.AppendLine($"<p><strong>Total Quantity:</strong> {metrics.TotalQuantity:N0}</p>");
        html.AppendLine($"<p><strong>Average Order Value:</strong> ${metrics.AverageOrderValue:N2}</p>");
        html.AppendLine($"<p><strong>Unique Customers:</strong> {metrics.UniqueCustomers:N0}</p>");
        html.AppendLine("</div>");
        
        // Category breakdown
        html.AppendLine("<h2>Sales by Category</h2>");
        html.AppendLine("<table>");
        html.AppendLine("<tr><th>Category</th><th>Total Sales</th></tr>");
        foreach (var category in metrics.CategoryBreakdown.OrderByDescending(c => c.Value))
        {
            html.AppendLine($"<tr><td>{category.Key}</td><td>${category.Value:N2}</td></tr>");
        }
        html.AppendLine("</table>");
        
        // Top products
        html.AppendLine("<h2>Top 10 Products</h2>");
        html.AppendLine("<table>");
        html.AppendLine("<tr><th>Product</th><th>Total Sales</th><th>Quantity Sold</th></tr>");
        foreach (var product in metrics.TopProducts)
        {
            html.AppendLine($"<tr><td>{product.ProductName}</td><td>${product.TotalSales:N2}</td><td>{product.TotalQuantity}</td></tr>");
        }
        html.AppendLine("</table>");
        
        html.AppendLine("</body></html>");
        
        return html.ToString();
    }
    
    // CSV Report generation responsibility
    private string GenerateCsvReport(List<SaleRecord> salesData)
    {
        var csv = new StringBuilder();
        
        // Header
        csv.AppendLine("SaleId,SaleDate,CustomerName,CustomerEmail,ProductName,Category,Quantity,UnitPrice,Amount");
        
        // Data rows
        foreach (var sale in salesData)
        {
            csv.AppendLine($"{sale.SaleId},{sale.SaleDate:yyyy-MM-dd},{sale.CustomerName},{sale.CustomerEmail},{sale.ProductName},{sale.Category},{sale.Quantity},{sale.UnitPrice},{sale.Amount}");
        }
        
        return csv.ToString();
    }
    
    // PDF Report generation responsibility  
    private byte[] GeneratePdfReport(List<SaleRecord> salesData, SalesMetrics metrics, int year, int month)
    {
        // Simplified PDF generation - in real implementation would use a PDF library
        var content = $"Monthly Sales Report {month:D2}/{year}\n\n";
        content += $"Total Sales: ${metrics.TotalSales:N2}\n";
        content += $"Total Quantity: {metrics.TotalQuantity:N0}\n";
        content += $"Average Order Value: ${metrics.AverageOrderValue:N2}\n";
        content += $"Unique Customers: {metrics.UniqueCustomers:N0}\n\n";
        
        content += "Top Products:\n";
        foreach (var product in metrics.TopProducts.Take(5))
        {
            content += $"- {product.ProductName}: ${product.TotalSales:N2}\n";
        }
        
        return Encoding.UTF8.GetBytes(content);
    }
    
    // File system responsibility
    private string SaveHtmlReport(string htmlContent, string reportDate)
    {
        var fileName = $"sales_report_{reportDate}.html";
        var filePath = Path.Combine("Reports", fileName);
        
        Directory.CreateDirectory("Reports");
        File.WriteAllText(filePath, htmlContent);
        
        return filePath;
    }
    
    private string SaveCsvReport(string csvContent, string reportDate)
    {
        var fileName = $"sales_data_{reportDate}.csv";
        var filePath = Path.Combine("Reports", fileName);
        
        Directory.CreateDirectory("Reports");
        File.WriteAllText(filePath, csvContent);
        
        return filePath;
    }
    
    private string SavePdfReport(byte[] pdfContent, string reportDate)
    {
        var fileName = $"sales_report_{reportDate}.pdf";
        var filePath = Path.Combine("Reports", fileName);
        
        Directory.CreateDirectory("Reports");
        File.WriteAllBytes(filePath, pdfContent);
        
        return filePath;
    }
    
    // Email responsibility
    private void SendReportEmail(string recipientEmail, string htmlReport, string csvPath, string pdfPath, int year, int month)
    {
        try
        {
            var mail = new MailMessage();
            mail.From = new MailAddress(smtpUsername);
            mail.To.Add(recipientEmail);
            mail.Subject = $"Monthly Sales Report - {month:D2}/{year}";
            
            var body = $"Please find attached the monthly sales report for {month:D2}/{year}.\n\n";
            body += "The report includes:\n";
            body += "- HTML version (embedded below)\n";
            body += "- CSV data file\n";
            body += "- PDF summary\n\n";
            body += "HTML Report:\n" + htmlReport;
            
            mail.Body = body;
            mail.IsBodyHtml = true;
            
            // Attach files
            if (File.Exists(csvPath))
                mail.Attachments.Add(new Attachment(csvPath));
            
            if (File.Exists(pdfPath))
                mail.Attachments.Add(new Attachment(pdfPath));
            
            var smtpClient = new SmtpClient(smtpServer)
            {
                Credentials = new System.Net.NetworkCredential(smtpUsername, smtpPassword),
                EnableSsl = true
            };
            
            smtpClient.Send(mail);
        }
        catch (Exception ex)
        {
            LogError($"Error sending report email: {ex.Message}");
        }
    }
    
    private void SendNoDataNotification(string recipientEmail, int year, int month)
    {
        try
        {
            var mail = new MailMessage();
            mail.From = new MailAddress(smtpUsername);
            mail.To.Add(recipientEmail);
            mail.Subject = $"No Sales Data Available - {month:D2}/{year}";
            mail.Body = $"No sales data was found for the period {month:D2}/{year}. The report was not generated.";
            
            var smtpClient = new SmtpClient(smtpServer)
            {
                Credentials = new System.Net.NetworkCredential(smtpUsername, smtpPassword),
                EnableSsl = true
            };
            
            smtpClient.Send(mail);
        }
        catch (Exception ex)
        {
            LogError($"Error sending no data notification: {ex.Message}");
        }
    }
    
    private void SendErrorNotification(string recipientEmail, string errorMessage)
    {
        try
        {
            var mail = new MailMessage();
            mail.From = new MailAddress(smtpUsername);
            mail.To.Add(recipientEmail);
            mail.Subject = "Report Generation Error";
            mail.Body = $"An error occurred while generating the report:\n\n{errorMessage}";
            
            var smtpClient = new SmtpClient(smtpServer)
            {
                Credentials = new System.Net.NetworkCredential(smtpUsername, smtpPassword),
                EnableSsl = true
            };
            
            smtpClient.Send(mail);
        }
        catch (Exception ex)
        {
            LogError($"Error sending error notification: {ex.Message}");
        }
    }
    
    // Logging responsibility
    private void LogInfo(string message)
    {
        var logEntry = $"[INFO] {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}";
        File.AppendAllText("reports.log", logEntry + Environment.NewLine);
    }
    
    private void LogWarning(string message)
    {
        var logEntry = $"[WARNING] {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}";
        File.AppendAllText("reports.log", logEntry + Environment.NewLine);
    }
    
    private void LogError(string message)
    {
        var logEntry = $"[ERROR] {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}";
        File.AppendAllText("reports.log", logEntry + Environment.NewLine);
    }
}

// Supporting classes
public class SaleRecord
{
    public int SaleId { get; set; }
    public DateTime SaleDate { get; set; }
    public decimal Amount { get; set; }
    public int Quantity { get; set; }
    public string CustomerName { get; set; }
    public string CustomerEmail { get; set; }
    public string ProductName { get; set; }
    public string Category { get; set; }
    public decimal UnitPrice { get; set; }
}

public class SalesMetrics
{
    public decimal TotalSales { get; set; }
    public int TotalQuantity { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int UniqueCustomers { get; set; }
    public Dictionary<string, decimal> CategoryBreakdown { get; set; }
    public List<ProductSummary> TopProducts { get; set; }
    public Dictionary<DateTime, decimal> DailyBreakdown { get; set; }
}

public class ProductSummary
{
    public string ProductName { get; set; }
    public decimal TotalSales { get; set; }
    public int TotalQuantity { get; set; }
}
```

### Your Task
Break down this report generator into focused classes following SRP.

### Requirements
- [ ] **Identify all responsibilities** - data access, calculations, formatting, file I/O, email, etc.
- [ ] **Extract specialized classes** - one for each major responsibility
- [ ] **Create clean interfaces** - abstract external dependencies
- [ ] **Implement proper composition** - wire classes together cleanly
- [ ] **Maintain full functionality** - report generation should work identically
- [ ] **Enable easy testing** - each class should be unit testable

### Suggested Class Structure
Consider these potential classes:
- Report orchestrator/coordinator
- Data access service
- Metrics calculator
- Report formatters (HTML, CSV, PDF)
- File storage service
- Email notification service
- Configuration manager
- Logging service
- Validation service

### Focus Areas
- Clean separation of concerns
- Interface-based design
- Composition over inheritance
- Testability and maintainability

---

## 🏆 Success Criteria

For each SRP refactoring exercise, achieve:

### Class Design Quality
- **Single Responsibility**: Each class has one clear, focused purpose
- **High Cohesion**: All methods in a class work together toward the same goal
- **Clear Naming**: Class names clearly indicate their responsibility
- **Appropriate Size**: Classes are small enough to understand easily

### Design Principles
- **Interface Segregation**: Dependencies are on focused interfaces
- **Dependency Inversion**: Classes depend on abstractions, not concretions
- **Open/Closed**: Design allows extension without modification
- **Composition**: Classes are composed together to create functionality

### Code Quality
- **Maintainability**: Changes to one responsibility don't affect others
- **Testability**: Each class can be tested independently
- **Reusability**: Classes can be reused in different contexts
- **Readability**: Code structure clearly expresses design intent

---

## 💡 SRP Refactoring Patterns

### **Responsibility Identification**
```java
// ❌ Multiple responsibilities in one class
class UserManager {
    // User management
    void createUser() { }
    void deleteUser() { }
    
    // Password handling
    String hashPassword() { }
    boolean verifyPassword() { }
    
    // Email notifications
    void sendWelcomeEmail() { }
    void sendPasswordResetEmail() { }
    
    // Database operations
    void saveUser() { }
    User findUser() { }
}

// ✅ Separated responsibilities
class UserService {
    void createUser() { }
    void deleteUser() { }
}

class PasswordService {
    String hash(String password) { }
    boolean verify(String password, String hash) { }
}

class EmailNotificationService {
    void sendWelcomeEmail(User user) { }
    void sendPasswordResetEmail(User user) { }
}

class UserRepository {
    void save(User user) { }
    User findById(String id) { }
}
```

### **Interface-Based Design**
```java
// ✅ Define interfaces for each responsibility
interface UserRepository {
    void save(User user);
    User findById(String id);
    User findByEmail(String email);
}

interface PasswordService {
    String hash(String password);
    boolean verify(String password, String hash);
}

interface EmailService {
    void sendEmail(String to, String subject, String body);
}

// ✅ Compose services together
class UserService {
    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final EmailService emailService;
    
    public UserService(UserRepository userRepository,
                      PasswordService passwordService,
                      EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.emailService = emailService;
    }
    
    public void createUser(String email, String password) {
        String hashedPassword = passwordService.hash(password);
        User user = new User(email, hashedPassword);
        userRepository.save(user);
        emailService.sendEmail(email, "Welcome!", "Welcome to our platform!");
    }
}
```

### **Facade Pattern for Coordination**
```java
// ✅ Use facade to coordinate multiple services
class UserManagementFacade {
    private final UserService userService;
    private final PasswordService passwordService;
    private final EmailService emailService;
    private final ValidationService validationService;
    
    public UserManagementFacade(UserService userService,
                               PasswordService passwordService,
                               EmailService emailService,
                               ValidationService validationService) {
        this.userService = userService;
        this.passwordService = passwordService;
        this.emailService = emailService;
        this.validationService = validationService;
    }
    
    public UserRegistrationResult registerUser(UserRegistrationRequest request) {
        // Coordinate multiple services to complete the operation
        ValidationResult validation = validationService.validate(request);
        if (!validation.isValid()) {
            return UserRegistrationResult.failure(validation.getErrors());
        }
        
        User user = userService.createUser(request);
        emailService.sendWelcomeEmail(user);
        
        return UserRegistrationResult.success(user);
    }
}
```

---

## 🎯 Self-Assessment

After completing each SRP exercise:

### **Responsibility Clarity (1-5 scale)**
- [ ] **Single Purpose**: Each class has one clear responsibility
- [ ] **Cohesion**: All methods in each class work toward the same goal
- [ ] **Naming**: Class names clearly indicate their purpose
- [ ] **Size**: Classes are appropriately sized and focused

### **Design Quality (1-5 scale)**
- [ ] **Interfaces**: Dependencies are on well-designed interfaces
- [ ] **Composition**: Classes are composed together effectively
- [ ] **Testability**: Each class can be tested independently
- [ ] **Maintainability**: Changes are isolated to relevant classes

**Target**: All scores should be 4 or 5, representing mastery of SRP.

---

## 🚀 Next Steps

Once you've mastered the Single Responsibility Principle:

1. **Apply SRP to your real code** - Look for classes doing too much in your projects
2. **Practice responsibility identification** - Train your eye to spot SRP violations
3. **Move to [Exercise 2: Open/Closed Principle](./exercise-2-ocp.md)** - Learn extensible design
4. **Review existing code** - Refactor classes that violate SRP

Remember: SRP is the foundation of good object-oriented design. Classes that do one thing well are easier to understand, test, modify, and reuse. Master this principle and you'll write much better code!
