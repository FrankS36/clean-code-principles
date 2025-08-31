# Exercise 5: Dependency Inversion Principle (DIP)

Master the Dependency Inversion Principle by learning to design systems where high-level modules don't depend on low-level modules, but both depend on abstractions.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Recognize violations of the Dependency Inversion Principle
- Understand the difference between dependency inversion and dependency injection
- Design stable abstractions that don't depend on implementation details
- Apply inversion of control to decouple modules
- Create flexible architectures that are easy to test and extend
- Practice dependency injection patterns and IoC containers

## 📝 Exercise Format

Each problem presents code that violates DIP by having high-level modules depend directly on low-level implementation details. Your job is to invert these dependencies by introducing abstractions and applying dependency injection.

---

## Problem 1: E-commerce Order Processing

### Current Code (Java)
```java
// ❌ Violates DIP - high-level OrderService depends on concrete implementations
import java.util.*;
import java.sql.*;
import java.net.http.*;
import java.net.URI;
import javax.mail.*;
import javax.mail.internet.*;

public class OrderService {
    
    // ❌ Direct dependencies on concrete implementations
    private MySQLOrderRepository orderRepository;
    private PostgreSQLInventoryRepository inventoryRepository;
    private StripePaymentProcessor paymentProcessor;
    private SendGridEmailService emailService;
    private FileSystemLogger logger;
    private RedisCache cache;
    
    public OrderService() {
        // ❌ Hard-coded instantiation of dependencies
        this.orderRepository = new MySQLOrderRepository();
        this.inventoryRepository = new PostgreSQLInventoryRepository();
        this.paymentProcessor = new StripePaymentProcessor();
        this.emailService = new SendGridEmailService();
        this.logger = new FileSystemLogger();
        this.cache = new RedisCache();
    }
    
    public OrderResult processOrder(OrderRequest orderRequest) {
        try {
            logger.log("Starting order processing for customer: " + orderRequest.getCustomerId());
            
            // Check cache first
            String cacheKey = "inventory_" + orderRequest.getProductId();
            Integer cachedStock = cache.get(cacheKey);
            
            // Validate inventory
            boolean hasStock;
            if (cachedStock != null) {
                hasStock = cachedStock >= orderRequest.getQuantity();
            } else {
                int currentStock = inventoryRepository.getStockLevel(orderRequest.getProductId());
                cache.put(cacheKey, currentStock, 300); // 5 minute TTL
                hasStock = currentStock >= orderRequest.getQuantity();
            }
            
            if (!hasStock) {
                logger.log("Insufficient stock for product: " + orderRequest.getProductId());
                return OrderResult.failure("Insufficient stock");
            }
            
            // Process payment
            PaymentRequest paymentRequest = new PaymentRequest(
                orderRequest.getCustomerId(),
                orderRequest.getTotalAmount(),
                orderRequest.getPaymentToken()
            );
            
            PaymentResult paymentResult = paymentProcessor.processPayment(paymentRequest);
            
            if (!paymentResult.isSuccessful()) {
                logger.log("Payment failed for order: " + paymentResult.getErrorMessage());
                return OrderResult.failure("Payment failed: " + paymentResult.getErrorMessage());
            }
            
            // Create order record
            Order order = new Order(
                UUID.randomUUID().toString(),
                orderRequest.getCustomerId(),
                orderRequest.getProductId(),
                orderRequest.getQuantity(),
                orderRequest.getTotalAmount(),
                paymentResult.getTransactionId(),
                new Date()
            );
            
            String orderId = orderRepository.saveOrder(order);
            
            // Update inventory
            inventoryRepository.updateStock(
                orderRequest.getProductId(), 
                -orderRequest.getQuantity()
            );
            
            // Clear cache
            cache.remove(cacheKey);
            
            // Send confirmation email
            Customer customer = orderRepository.getCustomerById(orderRequest.getCustomerId());
            emailService.sendOrderConfirmation(
                customer.getEmail(),
                orderId,
                orderRequest.getTotalAmount()
            );
            
            logger.log("Order processed successfully: " + orderId);
            
            return OrderResult.success(orderId);
            
        } catch (Exception e) {
            logger.log("Error processing order: " + e.getMessage());
            return OrderResult.failure("Internal error: " + e.getMessage());
        }
    }
    
    public List<Order> getOrderHistory(String customerId) {
        try {
            logger.log("Retrieving order history for customer: " + customerId);
            return orderRepository.getOrdersByCustomerId(customerId);
        } catch (Exception e) {
            logger.log("Error retrieving order history: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    public boolean cancelOrder(String orderId) {
        try {
            logger.log("Cancelling order: " + orderId);
            
            Order order = orderRepository.getOrderById(orderId);
            if (order == null) {
                logger.log("Order not found: " + orderId);
                return false;
            }
            
            if (order.getStatus() != OrderStatus.PENDING) {
                logger.log("Cannot cancel order with status: " + order.getStatus());
                return false;
            }
            
            // Process refund
            RefundRequest refundRequest = new RefundRequest(
                order.getPaymentTransactionId(),
                order.getTotalAmount()
            );
            
            RefundResult refundResult = paymentProcessor.processRefund(refundRequest);
            
            if (!refundResult.isSuccessful()) {
                logger.log("Refund failed for order: " + orderId);
                return false;
            }
            
            // Update order status
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.updateOrder(order);
            
            // Restore inventory
            inventoryRepository.updateStock(order.getProductId(), order.getQuantity());
            
            // Clear cache
            String cacheKey = "inventory_" + order.getProductId();
            cache.remove(cacheKey);
            
            // Send cancellation email
            Customer customer = orderRepository.getCustomerById(order.getCustomerId());
            emailService.sendOrderCancellation(customer.getEmail(), orderId);
            
            logger.log("Order cancelled successfully: " + orderId);
            return true;
            
        } catch (Exception e) {
            logger.log("Error cancelling order: " + e.getMessage());
            return false;
        }
    }
}

// ❌ Concrete implementations that OrderService depends on directly
class MySQLOrderRepository {
    private Connection connection;
    
    public MySQLOrderRepository() {
        try {
            // ❌ Hard-coded MySQL connection
            this.connection = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/orders",
                "root",
                "password"
            );
        } catch (SQLException e) {
            throw new RuntimeException("Failed to connect to MySQL", e);
        }
    }
    
    public String saveOrder(Order order) {
        try {
            String sql = "INSERT INTO orders (id, customer_id, product_id, quantity, total_amount, payment_transaction_id, order_date) VALUES (?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement stmt = connection.prepareStatement(sql);
            stmt.setString(1, order.getId());
            stmt.setString(2, order.getCustomerId());
            stmt.setString(3, order.getProductId());
            stmt.setInt(4, order.getQuantity());
            stmt.setBigDecimal(5, order.getTotalAmount());
            stmt.setString(6, order.getPaymentTransactionId());
            stmt.setTimestamp(7, new Timestamp(order.getOrderDate().getTime()));
            
            stmt.executeUpdate();
            return order.getId();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save order", e);
        }
    }
    
    public Order getOrderById(String orderId) {
        try {
            String sql = "SELECT * FROM orders WHERE id = ?";
            PreparedStatement stmt = connection.prepareStatement(sql);
            stmt.setString(1, orderId);
            
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return mapResultSetToOrder(rs);
            }
            return null;
        } catch (SQLException e) {
            throw new RuntimeException("Failed to get order", e);
        }
    }
    
    public List<Order> getOrdersByCustomerId(String customerId) {
        try {
            String sql = "SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC";
            PreparedStatement stmt = connection.prepareStatement(sql);
            stmt.setString(1, customerId);
            
            ResultSet rs = stmt.executeQuery();
            List<Order> orders = new ArrayList<>();
            
            while (rs.next()) {
                orders.add(mapResultSetToOrder(rs));
            }
            
            return orders;
        } catch (SQLException e) {
            throw new RuntimeException("Failed to get orders by customer", e);
        }
    }
    
    public void updateOrder(Order order) {
        try {
            String sql = "UPDATE orders SET status = ? WHERE id = ?";
            PreparedStatement stmt = connection.prepareStatement(sql);
            stmt.setString(1, order.getStatus().toString());
            stmt.setString(2, order.getId());
            
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update order", e);
        }
    }
    
    public Customer getCustomerById(String customerId) {
        try {
            String sql = "SELECT * FROM customers WHERE id = ?";
            PreparedStatement stmt = connection.prepareStatement(sql);
            stmt.setString(1, customerId);
            
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return new Customer(
                    rs.getString("id"),
                    rs.getString("name"),
                    rs.getString("email")
                );
            }
            return null;
        } catch (SQLException e) {
            throw new RuntimeException("Failed to get customer", e);
        }
    }
    
    private Order mapResultSetToOrder(ResultSet rs) throws SQLException {
        Order order = new Order(
            rs.getString("id"),
            rs.getString("customer_id"),
            rs.getString("product_id"),
            rs.getInt("quantity"),
            rs.getBigDecimal("total_amount"),
            rs.getString("payment_transaction_id"),
            new Date(rs.getTimestamp("order_date").getTime())
        );
        order.setStatus(OrderStatus.valueOf(rs.getString("status")));
        return order;
    }
}

class PostgreSQLInventoryRepository {
    private Connection connection;
    
    public PostgreSQLInventoryRepository() {
        try {
            // ❌ Hard-coded PostgreSQL connection
            this.connection = DriverManager.getConnection(
                "jdbc:postgresql://localhost:5432/inventory",
                "postgres",
                "password"
            );
        } catch (SQLException e) {
            throw new RuntimeException("Failed to connect to PostgreSQL", e);
        }
    }
    
    public int getStockLevel(String productId) {
        try {
            String sql = "SELECT stock_quantity FROM inventory WHERE product_id = ?";
            PreparedStatement stmt = connection.prepareStatement(sql);
            stmt.setString(1, productId);
            
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return rs.getInt("stock_quantity");
            }
            return 0;
        } catch (SQLException e) {
            throw new RuntimeException("Failed to get stock level", e);
        }
    }
    
    public void updateStock(String productId, int quantityChange) {
        try {
            String sql = "UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE product_id = ?";
            PreparedStatement stmt = connection.prepareStatement(sql);
            stmt.setInt(1, quantityChange);
            stmt.setString(2, productId);
            
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update stock", e);
        }
    }
}

class StripePaymentProcessor {
    private String apiKey;
    private HttpClient httpClient;
    
    public StripePaymentProcessor() {
        // ❌ Hard-coded Stripe configuration
        this.apiKey = "sk_test_abc123xyz";
        this.httpClient = HttpClient.newHttpClient();
    }
    
    public PaymentResult processPayment(PaymentRequest request) {
        try {
            // ❌ Hard-coded Stripe API call
            String requestBody = buildStripePaymentRequest(request);
            
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.stripe.com/v1/charges"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();
            
            HttpResponse<String> response = httpClient.send(httpRequest, 
                HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                // Parse Stripe response
                String transactionId = parseTransactionId(response.body());
                return PaymentResult.success(transactionId);
            } else {
                return PaymentResult.failure("Payment failed");
            }
            
        } catch (Exception e) {
            return PaymentResult.failure("Payment processing error: " + e.getMessage());
        }
    }
    
    public RefundResult processRefund(RefundRequest request) {
        try {
            // ❌ Hard-coded Stripe refund API call
            String requestBody = buildStripeRefundRequest(request);
            
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.stripe.com/v1/refunds"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();
            
            HttpResponse<String> response = httpClient.send(httpRequest,
                HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                String refundId = parseRefundId(response.body());
                return RefundResult.success(refundId);
            } else {
                return RefundResult.failure("Refund failed");
            }
            
        } catch (Exception e) {
            return RefundResult.failure("Refund processing error: " + e.getMessage());
        }
    }
    
    private String buildStripePaymentRequest(PaymentRequest request) {
        return "amount=" + (request.getAmount().intValue() * 100) +
               "&currency=usd" +
               "&source=" + request.getPaymentToken();
    }
    
    private String buildStripeRefundRequest(RefundRequest request) {
        return "charge=" + request.getTransactionId() +
               "&amount=" + (request.getAmount().intValue() * 100);
    }
    
    private String parseTransactionId(String responseBody) {
        // Simplified JSON parsing
        return "ch_" + System.currentTimeMillis();
    }
    
    private String parseRefundId(String responseBody) {
        // Simplified JSON parsing
        return "re_" + System.currentTimeMillis();
    }
}

class SendGridEmailService {
    private String apiKey;
    private HttpClient httpClient;
    
    public SendGridEmailService() {
        // ❌ Hard-coded SendGrid configuration
        this.apiKey = "SG.abc123xyz";
        this.httpClient = HttpClient.newHttpClient();
    }
    
    public void sendOrderConfirmation(String customerEmail, String orderId, BigDecimal amount) {
        try {
            String emailBody = buildOrderConfirmationEmail(orderId, amount);
            sendEmail(customerEmail, "Order Confirmation - " + orderId, emailBody);
        } catch (Exception e) {
            System.err.println("Failed to send order confirmation: " + e.getMessage());
        }
    }
    
    public void sendOrderCancellation(String customerEmail, String orderId) {
        try {
            String emailBody = buildOrderCancellationEmail(orderId);
            sendEmail(customerEmail, "Order Cancellation - " + orderId, emailBody);
        } catch (Exception e) {
            System.err.println("Failed to send order cancellation: " + e.getMessage());
        }
    }
    
    private void sendEmail(String to, String subject, String body) throws Exception {
        // ❌ Hard-coded SendGrid API call
        String requestBody = buildSendGridRequest(to, subject, body);
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.sendgrid.com/v3/mail/send"))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build();
        
        HttpResponse<String> response = httpClient.send(request,
            HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() != 202) {
            throw new Exception("Email sending failed with status: " + response.statusCode());
        }
    }
    
    private String buildOrderConfirmationEmail(String orderId, BigDecimal amount) {
        return "Your order " + orderId + " for $" + amount + " has been confirmed.";
    }
    
    private String buildOrderCancellationEmail(String orderId) {
        return "Your order " + orderId + " has been cancelled and refunded.";
    }
    
    private String buildSendGridRequest(String to, String subject, String body) {
        // Simplified JSON building
        return "{\"personalizations\":[{\"to\":[{\"email\":\"" + to + "\"}]}]," +
               "\"from\":{\"email\":\"orders@company.com\"}," +
               "\"subject\":\"" + subject + "\"," +
               "\"content\":[{\"type\":\"text/plain\",\"value\":\"" + body + "\"}]}";
    }
}

class FileSystemLogger {
    private String logFile;
    
    public FileSystemLogger() {
        // ❌ Hard-coded log file path
        this.logFile = "/var/log/orders.log";
    }
    
    public void log(String message) {
        try {
            // ❌ Direct file system dependency
            java.io.FileWriter writer = new java.io.FileWriter(logFile, true);
            writer.write(new Date() + ": " + message + "\n");
            writer.close();
        } catch (Exception e) {
            System.err.println("Failed to write log: " + e.getMessage());
        }
    }
}

class RedisCache {
    // ❌ Direct Redis dependency
    private Map<String, Object> cache; // Simplified - would use actual Redis client
    
    public RedisCache() {
        // ❌ Hard-coded Redis connection
        this.cache = new HashMap<>(); // Simplified
    }
    
    public <T> T get(String key) {
        return (T) cache.get(key);
    }
    
    public void put(String key, Object value, int ttlSeconds) {
        cache.put(key, value);
        // In real implementation, would set TTL
    }
    
    public void remove(String key) {
        cache.remove(key);
    }
}

// Supporting classes
class Order {
    private String id;
    private String customerId;
    private String productId;
    private int quantity;
    private BigDecimal totalAmount;
    private String paymentTransactionId;
    private Date orderDate;
    private OrderStatus status = OrderStatus.PENDING;
    
    // Constructor and getters/setters...
}

enum OrderStatus { PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED }

class Customer {
    private String id;
    private String name;
    private String email;
    
    // Constructor and getters...
}

class OrderRequest {
    private String customerId;
    private String productId;
    private int quantity;
    private BigDecimal totalAmount;
    private String paymentToken;
    
    // Constructor and getters...
}

class OrderResult {
    private boolean successful;
    private String orderId;
    private String errorMessage;
    
    public static OrderResult success(String orderId) {
        OrderResult result = new OrderResult();
        result.successful = true;
        result.orderId = orderId;
        return result;
    }
    
    public static OrderResult failure(String errorMessage) {
        OrderResult result = new OrderResult();
        result.successful = false;
        result.errorMessage = errorMessage;
        return result;
    }
    
    // Getters...
}

// More supporting classes for payments...
class PaymentRequest { /* implementation */ }
class PaymentResult { /* implementation */ }
class RefundRequest { /* implementation */ }
class RefundResult { /* implementation */ }
```

### Your Task
Refactor this order processing system to follow the Dependency Inversion Principle.

### Requirements
- [ ] **Create abstractions** - define interfaces for all external dependencies
- [ ] **Invert dependencies** - make high-level OrderService depend on abstractions
- [ ] **Apply dependency injection** - inject dependencies rather than creating them
- [ ] **Remove hard-coded configuration** - externalize configuration details
- [ ] **Enable testing** - make the system easily testable with mock implementations
- [ ] **Maintain functionality** - all order processing features should work the same

### DIP Violations to Address
1. **Direct class dependencies**: OrderService depends on concrete implementations
2. **Hard-coded instantiation**: Dependencies are created with `new` in constructor
3. **Configuration coupling**: Database URLs, API keys embedded in code
4. **Tight coupling**: High-level policy mixed with low-level implementation details
5. **Testing difficulty**: Cannot substitute dependencies for testing

### Refactoring Strategy
1. **Extract interfaces** - create abstractions for each dependency
2. **Apply dependency injection** - pass dependencies via constructor/setter
3. **Create configuration abstraction** - externalize configuration
4. **Implement IoC pattern** - use factory or container for dependency creation
5. **Provide multiple implementations** - create different implementations for different environments

### Focus Areas
- Interface design for abstractions
- Dependency injection patterns
- Configuration management
- IoC container usage

---

## Problem 2: Report Generation System

### Current Code (Python)
```python
# ❌ Violates DIP - high-level ReportGenerator depends on concrete implementations
import sqlite3
import smtplib
import json
import csv
import os
from datetime import datetime, timedelta
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from email.mime.base import MimeBase
from email import encoders

class ReportGenerator:
    
    def __init__(self):
        # ❌ Direct dependencies on concrete implementations
        self.database = SQLiteDatabase()
        self.email_service = SMTPEmailService()
        self.file_storage = LocalFileStorage()
        self.template_engine = JinjaTemplateEngine()
        self.logger = FileLogger()
        
    def generate_sales_report(self, start_date, end_date, report_format='pdf'):
        """Generate sales report for the given date range"""
        try:
            self.logger.log(f"Starting sales report generation: {start_date} to {end_date}")
            
            # Fetch sales data from database
            sales_data = self.database.get_sales_data(start_date, end_date)
            
            if not sales_data:
                self.logger.log("No sales data found for the specified period")
                return None
            
            # Calculate summary statistics
            summary = self._calculate_sales_summary(sales_data)
            
            # Generate report content
            report_data = {
                'start_date': start_date,
                'end_date': end_date,
                'sales_data': sales_data,
                'summary': summary,
                'generated_at': datetime.now()
            }
            
            # Generate report based on format
            if report_format == 'pdf':
                report_content = self.template_engine.render_pdf_template('sales_report.html', report_data)
                filename = f"sales_report_{start_date}_{end_date}.pdf"
            elif report_format == 'excel':
                report_content = self._generate_excel_report(report_data)
                filename = f"sales_report_{start_date}_{end_date}.xlsx"
            elif report_format == 'csv':
                report_content = self._generate_csv_report(sales_data)
                filename = f"sales_report_{start_date}_{end_date}.csv"
            else:
                raise ValueError(f"Unsupported report format: {report_format}")
            
            # Save report to storage
            file_path = self.file_storage.save_file(filename, report_content)
            
            self.logger.log(f"Sales report generated successfully: {file_path}")
            
            return {
                'file_path': file_path,
                'filename': filename,
                'format': report_format,
                'records_count': len(sales_data),
                'total_sales': summary['total_sales']
            }
            
        except Exception as e:
            self.logger.log(f"Error generating sales report: {str(e)}")
            raise
    
    def generate_customer_report(self, customer_id, include_orders=True):
        """Generate detailed customer report"""
        try:
            self.logger.log(f"Generating customer report for: {customer_id}")
            
            # Get customer data
            customer_data = self.database.get_customer_data(customer_id)
            if not customer_data:
                raise ValueError(f"Customer not found: {customer_id}")
            
            report_data = {
                'customer': customer_data,
                'generated_at': datetime.now()
            }
            
            if include_orders:
                # Get order history
                orders = self.database.get_customer_orders(customer_id)
                order_summary = self._calculate_customer_summary(orders)
                
                report_data['orders'] = orders
                report_data['order_summary'] = order_summary
            
            # Generate HTML report
            report_content = self.template_engine.render_html_template('customer_report.html', report_data)
            filename = f"customer_report_{customer_id}_{datetime.now().strftime('%Y%m%d')}.html"
            
            # Save report
            file_path = self.file_storage.save_file(filename, report_content)
            
            self.logger.log(f"Customer report generated: {file_path}")
            
            return {
                'file_path': file_path,
                'filename': filename,
                'customer_id': customer_id,
                'order_count': len(report_data.get('orders', []))
            }
            
        except Exception as e:
            self.logger.log(f"Error generating customer report: {str(e)}")
            raise
    
    def schedule_report(self, report_type, schedule_config, recipients):
        """Schedule a report to be generated and emailed periodically"""
        try:
            self.logger.log(f"Scheduling {report_type} report with config: {schedule_config}")
            
            # Calculate date range based on schedule
            if schedule_config['frequency'] == 'daily':
                start_date = datetime.now() - timedelta(days=1)
                end_date = datetime.now()
            elif schedule_config['frequency'] == 'weekly':
                start_date = datetime.now() - timedelta(weeks=1)
                end_date = datetime.now()
            elif schedule_config['frequency'] == 'monthly':
                start_date = datetime.now() - timedelta(days=30)
                end_date = datetime.now()
            else:
                raise ValueError(f"Unsupported frequency: {schedule_config['frequency']}")
            
            # Generate the report
            if report_type == 'sales':
                report_result = self.generate_sales_report(
                    start_date.strftime('%Y-%m-%d'),
                    end_date.strftime('%Y-%m-%d'),
                    schedule_config.get('format', 'pdf')
                )
            else:
                raise ValueError(f"Unsupported report type for scheduling: {report_type}")
            
            if report_result:
                # Email the report
                self.email_report(report_result, recipients, report_type)
                
                # Store scheduling information
                self.database.save_scheduled_report_run(report_type, schedule_config, report_result)
            
            self.logger.log(f"Scheduled report completed: {report_type}")
            
        except Exception as e:
            self.logger.log(f"Error in scheduled report: {str(e)}")
            raise
    
    def email_report(self, report_result, recipients, report_type):
        """Email a generated report to recipients"""
        try:
            self.logger.log(f"Emailing {report_type} report to {len(recipients)} recipients")
            
            # Read report file
            report_content = self.file_storage.read_file(report_result['file_path'])
            
            # Prepare email
            subject = f"{report_type.title()} Report - {datetime.now().strftime('%Y-%m-%d')}"
            body = f"Please find attached the {report_type} report generated on {datetime.now()}.\n\n"
            body += f"Report Details:\n"
            body += f"- Records: {report_result.get('records_count', 'N/A')}\n"
            body += f"- Format: {report_result['format']}\n"
            
            if 'total_sales' in report_result:
                body += f"- Total Sales: ${report_result['total_sales']:,.2f}\n"
            
            # Send email with attachment
            self.email_service.send_email_with_attachment(
                recipients,
                subject,
                body,
                report_result['filename'],
                report_content
            )
            
            self.logger.log(f"Report emailed successfully to {recipients}")
            
        except Exception as e:
            self.logger.log(f"Error emailing report: {str(e)}")
            raise
    
    def _calculate_sales_summary(self, sales_data):
        """Calculate summary statistics from sales data"""
        total_sales = sum(row['amount'] for row in sales_data)
        total_orders = len(sales_data)
        average_order_value = total_sales / total_orders if total_orders > 0 else 0
        
        # Group by product
        product_sales = {}
        for row in sales_data:
            product_id = row['product_id']
            if product_id not in product_sales:
                product_sales[product_id] = {'quantity': 0, 'revenue': 0}
            product_sales[product_id]['quantity'] += row['quantity']
            product_sales[product_id]['revenue'] += row['amount']
        
        # Find top products
        top_products = sorted(
            product_sales.items(),
            key=lambda x: x[1]['revenue'],
            reverse=True
        )[:5]
        
        return {
            'total_sales': total_sales,
            'total_orders': total_orders,
            'average_order_value': average_order_value,
            'top_products': top_products
        }
    
    def _calculate_customer_summary(self, orders):
        """Calculate customer order summary"""
        total_spent = sum(order['amount'] for order in orders)
        order_count = len(orders)
        average_order_value = total_spent / order_count if order_count > 0 else 0
        
        # Find date range
        if orders:
            order_dates = [datetime.strptime(order['order_date'], '%Y-%m-%d') for order in orders]
            first_order = min(order_dates)
            last_order = max(order_dates)
        else:
            first_order = last_order = None
        
        return {
            'total_spent': total_spent,
            'order_count': order_count,
            'average_order_value': average_order_value,
            'first_order_date': first_order,
            'last_order_date': last_order
        }
    
    def _generate_excel_report(self, report_data):
        """Generate Excel format report"""
        # Simplified - would use actual Excel library like openpyxl
        return f"Excel report data: {json.dumps(report_data, default=str)}"
    
    def _generate_csv_report(self, sales_data):
        """Generate CSV format report"""
        if not sales_data:
            return ""
        
        # Get headers from first row
        headers = list(sales_data[0].keys())
        
        output = []
        output.append(','.join(headers))
        
        for row in sales_data:
            csv_row = ','.join(str(row.get(header, '')) for header in headers)
            output.append(csv_row)
        
        return '\n'.join(output)

# ❌ Concrete implementations that ReportGenerator depends on directly
class SQLiteDatabase:
    
    def __init__(self):
        # ❌ Hard-coded database path and configuration
        self.db_path = '/var/data/reports.db'
        self.connection = None
        self._connect()
    
    def _connect(self):
        try:
            self.connection = sqlite3.connect(self.db_path)
            self.connection.row_factory = sqlite3.Row
        except Exception as e:
            raise Exception(f"Failed to connect to database: {e}")
    
    def get_sales_data(self, start_date, end_date):
        """Fetch sales data from database"""
        try:
            cursor = self.connection.cursor()
            query = """
                SELECT s.id, s.order_date, s.product_id, p.name as product_name,
                       s.quantity, s.unit_price, s.amount, s.customer_id
                FROM sales s
                JOIN products p ON s.product_id = p.id
                WHERE s.order_date BETWEEN ? AND ?
                ORDER BY s.order_date DESC
            """
            cursor.execute(query, (start_date, end_date))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
            
        except Exception as e:
            raise Exception(f"Failed to fetch sales data: {e}")
    
    def get_customer_data(self, customer_id):
        """Fetch customer information"""
        try:
            cursor = self.connection.cursor()
            query = "SELECT * FROM customers WHERE id = ?"
            cursor.execute(query, (customer_id,))
            
            row = cursor.fetchone()
            return dict(row) if row else None
            
        except Exception as e:
            raise Exception(f"Failed to fetch customer data: {e}")
    
    def get_customer_orders(self, customer_id):
        """Fetch customer order history"""
        try:
            cursor = self.connection.cursor()
            query = """
                SELECT o.id, o.order_date, o.amount, o.status,
                       COUNT(oi.id) as item_count
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.customer_id = ?
                GROUP BY o.id
                ORDER BY o.order_date DESC
            """
            cursor.execute(query, (customer_id,))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
            
        except Exception as e:
            raise Exception(f"Failed to fetch customer orders: {e}")
    
    def save_scheduled_report_run(self, report_type, config, result):
        """Save information about a scheduled report run"""
        try:
            cursor = self.connection.cursor()
            query = """
                INSERT INTO scheduled_report_runs 
                (report_type, config, result, run_date)
                VALUES (?, ?, ?, ?)
            """
            cursor.execute(query, (
                report_type,
                json.dumps(config),
                json.dumps(result, default=str),
                datetime.now().isoformat()
            ))
            self.connection.commit()
            
        except Exception as e:
            raise Exception(f"Failed to save scheduled report run: {e}")

class SMTPEmailService:
    
    def __init__(self):
        # ❌ Hard-coded SMTP configuration
        self.smtp_server = 'smtp.gmail.com'
        self.smtp_port = 587
        self.username = 'reports@company.com'
        self.password = 'email_password'
    
    def send_email_with_attachment(self, recipients, subject, body, attachment_filename, attachment_content):
        """Send email with file attachment"""
        try:
            # Create message
            msg = MimeMultipart()
            msg['From'] = self.username
            msg['To'] = ', '.join(recipients)
            msg['Subject'] = subject
            
            # Add body
            msg.attach(MimeText(body, 'plain'))
            
            # Add attachment
            part = MimeBase('application', 'octet-stream')
            part.set_payload(attachment_content)
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {attachment_filename}'
            )
            msg.attach(part)
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.username, self.password)
            server.send_message(msg)
            server.quit()
            
        except Exception as e:
            raise Exception(f"Failed to send email: {e}")

class LocalFileStorage:
    
    def __init__(self):
        # ❌ Hard-coded storage path
        self.base_path = '/var/reports/generated'
        os.makedirs(self.base_path, exist_ok=True)
    
    def save_file(self, filename, content):
        """Save file to local storage"""
        try:
            file_path = os.path.join(self.base_path, filename)
            
            if isinstance(content, str):
                mode = 'w'
            else:
                mode = 'wb'
            
            with open(file_path, mode) as f:
                f.write(content)
            
            return file_path
            
        except Exception as e:
            raise Exception(f"Failed to save file: {e}")
    
    def read_file(self, file_path):
        """Read file from storage"""
        try:
            with open(file_path, 'rb') as f:
                return f.read()
                
        except Exception as e:
            raise Exception(f"Failed to read file: {e}")
    
    def delete_file(self, file_path):
        """Delete file from storage"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
            
        except Exception as e:
            raise Exception(f"Failed to delete file: {e}")

class JinjaTemplateEngine:
    
    def __init__(self):
        # ❌ Hard-coded template path
        self.template_path = '/var/reports/templates'
    
    def render_html_template(self, template_name, data):
        """Render HTML template with data"""
        try:
            template_file = os.path.join(self.template_path, template_name)
            
            with open(template_file, 'r') as f:
                template_content = f.read()
            
            # Simplified template rendering - would use actual Jinja2
            rendered = template_content
            for key, value in data.items():
                placeholder = f"{{{{{key}}}}}"
                rendered = rendered.replace(placeholder, str(value))
            
            return rendered
            
        except Exception as e:
            raise Exception(f"Failed to render template: {e}")
    
    def render_pdf_template(self, template_name, data):
        """Render PDF template with data"""
        try:
            # First render HTML
            html_content = self.render_html_template(template_name, data)
            
            # Convert to PDF (simplified - would use actual PDF library)
            pdf_content = f"PDF version of:\n{html_content}"
            
            return pdf_content.encode('utf-8')
            
        except Exception as e:
            raise Exception(f"Failed to render PDF template: {e}")

class FileLogger:
    
    def __init__(self):
        # ❌ Hard-coded log file path
        self.log_file = '/var/log/reports.log'
    
    def log(self, message):
        """Write log message to file"""
        try:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            log_entry = f"[{timestamp}] {message}\n"
            
            with open(self.log_file, 'a') as f:
                f.write(log_entry)
                
        except Exception as e:
            # Fallback to console if file logging fails
            print(f"Logging failed: {e}")
            print(f"Original message: {message}")

# Client code that demonstrates the tightly coupled system
class ReportingService:
    
    def __init__(self):
        # ❌ Forced to use concrete ReportGenerator with all its dependencies
        self.report_generator = ReportGenerator()
    
    def generate_daily_sales_report(self):
        """Generate daily sales report"""
        today = datetime.now().strftime('%Y-%m-%d')
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        
        return self.report_generator.generate_sales_report(yesterday, today, 'pdf')
    
    def send_weekly_report_to_management(self):
        """Send weekly report to management team"""
        recipients = ['ceo@company.com', 'cfo@company.com', 'sales@company.com']
        
        schedule_config = {
            'frequency': 'weekly',
            'format': 'excel'
        }
        
        self.report_generator.schedule_report('sales', schedule_config, recipients)

# Demonstration of DIP violations
def demonstrate_dip_violations():
    """Show how the current design violates DIP"""
    
    # ❌ Cannot easily test - all dependencies are concrete
    reporting_service = ReportingService()
    
    try:
        # This will fail if database file doesn't exist
        result = reporting_service.generate_daily_sales_report()
        print(f"Report generated: {result}")
        
    except Exception as e:
        print(f"Report generation failed: {e}")
    
    # ❌ Cannot substitute different implementations
    # ❌ Cannot configure for different environments
    # ❌ Cannot mock dependencies for testing
    
    print("Current design issues:")
    print("1. Hard-coded file paths and database connections")
    print("2. Cannot substitute implementations for testing")
    print("3. Cannot configure for different environments")
    print("4. High-level ReportGenerator depends on low-level implementations")
    print("5. Difficult to extend with new storage or email providers")

if __name__ == "__main__":
    demonstrate_dip_violations()
```

### Your Task
Refactor this report generation system to follow the Dependency Inversion Principle.

### Requirements
- [ ] **Create stable abstractions** - define interfaces for all external dependencies
- [ ] **Invert the dependencies** - make ReportGenerator depend on abstractions
- [ ] **Apply dependency injection** - inject all dependencies via constructor
- [ ] **Externalize configuration** - remove hard-coded paths and settings
- [ ] **Enable multiple implementations** - allow different implementations for different environments
- [ ] **Improve testability** - make the system easily testable with mock implementations

### DIP Violations to Address
1. **Concrete dependencies**: ReportGenerator directly instantiates all dependencies
2. **Hard-coded configuration**: File paths, database connections, email settings embedded
3. **Implementation details**: High-level policy mixed with low-level implementation
4. **Testing difficulty**: Cannot substitute dependencies for testing
5. **Environment coupling**: Cannot adapt to different deployment environments

### Focus Areas
- Database abstraction design
- File storage abstraction
- Email service abstraction
- Template engine abstraction
- Configuration management
- Dependency injection container

---

## Problem 3: Authentication System

### Current Code (C#)
```csharp
// ❌ Violates DIP - AuthenticationService depends on concrete implementations
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;

public class AuthenticationService
{
    // ❌ Direct dependencies on concrete implementations
    private readonly SqlServerUserRepository userRepository;
    private readonly BCryptPasswordHasher passwordHasher;
    private readonly JwtTokenManager tokenManager;
    private readonly MemoryCacheProvider cacheProvider;
    private readonly EmailVerificationService emailService;
    private readonly SmsVerificationService smsService;
    private readonly FileAuditLogger auditLogger;
    private readonly LdapDirectoryService directoryService;
    
    public AuthenticationService()
    {
        // ❌ Hard-coded instantiation of all dependencies
        this.userRepository = new SqlServerUserRepository();
        this.passwordHasher = new BCryptPasswordHasher();
        this.tokenManager = new JwtTokenManager();
        this.cacheProvider = new MemoryCacheProvider();
        this.emailService = new EmailVerificationService();
        this.smsService = new SmsVerificationService();
        this.auditLogger = new FileAuditLogger();
        this.directoryService = new LdapDirectoryService();
    }
    
    public async Task<AuthenticationResult> AuthenticateAsync(string username, string password, AuthenticationOptions options = null)
    {
        try
        {
            auditLogger.LogAuthenticationAttempt(username, "password");
            
            // Try different authentication methods based on configuration
            if (options?.UseLdap == true)
            {
                return await AuthenticateWithLdap(username, password);
            }
            else
            {
                return await AuthenticateWithLocalDatabase(username, password);
            }
        }
        catch (Exception ex)
        {
            auditLogger.LogAuthenticationError(username, ex.Message);
            return AuthenticationResult.Failure("Authentication failed");
        }
    }
    
    private async Task<AuthenticationResult> AuthenticateWithLocalDatabase(string username, string password)
    {
        // Check cache first
        string cacheKey = $"user:{username}";
        User cachedUser = cacheProvider.Get<User>(cacheKey);
        
        User user;
        if (cachedUser != null)
        {
            user = cachedUser;
        }
        else
        {
            user = await userRepository.GetUserByUsernameAsync(username);
            if (user == null)
            {
                auditLogger.LogAuthenticationFailure(username, "User not found");
                return AuthenticationResult.Failure("Invalid credentials");
            }
            
            // Cache user for 5 minutes
            cacheProvider.Set(cacheKey, user, TimeSpan.FromMinutes(5));
        }
        
        // Verify password
        if (!passwordHasher.VerifyPassword(password, user.PasswordHash))
        {
            auditLogger.LogAuthenticationFailure(username, "Invalid password");
            await HandleFailedLogin(user);
            return AuthenticationResult.Failure("Invalid credentials");
        }
        
        // Check if account is locked
        if (user.IsLocked)
        {
            auditLogger.LogAuthenticationFailure(username, "Account locked");
            return AuthenticationResult.Failure("Account is locked");
        }
        
        // Check if two-factor authentication is required
        if (user.TwoFactorEnabled)
        {
            string verificationCode = GenerateVerificationCode();
            
            if (user.PreferredVerificationMethod == "email")
            {
                await emailService.SendVerificationCodeAsync(user.Email, verificationCode);
            }
            else if (user.PreferredVerificationMethod == "sms")
            {
                await smsService.SendVerificationCodeAsync(user.PhoneNumber, verificationCode);
            }
            
            // Store verification code temporarily
            string verificationKey = $"verification:{user.Id}";
            cacheProvider.Set(verificationKey, verificationCode, TimeSpan.FromMinutes(5));
            
            auditLogger.LogTwoFactorChallenge(username);
            
            return AuthenticationResult.TwoFactorRequired(user.Id, user.PreferredVerificationMethod);
        }
        
        // Successful authentication
        await HandleSuccessfulLogin(user);
        
        string token = tokenManager.GenerateToken(user);
        auditLogger.LogAuthenticationSuccess(username);
        
        return AuthenticationResult.Success(token, user);
    }
    
    private async Task<AuthenticationResult> AuthenticateWithLdap(string username, string password)
    {
        bool isValidLdapUser = await directoryService.ValidateCredentialsAsync(username, password);
        
        if (!isValidLdapUser)
        {
            auditLogger.LogAuthenticationFailure(username, "LDAP authentication failed");
            return AuthenticationResult.Failure("Invalid credentials");
        }
        
        // Get or create local user record
        User user = await userRepository.GetUserByUsernameAsync(username);
        if (user == null)
        {
            // Create user from LDAP data
            var ldapUserInfo = await directoryService.GetUserInfoAsync(username);
            user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Username = username,
                Email = ldapUserInfo.Email,
                FullName = ldapUserInfo.FullName,
                IsLdapUser = true,
                CreatedAt = DateTime.UtcNow
            };
            
            await userRepository.CreateUserAsync(user);
        }
        
        await HandleSuccessfulLogin(user);
        
        string token = tokenManager.GenerateToken(user);
        auditLogger.LogAuthenticationSuccess(username);
        
        return AuthenticationResult.Success(token, user);
    }
    
    public async Task<bool> VerifyTwoFactorCodeAsync(string userId, string code)
    {
        try
        {
            auditLogger.LogTwoFactorVerificationAttempt(userId);
            
            string verificationKey = $"verification:{userId}";
            string storedCode = cacheProvider.Get<string>(verificationKey);
            
            if (storedCode == null)
            {
                auditLogger.LogTwoFactorVerificationFailure(userId, "Code expired");
                return false;
            }
            
            if (storedCode != code)
            {
                auditLogger.LogTwoFactorVerificationFailure(userId, "Invalid code");
                return false;
            }
            
            // Remove used code
            cacheProvider.Remove(verificationKey);
            
            auditLogger.LogTwoFactorVerificationSuccess(userId);
            return true;
        }
        catch (Exception ex)
        {
            auditLogger.LogTwoFactorVerificationError(userId, ex.Message);
            return false;
        }
    }
    
    public async Task<bool> RegisterUserAsync(UserRegistrationRequest request)
    {
        try
        {
            auditLogger.LogUserRegistrationAttempt(request.Username);
            
            // Check if user already exists
            var existingUser = await userRepository.GetUserByUsernameAsync(request.Username);
            if (existingUser != null)
            {
                auditLogger.LogUserRegistrationFailure(request.Username, "User already exists");
                return false;
            }
            
            // Hash password
            string passwordHash = passwordHasher.HashPassword(request.Password);
            
            // Create user
            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                FullName = request.FullName,
                CreatedAt = DateTime.UtcNow,
                EmailVerified = false
            };
            
            await userRepository.CreateUserAsync(user);
            
            // Send email verification
            string verificationToken = tokenManager.GenerateEmailVerificationToken(user);
            await emailService.SendEmailVerificationAsync(user.Email, verificationToken);
            
            auditLogger.LogUserRegistrationSuccess(request.Username);
            return true;
        }
        catch (Exception ex)
        {
            auditLogger.LogUserRegistrationError(request.Username, ex.Message);
            return false;
        }
    }
    
    public async Task<bool> ResetPasswordAsync(string email)
    {
        try
        {
            auditLogger.LogPasswordResetRequest(email);
            
            var user = await userRepository.GetUserByEmailAsync(email);
            if (user == null)
            {
                // Don't reveal whether email exists
                auditLogger.LogPasswordResetFailure(email, "User not found");
                return true; // Return true to not reveal user existence
            }
            
            string resetToken = tokenManager.GeneratePasswordResetToken(user);
            await emailService.SendPasswordResetAsync(user.Email, resetToken);
            
            auditLogger.LogPasswordResetSuccess(email);
            return true;
        }
        catch (Exception ex)
        {
            auditLogger.LogPasswordResetError(email, ex.Message);
            return false;
        }
    }
    
    public async Task<bool> ValidateTokenAsync(string token)
    {
        try
        {
            return tokenManager.ValidateToken(token);
        }
        catch (Exception ex)
        {
            auditLogger.LogTokenValidationError(token, ex.Message);
            return false;
        }
    }
    
    private async Task HandleSuccessfulLogin(User user)
    {
        user.LastLoginAt = DateTime.UtcNow;
        user.FailedLoginAttempts = 0;
        user.IsLocked = false;
        
        await userRepository.UpdateUserAsync(user);
        
        // Clear cache to ensure fresh data on next access
        string cacheKey = $"user:{user.Username}";
        cacheProvider.Remove(cacheKey);
    }
    
    private async Task HandleFailedLogin(User user)
    {
        user.FailedLoginAttempts++;
        
        // Lock account after 5 failed attempts
        if (user.FailedLoginAttempts >= 5)
        {
            user.IsLocked = true;
            user.LockedAt = DateTime.UtcNow;
            
            // Send security notification
            await emailService.SendAccountLockedNotificationAsync(user.Email);
        }
        
        await userRepository.UpdateUserAsync(user);
        
        // Clear cache
        string cacheKey = $"user:{user.Username}";
        cacheProvider.Remove(cacheKey);
    }
    
    private string GenerateVerificationCode()
    {
        using (var rng = RandomNumberGenerator.Create())
        {
            byte[] bytes = new byte[4];
            rng.GetBytes(bytes);
            int code = Math.Abs(BitConverter.ToInt32(bytes, 0)) % 1000000;
            return code.ToString("D6");
        }
    }
}

// ❌ Concrete implementations that AuthenticationService depends on directly
public class SqlServerUserRepository
{
    private readonly string connectionString;
    
    public SqlServerUserRepository()
    {
        // ❌ Hard-coded connection string
        this.connectionString = "Server=localhost;Database=AuthDB;Trusted_Connection=true;";
    }
    
    public async Task<User> GetUserByUsernameAsync(string username)
    {
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        
        string sql = "SELECT * FROM Users WHERE Username = @username";
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@username", username);
        
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapUserFromReader(reader);
        }
        
        return null;
    }
    
    public async Task<User> GetUserByEmailAsync(string email)
    {
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        
        string sql = "SELECT * FROM Users WHERE Email = @email";
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@email", email);
        
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapUserFromReader(reader);
        }
        
        return null;
    }
    
    public async Task CreateUserAsync(User user)
    {
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        
        string sql = @"INSERT INTO Users 
            (Id, Username, Email, PasswordHash, FullName, CreatedAt, EmailVerified, IsLdapUser) 
            VALUES (@id, @username, @email, @passwordHash, @fullName, @createdAt, @emailVerified, @isLdapUser)";
        
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", user.Id);
        command.Parameters.AddWithValue("@username", user.Username);
        command.Parameters.AddWithValue("@email", user.Email);
        command.Parameters.AddWithValue("@passwordHash", user.PasswordHash ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@fullName", user.FullName);
        command.Parameters.AddWithValue("@createdAt", user.CreatedAt);
        command.Parameters.AddWithValue("@emailVerified", user.EmailVerified);
        command.Parameters.AddWithValue("@isLdapUser", user.IsLdapUser);
        
        await command.ExecuteNonQueryAsync();
    }
    
    public async Task UpdateUserAsync(User user)
    {
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        
        string sql = @"UPDATE Users SET 
            LastLoginAt = @lastLoginAt,
            FailedLoginAttempts = @failedLoginAttempts,
            IsLocked = @isLocked,
            LockedAt = @lockedAt
            WHERE Id = @id";
        
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@lastLoginAt", user.LastLoginAt ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@failedLoginAttempts", user.FailedLoginAttempts);
        command.Parameters.AddWithValue("@isLocked", user.IsLocked);
        command.Parameters.AddWithValue("@lockedAt", user.LockedAt ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@id", user.Id);
        
        await command.ExecuteNonQueryAsync();
    }
    
    private User MapUserFromReader(SqlDataReader reader)
    {
        return new User
        {
            Id = reader["Id"].ToString(),
            Username = reader["Username"].ToString(),
            Email = reader["Email"].ToString(),
            PasswordHash = reader["PasswordHash"] as string,
            FullName = reader["FullName"].ToString(),
            CreatedAt = (DateTime)reader["CreatedAt"],
            LastLoginAt = reader["LastLoginAt"] as DateTime?,
            FailedLoginAttempts = (int)reader["FailedLoginAttempts"],
            IsLocked = (bool)reader["IsLocked"],
            LockedAt = reader["LockedAt"] as DateTime?,
            EmailVerified = (bool)reader["EmailVerified"],
            IsLdapUser = (bool)reader["IsLdapUser"],
            TwoFactorEnabled = (bool)reader["TwoFactorEnabled"],
            PreferredVerificationMethod = reader["PreferredVerificationMethod"] as string,
            PhoneNumber = reader["PhoneNumber"] as string
        };
    }
}

public class BCryptPasswordHasher
{
    public string HashPassword(string password)
    {
        // ❌ Hard-coded BCrypt implementation
        return BCrypt.Net.BCrypt.HashPassword(password, 12);
    }
    
    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}

public class JwtTokenManager
{
    private readonly string secretKey;
    
    public JwtTokenManager()
    {
        // ❌ Hard-coded JWT secret
        this.secretKey = "MySecretKeyThatShouldBeInConfiguration123!";
    }
    
    public string GenerateToken(User user)
    {
        // Simplified JWT generation - would use actual JWT library
        var tokenData = $"{user.Id}|{user.Username}|{DateTime.UtcNow.AddHours(24).Ticks}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenData));
    }
    
    public string GenerateEmailVerificationToken(User user)
    {
        var tokenData = $"email_verify|{user.Id}|{DateTime.UtcNow.AddDays(1).Ticks}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenData));
    }
    
    public string GeneratePasswordResetToken(User user)
    {
        var tokenData = $"password_reset|{user.Id}|{DateTime.UtcNow.AddHours(1).Ticks}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenData));
    }
    
    public bool ValidateToken(string token)
    {
        try
        {
            var tokenData = Encoding.UTF8.GetString(Convert.FromBase64String(token));
            var parts = tokenData.Split('|');
            
            if (parts.Length >= 3)
            {
                var expiry = new DateTime(long.Parse(parts[2]));
                return DateTime.UtcNow < expiry;
            }
            
            return false;
        }
        catch
        {
            return false;
        }
    }
}

// More concrete implementations...
public class MemoryCacheProvider
{
    private readonly MemoryCache cache = new MemoryCache(new MemoryCacheOptions());
    
    public T Get<T>(string key) => cache.Get<T>(key);
    
    public void Set<T>(string key, T value, TimeSpan expiration)
    {
        cache.Set(key, value, expiration);
    }
    
    public void Remove(string key) => cache.Remove(key);
}

public class EmailVerificationService
{
    private readonly HttpClient httpClient = new HttpClient();
    
    public async Task SendVerificationCodeAsync(string email, string code)
    {
        // ❌ Hard-coded email service API
        var emailData = new
        {
            to = email,
            subject = "Verification Code",
            body = $"Your verification code is: {code}"
        };
        
        // Simplified email sending
        await Task.Delay(100); // Simulate API call
    }
    
    public async Task SendEmailVerificationAsync(string email, string token)
    {
        // ❌ Hard-coded verification URL
        var verificationUrl = $"https://myapp.com/verify-email?token={token}";
        
        var emailData = new
        {
            to = email,
            subject = "Email Verification",
            body = $"Click here to verify your email: {verificationUrl}"
        };
        
        await Task.Delay(100); // Simulate API call
    }
    
    public async Task SendPasswordResetAsync(string email, string token)
    {
        // ❌ Hard-coded reset URL
        var resetUrl = $"https://myapp.com/reset-password?token={token}";
        
        var emailData = new
        {
            to = email,
            subject = "Password Reset",
            body = $"Click here to reset your password: {resetUrl}"
        };
        
        await Task.Delay(100); // Simulate API call
    }
    
    public async Task SendAccountLockedNotificationAsync(string email)
    {
        var emailData = new
        {
            to = email,
            subject = "Account Locked",
            body = "Your account has been locked due to multiple failed login attempts."
        };
        
        await Task.Delay(100); // Simulate API call
    }
}

// Additional concrete implementations for SMS, LDAP, audit logging...
// (Similar implementations with hard-coded dependencies)

// Supporting classes
public class User
{
    public string Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string FullName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int FailedLoginAttempts { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? LockedAt { get; set; }
    public bool EmailVerified { get; set; }
    public bool IsLdapUser { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public string PreferredVerificationMethod { get; set; }
    public string PhoneNumber { get; set; }
}

public class AuthenticationResult
{
    public bool IsSuccessful { get; set; }
    public string Token { get; set; }
    public User User { get; set; }
    public string ErrorMessage { get; set; }
    public bool RequiresTwoFactor { get; set; }
    public string UserId { get; set; }
    public string VerificationMethod { get; set; }
    
    public static AuthenticationResult Success(string token, User user) => 
        new AuthenticationResult { IsSuccessful = true, Token = token, User = user };
    
    public static AuthenticationResult Failure(string error) => 
        new AuthenticationResult { IsSuccessful = false, ErrorMessage = error };
    
    public static AuthenticationResult TwoFactorRequired(string userId, string method) => 
        new AuthenticationResult { RequiresTwoFactor = true, UserId = userId, VerificationMethod = method };
}

public class AuthenticationOptions
{
    public bool UseLdap { get; set; }
}

public class UserRegistrationRequest
{
    public string Username { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string FullName { get; set; }
}
```

### Your Task
Refactor this authentication system to follow the Dependency Inversion Principle.

### Requirements
- [ ] **Define stable abstractions** - create interfaces for all external dependencies
- [ ] **Invert the dependencies** - make AuthenticationService depend on abstractions
- [ ] **Apply dependency injection** - inject all dependencies via constructor
- [ ] **Remove hard-coded configuration** - externalize all configuration values
- [ ] **Enable multiple implementations** - support different authentication providers
- [ ] **Improve testability** - make the system easily unit testable

### DIP Violations to Address
1. **Concrete dependencies**: AuthenticationService creates all its dependencies
2. **Hard-coded configuration**: Connection strings, API keys, URLs embedded in code
3. **Implementation coupling**: High-level authentication logic mixed with low-level details
4. **Provider coupling**: Cannot easily switch between different providers
5. **Testing difficulty**: Cannot mock dependencies for unit testing

### Focus Areas
- Repository abstraction design
- Authentication provider abstractions
- Notification service abstractions
- Caching abstraction
- Token management abstraction
- Configuration dependency injection

---

## 🏆 Success Criteria

For each DIP exercise, demonstrate:

### Dependency Structure
- **Stable Abstractions**: High-level modules depend on stable interfaces
- **Inverted Dependencies**: Low-level modules implement high-level interfaces
- **Configuration Externalization**: No hard-coded configuration in business logic
- **Loose Coupling**: Changes to implementations don't affect high-level policy

### Testability
- **Unit Testable**: All business logic can be tested with mock dependencies
- **Fast Tests**: Tests don't depend on external systems (databases, APIs, files)
- **Isolated Tests**: Each component can be tested independently
- **Deterministic Tests**: Tests produce consistent results

### Flexibility
- **Multiple Implementations**: Can easily swap implementations
- **Environment Adaptation**: Same code works in different environments
- **Provider Choice**: Can choose different providers for different needs
- **Extension Points**: New implementations can be added without modification

---

## 💡 DIP Implementation Patterns

### **Interface-Based Abstractions**
```java
// ✅ Stable abstractions
interface OrderRepository {
    Order save(Order order);
    Order findById(String id);
    List<Order> findByCustomerId(String customerId);
}

interface PaymentProcessor {
    PaymentResult process(PaymentRequest request);
    RefundResult refund(RefundRequest request);
}

interface NotificationService {
    void sendOrderConfirmation(String email, String orderId, BigDecimal amount);
    void sendOrderCancellation(String email, String orderId);
}

// ✅ High-level module depends on abstractions
class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentProcessor paymentProcessor;
    private final NotificationService notificationService;
    
    public OrderService(OrderRepository orderRepository,
                       PaymentProcessor paymentProcessor,
                       NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.paymentProcessor = paymentProcessor;
        this.notificationService = notificationService;
    }
    
    // Business logic only - no implementation details
}
```

### **Configuration Injection**
```java
// ✅ Configuration as dependencies
interface DatabaseConfiguration {
    String getConnectionString();
    int getMaxConnections();
    int getTimeoutSeconds();
}

interface EmailConfiguration {
    String getSmtpServer();
    int getSmtpPort();
    String getUsername();
    String getPassword();
}

// ✅ Implementations depend on configuration abstractions
class SqlOrderRepository implements OrderRepository {
    private final DatabaseConfiguration config;
    
    public SqlOrderRepository(DatabaseConfiguration config) {
        this.config = config;
    }
    
    // Use config.getConnectionString() instead of hard-coded values
}
```

### **IoC Container Usage**
```java
// ✅ Dependency injection container configuration
public class ApplicationModule {
    
    @Bean
    public OrderRepository orderRepository(DatabaseConfiguration dbConfig) {
        return new SqlOrderRepository(dbConfig);
    }
    
    @Bean
    public PaymentProcessor paymentProcessor(PaymentConfiguration paymentConfig) {
        return new StripePaymentProcessor(paymentConfig);
    }
    
    @Bean
    public NotificationService notificationService(EmailConfiguration emailConfig) {
        return new EmailNotificationService(emailConfig);
    }
    
    @Bean
    public OrderService orderService(OrderRepository orderRepo,
                                   PaymentProcessor paymentProc,
                                   NotificationService notificationSvc) {
        return new OrderService(orderRepo, paymentProc, notificationSvc);
    }
}
```

### **Factory Pattern for Complex Creation**
```java
// ✅ Factory for complex dependency creation
interface AuthenticationProviderFactory {
    AuthenticationProvider createProvider(AuthenticationMethod method);
}

class DefaultAuthenticationProviderFactory implements AuthenticationProviderFactory {
    private final DatabaseConfiguration dbConfig;
    private final LdapConfiguration ldapConfig;
    
    public DefaultAuthenticationProviderFactory(DatabaseConfiguration dbConfig,
                                               LdapConfiguration ldapConfig) {
        this.dbConfig = dbConfig;
        this.ldapConfig = ldapConfig;
    }
    
    @Override
    public AuthenticationProvider createProvider(AuthenticationMethod method) {
        switch (method) {
            case DATABASE:
                return new DatabaseAuthenticationProvider(dbConfig);
            case LDAP:
                return new LdapAuthenticationProvider(ldapConfig);
            default:
                throw new UnsupportedOperationException("Unsupported method: " + method);
        }
    }
}
```

---

## 🎯 Self-Assessment

After completing each DIP exercise:

### **Dependency Structure (1-5 scale)**
- [ ] **Stable Abstractions**: High-level modules depend on well-designed interfaces
- [ ] **Inverted Dependencies**: Low-level modules implement high-level abstractions
- [ ] **Configuration Externalization**: No hard-coded configuration in business logic
- [ ] **Loose Coupling**: Implementation changes don't affect business logic

### **Testability and Flexibility (1-5 scale)**
- [ ] **Unit Testability**: Can test business logic with mock dependencies
- [ ] **Implementation Swapping**: Can easily substitute different implementations
- [ ] **Environment Adaptation**: Same code works in different environments
- [ ] **Extension Support**: New implementations can be added easily

**Target**: All scores should be 4 or 5, representing mastery of DIP.

---

## 🚀 Congratulations!

You've completed the comprehensive SOLID principles exercise series! You now have mastery of:

1. **Single Responsibility Principle (SRP)** - Classes with focused, single purposes
2. **Open/Closed Principle (OCP)** - Extensible designs that don't require modification
3. **Liskov Substitution Principle (LSP)** - Proper inheritance and substitutability
4. **Interface Segregation Principle (ISP)** - Focused, client-specific interfaces
5. **Dependency Inversion Principle (DIP)** - Stable abstractions and dependency injection

### **Your SOLID Design Toolkit Now Includes:**
- **Responsibility-driven design** for maintainable classes
- **Extensible architectures** that adapt to changing requirements
- **Proper inheritance hierarchies** that support polymorphism
- **Focused interfaces** that prevent unnecessary dependencies
- **Loosely coupled systems** that are easy to test and modify

### **Next Steps in Your Clean Code Journey:**
1. **Apply SOLID principles daily** - Make them your default design approach
2. **Review existing code** - Identify and refactor SOLID violations
3. **Move to [Systems and Architecture](../10-systems/README.md)** - Apply these principles at system scale
4. **Become a design mentor** - Help others learn these crucial principles

**You've mastered the foundation of object-oriented design - congratulations!** 🎉
