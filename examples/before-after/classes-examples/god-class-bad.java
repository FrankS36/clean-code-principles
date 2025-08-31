// ❌ BAD: God class that violates Single Responsibility Principle
// Problems: Multiple responsibilities, hard to test, difficult to maintain

import java.util.*;
import java.sql.*;
import java.time.LocalDateTime;
import java.security.MessageDigest;
import javax.mail.*;
import javax.mail.internet.*;

/**
 * User management class that does EVERYTHING
 * This violates SRP because it has multiple reasons to change:
 * 1. User data structure changes
 * 2. Validation rules change
 * 3. Database schema changes
 * 4. Email system changes
 * 5. Password policy changes
 * 6. Logging format changes
 */
public class UserManager {
    private Connection dbConnection;
    private Properties emailProperties;
    
    public UserManager() {
        try {
            // Database connection setup - Responsibility 1: Database connectivity
            dbConnection = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/users", 
                "username", 
                "password"
            );
            
            // Email configuration - Responsibility 2: Email configuration
            emailProperties = new Properties();
            emailProperties.put("mail.smtp.host", "smtp.gmail.com");
            emailProperties.put("mail.smtp.port", "587");
            emailProperties.put("mail.smtp.auth", "true");
            emailProperties.put("mail.smtp.starttls.enable", "true");
            
        } catch (SQLException e) {
            throw new RuntimeException("Database connection failed", e);
        }
    }
    
    // Responsibility 3: User creation and management
    public boolean createUser(String email, String password, String firstName, String lastName) {
        try {
            // Responsibility 4: Input validation
            if (!isValidEmail(email)) {
                logError("Invalid email format: " + email);
                return false;
            }
            
            if (!isValidPassword(password)) {
                logError("Password does not meet requirements");
                return false;
            }
            
            if (firstName == null || firstName.trim().isEmpty()) {
                logError("First name is required");
                return false;
            }
            
            if (lastName == null || lastName.trim().isEmpty()) {
                logError("Last name is required");
                return false;
            }
            
            // Responsibility 5: Check for existing users
            if (userExists(email)) {
                logError("User already exists with email: " + email);
                return false;
            }
            
            // Responsibility 6: Password hashing
            String hashedPassword = hashPassword(password);
            
            // Responsibility 7: Database operations
            String sql = "INSERT INTO users (email, password_hash, first_name, last_name, created_at, active) VALUES (?, ?, ?, ?, ?, ?)";
            PreparedStatement stmt = dbConnection.prepareStatement(sql);
            stmt.setString(1, email);
            stmt.setString(2, hashedPassword);
            stmt.setString(3, firstName);
            stmt.setString(4, lastName);
            stmt.setTimestamp(5, Timestamp.valueOf(LocalDateTime.now()));
            stmt.setBoolean(6, true);
            
            int rowsAffected = stmt.executeUpdate();
            
            if (rowsAffected > 0) {
                // Responsibility 8: Email notifications
                sendWelcomeEmail(email, firstName);
                
                // Responsibility 9: Logging
                logInfo("User created successfully: " + email);
                
                // Responsibility 10: Analytics tracking
                trackUserRegistration(email);
                
                return true;
            } else {
                logError("Failed to create user: " + email);
                return false;
            }
            
        } catch (Exception e) {
            logError("Error creating user: " + e.getMessage());
            return false;
        }
    }
    
    // Responsibility 11: User authentication
    public User authenticateUser(String email, String password) {
        try {
            String sql = "SELECT id, email, password_hash, first_name, last_name, active FROM users WHERE email = ?";
            PreparedStatement stmt = dbConnection.prepareStatement(sql);
            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                String storedHash = rs.getString("password_hash");
                if (verifyPassword(password, storedHash)) {
                    User user = new User();
                    user.setId(rs.getLong("id"));
                    user.setEmail(rs.getString("email"));
                    user.setFirstName(rs.getString("first_name"));
                    user.setLastName(rs.getString("last_name"));
                    user.setActive(rs.getBoolean("active"));
                    
                    // Update last login
                    updateLastLogin(user.getId());
                    
                    logInfo("User authenticated successfully: " + email);
                    return user;
                }
            }
            
            logError("Authentication failed for user: " + email);
            return null;
            
        } catch (SQLException e) {
            logError("Database error during authentication: " + e.getMessage());
            return null;
        }
    }
    
    // Responsibility 12: User updates
    public boolean updateUser(long userId, String firstName, String lastName) {
        try {
            String sql = "UPDATE users SET first_name = ?, last_name = ?, updated_at = ? WHERE id = ?";
            PreparedStatement stmt = dbConnection.prepareStatement(sql);
            stmt.setString(1, firstName);
            stmt.setString(2, lastName);
            stmt.setTimestamp(3, Timestamp.valueOf(LocalDateTime.now()));
            stmt.setLong(4, userId);
            
            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                logInfo("User updated successfully: " + userId);
                return true;
            } else {
                logError("Failed to update user: " + userId);
                return false;
            }
            
        } catch (SQLException e) {
            logError("Database error during user update: " + e.getMessage());
            return false;
        }
    }
    
    // Responsibility 13: Password management
    public boolean changePassword(long userId, String oldPassword, String newPassword) {
        try {
            // Get current password
            String sql = "SELECT password_hash FROM users WHERE id = ?";
            PreparedStatement stmt = dbConnection.prepareStatement(sql);
            stmt.setLong(1, userId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                String currentHash = rs.getString("password_hash");
                if (!verifyPassword(oldPassword, currentHash)) {
                    logError("Old password verification failed for user: " + userId);
                    return false;
                }
                
                if (!isValidPassword(newPassword)) {
                    logError("New password does not meet requirements");
                    return false;
                }
                
                String newHash = hashPassword(newPassword);
                
                // Update password
                String updateSql = "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?";
                PreparedStatement updateStmt = dbConnection.prepareStatement(updateSql);
                updateStmt.setString(1, newHash);
                updateStmt.setTimestamp(2, Timestamp.valueOf(LocalDateTime.now()));
                updateStmt.setLong(3, userId);
                
                int rowsAffected = updateStmt.executeUpdate();
                if (rowsAffected > 0) {
                    logInfo("Password changed successfully for user: " + userId);
                    return true;
                }
            }
            
            return false;
            
        } catch (SQLException e) {
            logError("Database error during password change: " + e.getMessage());
            return false;
        }
    }
    
    // Responsibility 14: Email validation
    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }
    
    // Responsibility 15: Password validation
    private boolean isValidPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;
        
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            if (Character.isLowerCase(c)) hasLower = true;
            if (Character.isDigit(c)) hasDigit = true;
            if ("!@#$%^&*()_+".indexOf(c) >= 0) hasSpecial = true;
        }
        
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
    
    // Responsibility 16: Password hashing
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
            throw new RuntimeException("Password hashing failed", e);
        }
    }
    
    // Responsibility 17: Password verification
    private boolean verifyPassword(String password, String hash) {
        return hashPassword(password).equals(hash);
    }
    
    // Responsibility 18: User existence checking
    private boolean userExists(String email) throws SQLException {
        String sql = "SELECT COUNT(*) FROM users WHERE email = ?";
        PreparedStatement stmt = dbConnection.prepareStatement(sql);
        stmt.setString(1, email);
        ResultSet rs = stmt.executeQuery();
        rs.next();
        return rs.getInt(1) > 0;
    }
    
    // Responsibility 19: Last login tracking
    private void updateLastLogin(long userId) {
        try {
            String sql = "UPDATE users SET last_login = ? WHERE id = ?";
            PreparedStatement stmt = dbConnection.prepareStatement(sql);
            stmt.setTimestamp(1, Timestamp.valueOf(LocalDateTime.now()));
            stmt.setLong(2, userId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            logError("Failed to update last login: " + e.getMessage());
        }
    }
    
    // Responsibility 20: Email sending
    private void sendWelcomeEmail(String email, String firstName) {
        try {
            Session session = Session.getInstance(emailProperties, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication("your-email@gmail.com", "your-password");
                }
            });
            
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress("noreply@company.com"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(email));
            message.setSubject("Welcome to Our Service!");
            message.setText("Hello " + firstName + ",\n\nWelcome to our service!");
            
            Transport.send(message);
            logInfo("Welcome email sent to: " + email);
            
        } catch (MessagingException e) {
            logError("Failed to send welcome email: " + e.getMessage());
        }
    }
    
    // Responsibility 21: Logging
    private void logInfo(String message) {
        System.out.println("[INFO] " + LocalDateTime.now() + ": " + message);
    }
    
    private void logError(String message) {
        System.err.println("[ERROR] " + LocalDateTime.now() + ": " + message);
    }
    
    // Responsibility 22: Analytics tracking
    private void trackUserRegistration(String email) {
        // Send analytics data to third-party service
        try {
            // Simulate analytics API call
            System.out.println("Tracking user registration: " + email);
        } catch (Exception e) {
            logError("Failed to track user registration: " + e.getMessage());
        }
    }
    
    // Responsibility 23: Resource cleanup
    public void cleanup() {
        try {
            if (dbConnection != null && !dbConnection.isClosed()) {
                dbConnection.close();
            }
        } catch (SQLException e) {
            logError("Error closing database connection: " + e.getMessage());
        }
    }
}

// Simple user data class
class User {
    private long id;
    private String email;
    private String firstName;
    private String lastName;
    private boolean active;
    
    // Getters and setters
    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}

/* 
Problems with this God class approach:
1. ❌ Violates SRP - has 23+ different responsibilities
2. ❌ Hard to test - requires database, email server, etc.
3. ❌ Tightly coupled - changes in one area affect others
4. ❌ Hard to maintain - too much code in one place
5. ❌ Hard to reuse - can't use parts independently
6. ❌ Hard to extend - adding features means modifying this class
7. ❌ Poor error handling - exceptions mix different concerns
8. ❌ Configuration mixed with logic
9. ❌ No separation of concerns
10. ❌ Difficult to mock for testing
11. ❌ Single point of failure
12. ❌ Violates Open/Closed Principle
13. ❌ Makes dependency management impossible
14. ❌ Creates a maintenance nightmare
15. ❌ Team development conflicts (everyone editing same file)
*/
