// ❌ BEFORE: Monolithic Order System
// This represents a typical "Big Ball of Mud" architecture where all concerns are mixed together

import java.sql.*;
import java.util.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import javax.servlet.http.*;
import javax.mail.*;
import javax.mail.internet.*;
import com.stripe.Stripe;
import com.stripe.model.Charge;
import com.stripe.param.ChargeCreateParams;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    // ❌ PROBLEM 1: Direct database dependency
    private Connection dbConnection;
    
    // ❌ PROBLEM 2: Hard-coded configuration
    private static final String DB_URL = "jdbc:mysql://localhost:3306/ecommerce";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "password";
    private static final String STRIPE_SECRET_KEY = "sk_test_abc123";
    private static final String SMTP_HOST = "smtp.gmail.com";
    private static final String SMTP_USER = "orders@company.com";
    private static final String SMTP_PASSWORD = "email_password";
    
    public OrderController() {
        try {
            // ❌ PROBLEM 3: Infrastructure setup in constructor
            this.dbConnection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
            Stripe.apiKey = STRIPE_SECRET_KEY;
        } catch (SQLException e) {
            throw new RuntimeException("Failed to connect to database", e);
        }
    }
    
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestBody Map<String, Object> orderData,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // ❌ PROBLEM 4: HTTP concerns mixed with business logic
            String customerEmail = (String) orderData.get("customerEmail");
            String customerId = (String) orderData.get("customerId");
            List<Map<String, Object>> items = (List<Map<String, Object>>) orderData.get("items");
            String paymentToken = (String) orderData.get("paymentToken");
            Map<String, Object> shippingAddress = (Map<String, Object>) orderData.get("shippingAddress");
            
            // ❌ PROBLEM 5: Input validation mixed with business logic
            if (customerEmail == null || customerEmail.trim().isEmpty()) {
                response.put("error", "Customer email is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (items == null || items.isEmpty()) {
                response.put("error", "Order must contain at least one item");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (paymentToken == null || paymentToken.trim().isEmpty()) {
                response.put("error", "Payment token is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // ❌ PROBLEM 6: Business logic mixed with data access
            BigDecimal totalAmount = BigDecimal.ZERO;
            List<String> unavailableItems = new ArrayList<>();
            
            // Check inventory and calculate total
            for (Map<String, Object> item : items) {
                String productId = (String) item.get("productId");
                Integer quantity = (Integer) item.get("quantity");
                
                // Direct database query in controller
                PreparedStatement stmt = dbConnection.prepareStatement(
                    "SELECT name, price, stock_quantity FROM products WHERE id = ?"
                );
                stmt.setString(1, productId);
                ResultSet rs = stmt.executeQuery();
                
                if (!rs.next()) {
                    unavailableItems.add("Product " + productId + " not found");
                    continue;
                }
                
                String productName = rs.getString("name");
                BigDecimal price = rs.getBigDecimal("price");
                Integer stockQuantity = rs.getInt("stock_quantity");
                
                if (stockQuantity < quantity) {
                    unavailableItems.add("Insufficient stock for " + productName + 
                                       ". Available: " + stockQuantity + ", Requested: " + quantity);
                    continue;
                }
                
                totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(quantity)));
                
                rs.close();
                stmt.close();
            }
            
            if (!unavailableItems.isEmpty()) {
                response.put("error", "Items unavailable");
                response.put("details", unavailableItems);
                return ResponseEntity.badRequest().body(response);
            }
            
            // ❌ PROBLEM 7: Payment processing mixed with order logic
            // Process payment with Stripe
            ChargeCreateParams chargeParams = ChargeCreateParams.builder()
                .setAmount((long) (totalAmount.doubleValue() * 100)) // Convert to cents
                .setCurrency("usd")
                .setSource(paymentToken)
                .setDescription("Order payment for " + customerEmail)
                .build();
            
            Charge charge = Charge.create(chargeParams);
            
            if (!"succeeded".equals(charge.getStatus())) {
                response.put("error", "Payment failed");
                response.put("paymentError", charge.getFailureMessage());
                return ResponseEntity.badRequest().body(response);
            }
            
            String paymentId = charge.getId();
            
            // ❌ PROBLEM 8: Transaction management scattered
            dbConnection.setAutoCommit(false);
            
            try {
                // Create order record
                String orderId = "ORD-" + System.currentTimeMillis();
                PreparedStatement orderStmt = dbConnection.prepareStatement(
                    "INSERT INTO orders (id, customer_id, customer_email, total_amount, payment_id, " +
                    "status, created_at, shipping_street, shipping_city, shipping_state, shipping_zip) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                );
                
                orderStmt.setString(1, orderId);
                orderStmt.setString(2, customerId);
                orderStmt.setString(3, customerEmail);
                orderStmt.setBigDecimal(4, totalAmount);
                orderStmt.setString(5, paymentId);
                orderStmt.setString(6, "CONFIRMED");
                orderStmt.setTimestamp(7, Timestamp.valueOf(LocalDateTime.now()));
                orderStmt.setString(8, (String) shippingAddress.get("street"));
                orderStmt.setString(9, (String) shippingAddress.get("city"));
                orderStmt.setString(10, (String) shippingAddress.get("state"));
                orderStmt.setString(11, (String) shippingAddress.get("zipCode"));
                
                orderStmt.executeUpdate();
                orderStmt.close();
                
                // Create order items and update inventory
                for (Map<String, Object> item : items) {
                    String productId = (String) item.get("productId");
                    Integer quantity = (Integer) item.get("quantity");
                    
                    // Get product price
                    PreparedStatement priceStmt = dbConnection.prepareStatement(
                        "SELECT price FROM products WHERE id = ?"
                    );
                    priceStmt.setString(1, productId);
                    ResultSet priceRs = priceStmt.executeQuery();
                    priceRs.next();
                    BigDecimal unitPrice = priceRs.getBigDecimal("price");
                    priceRs.close();
                    priceStmt.close();
                    
                    // Insert order item
                    PreparedStatement itemStmt = dbConnection.prepareStatement(
                        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)"
                    );
                    itemStmt.setString(1, orderId);
                    itemStmt.setString(2, productId);
                    itemStmt.setInt(3, quantity);
                    itemStmt.setBigDecimal(4, unitPrice);
                    itemStmt.executeUpdate();
                    itemStmt.close();
                    
                    // Update inventory
                    PreparedStatement inventoryStmt = dbConnection.prepareStatement(
                        "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?"
                    );
                    inventoryStmt.setInt(1, quantity);
                    inventoryStmt.setString(2, productId);
                    inventoryStmt.executeUpdate();
                    inventoryStmt.close();
                }
                
                dbConnection.commit();
                
                // ❌ PROBLEM 9: Email sending mixed with order creation
                sendOrderConfirmationEmail(customerEmail, orderId, totalAmount, items);
                
                // ❌ PROBLEM 10: HTTP response formatting mixed with business logic
                response.put("success", true);
                response.put("orderId", orderId);
                response.put("totalAmount", totalAmount);
                response.put("paymentId", paymentId);
                response.put("message", "Order created successfully");
                
                return ResponseEntity.ok(response);
                
            } catch (Exception e) {
                dbConnection.rollback();
                throw e;
            } finally {
                dbConnection.setAutoCommit(true);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Internal server error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @GetMapping("/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrder(@PathVariable String orderId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // ❌ PROBLEM 11: Query logic in controller
            PreparedStatement stmt = dbConnection.prepareStatement(
                "SELECT o.*, GROUP_CONCAT(CONCAT(oi.product_id, ':', oi.quantity, ':', oi.unit_price)) as items " +
                "FROM orders o " +
                "LEFT JOIN order_items oi ON o.id = oi.order_id " +
                "WHERE o.id = ? " +
                "GROUP BY o.id"
            );
            stmt.setString(1, orderId);
            ResultSet rs = stmt.executeQuery();
            
            if (!rs.next()) {
                response.put("error", "Order not found");
                return ResponseEntity.notFound().build();
            }
            
            // ❌ PROBLEM 12: Data mapping in controller
            Map<String, Object> order = new HashMap<>();
            order.put("id", rs.getString("id"));
            order.put("customerId", rs.getString("customer_id"));
            order.put("customerEmail", rs.getString("customer_email"));
            order.put("totalAmount", rs.getBigDecimal("total_amount"));
            order.put("status", rs.getString("status"));
            order.put("createdAt", rs.getTimestamp("created_at"));
            order.put("paymentId", rs.getString("payment_id"));
            
            Map<String, Object> shippingAddress = new HashMap<>();
            shippingAddress.put("street", rs.getString("shipping_street"));
            shippingAddress.put("city", rs.getString("shipping_city"));
            shippingAddress.put("state", rs.getString("shipping_state"));
            shippingAddress.put("zipCode", rs.getString("shipping_zip"));
            order.put("shippingAddress", shippingAddress);
            
            // Parse items
            String itemsString = rs.getString("items");
            List<Map<String, Object>> items = new ArrayList<>();
            if (itemsString != null) {
                for (String itemString : itemsString.split(",")) {
                    String[] parts = itemString.split(":");
                    Map<String, Object> item = new HashMap<>();
                    item.put("productId", parts[0]);
                    item.put("quantity", Integer.parseInt(parts[1]));
                    item.put("unitPrice", new BigDecimal(parts[2]));
                    items.add(item);
                }
            }
            order.put("items", items);
            
            response.put("order", order);
            rs.close();
            stmt.close();
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Internal server error");
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(@PathVariable String orderId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // ❌ PROBLEM 13: Business logic scattered across endpoints
            PreparedStatement orderStmt = dbConnection.prepareStatement(
                "SELECT * FROM orders WHERE id = ?"
            );
            orderStmt.setString(1, orderId);
            ResultSet orderRs = orderStmt.executeQuery();
            
            if (!orderRs.next()) {
                response.put("error", "Order not found");
                return ResponseEntity.notFound().build();
            }
            
            String status = orderRs.getString("status");
            String paymentId = orderRs.getString("payment_id");
            String customerEmail = orderRs.getString("customer_email");
            BigDecimal totalAmount = orderRs.getBigDecimal("total_amount");
            
            if ("CANCELLED".equals(status)) {
                response.put("error", "Order already cancelled");
                return ResponseEntity.badRequest().body(response);
            }
            
            if ("SHIPPED".equals(status) || "DELIVERED".equals(status)) {
                response.put("error", "Cannot cancel shipped or delivered order");
                return ResponseEntity.badRequest().body(response);
            }
            
            orderRs.close();
            orderStmt.close();
            
            dbConnection.setAutoCommit(false);
            
            try {
                // ❌ PROBLEM 14: Refund logic mixed with order cancellation
                // Process refund with Stripe
                Charge charge = Charge.retrieve(paymentId);
                charge.refund();
                
                // Update order status
                PreparedStatement updateStmt = dbConnection.prepareStatement(
                    "UPDATE orders SET status = 'CANCELLED' WHERE id = ?"
                );
                updateStmt.setString(1, orderId);
                updateStmt.executeUpdate();
                updateStmt.close();
                
                // Restore inventory
                PreparedStatement itemsStmt = dbConnection.prepareStatement(
                    "SELECT product_id, quantity FROM order_items WHERE order_id = ?"
                );
                itemsStmt.setString(1, orderId);
                ResultSet itemsRs = itemsStmt.executeQuery();
                
                while (itemsRs.next()) {
                    String productId = itemsRs.getString("product_id");
                    Integer quantity = itemsRs.getInt("quantity");
                    
                    PreparedStatement restoreStmt = dbConnection.prepareStatement(
                        "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?"
                    );
                    restoreStmt.setInt(1, quantity);
                    restoreStmt.setString(2, productId);
                    restoreStmt.executeUpdate();
                    restoreStmt.close();
                }
                
                itemsRs.close();
                itemsStmt.close();
                
                dbConnection.commit();
                
                // Send cancellation email
                sendOrderCancellationEmail(customerEmail, orderId);
                
                response.put("success", true);
                response.put("message", "Order cancelled successfully");
                return ResponseEntity.ok(response);
                
            } catch (Exception e) {
                dbConnection.rollback();
                throw e;
            } finally {
                dbConnection.setAutoCommit(true);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Internal server error");
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // ❌ PROBLEM 15: Email functionality in the same class
    private void sendOrderConfirmationEmail(String customerEmail, String orderId, 
                                          BigDecimal totalAmount, List<Map<String, Object>> items) {
        try {
            Properties props = new Properties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.host", SMTP_HOST);
            props.put("mail.smtp.port", "587");
            
            Session session = Session.getInstance(props, new Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(SMTP_USER, SMTP_PASSWORD);
                }
            });
            
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SMTP_USER));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(customerEmail));
            message.setSubject("Order Confirmation - " + orderId);
            
            StringBuilder emailBody = new StringBuilder();
            emailBody.append("Dear Customer,\n\n");
            emailBody.append("Your order has been confirmed!\n\n");
            emailBody.append("Order ID: ").append(orderId).append("\n");
            emailBody.append("Total Amount: $").append(totalAmount).append("\n\n");
            emailBody.append("Items:\n");
            
            for (Map<String, Object> item : items) {
                emailBody.append("- Product: ").append(item.get("productId"))
                         .append(", Quantity: ").append(item.get("quantity")).append("\n");
            }
            
            emailBody.append("\nThank you for your business!\n");
            
            message.setText(emailBody.toString());
            Transport.send(message);
            
        } catch (Exception e) {
            System.err.println("Failed to send confirmation email: " + e.getMessage());
        }
    }
    
    private void sendOrderCancellationEmail(String customerEmail, String orderId) {
        try {
            Properties props = new Properties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.host", SMTP_HOST);
            props.put("mail.smtp.port", "587");
            
            Session session = Session.getInstance(props, new Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(SMTP_USER, SMTP_PASSWORD);
                }
            });
            
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SMTP_USER));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(customerEmail));
            message.setSubject("Order Cancellation - " + orderId);
            
            String emailBody = "Dear Customer,\n\n" +
                             "Your order " + orderId + " has been cancelled as requested.\n" +
                             "A full refund will be processed within 3-5 business days.\n\n" +
                             "Thank you for your understanding.\n";
            
            message.setText(emailBody);
            Transport.send(message);
            
        } catch (Exception e) {
            System.err.println("Failed to send cancellation email: " + e.getMessage());
        }
    }
}

/* 
❌ PROBLEMS SUMMARY:

1. MIXED CONCERNS: HTTP, business logic, database, payments, and email all in one class
2. HARD-CODED DEPENDENCIES: Database URLs, API keys, email credentials embedded
3. NO SEPARATION OF LAYERS: All logic in the controller layer
4. DIFFICULT TO TEST: Requires database, payment service, and email service
5. TIGHT COUPLING: Changes to any external service require controller changes
6. POOR ERROR HANDLING: Generic catch-all exception handling
7. NO DOMAIN MODEL: Business rules scattered throughout procedural code
8. INFLEXIBLE: Cannot easily change databases, payment providers, or notification methods
9. VIOLATION OF SRP: Single class has multiple reasons to change
10. VIOLATION OF OCP: Must modify class to extend functionality
11. VIOLATION OF DIP: Depends on concrete implementations, not abstractions
12. POOR SCALABILITY: Monolithic structure prevents independent scaling
13. MAINTENANCE NIGHTMARE: Bugs in one area can affect the entire system
14. CODE DUPLICATION: Similar patterns repeated across different endpoints
15. NO ABSTRACTION: Business concepts not modeled as domain objects

This represents a typical "Big Ball of Mud" architecture that many systems evolve into 
without proper architectural discipline.
*/
