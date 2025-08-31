// ❌ BAD: Business logic mixed with database concerns
// Problems: Tight coupling, hard to test, database details everywhere

import java.sql.*;
import java.util.*;

public class UserService {
    private Connection connection;
    private String databaseUrl = "jdbc:postgresql://localhost:5432/myapp";
    
    public UserService() {
        try {
            // Database connection logic in business service
            this.connection = DriverManager.getConnection(
                databaseUrl, 
                System.getenv("DB_USER"), 
                System.getenv("DB_PASSWORD")
            );
        } catch (SQLException e) {
            throw new RuntimeException("Database connection failed", e);
        }
    }

    public User registerUser(String email, String password, String firstName, String lastName) {
        // Business logic mixed with SQL and database handling
        
        // Check if user exists - raw SQL in business logic
        String checkQuery = "SELECT COUNT(*) FROM users WHERE email = ?";
        try (PreparedStatement stmt = connection.prepareStatement(checkQuery)) {
            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();
            rs.next();
            if (rs.getInt(1) > 0) {
                throw new IllegalArgumentException("User already exists with email: " + email);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error checking user existence", e);
        }

        // Validate business rules
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email format");
        }
        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }

        // Hash password - business logic
        String hashedPassword = hashPassword(password);
        
        // Generate user ID - more business logic mixed with DB concerns
        String userId = UUID.randomUUID().toString();
        
        // Insert user - raw SQL in business method
        String insertQuery = """
            INSERT INTO users (id, email, password_hash, first_name, last_name, 
                             created_at, updated_at, status) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 'ACTIVE')
            """;
            
        try (PreparedStatement stmt = connection.prepareStatement(insertQuery)) {
            stmt.setString(1, userId);
            stmt.setString(2, email);
            stmt.setString(3, hashedPassword);
            stmt.setString(4, firstName);
            stmt.setString(5, lastName);
            
            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected == 0) {
                throw new RuntimeException("Failed to create user");
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error creating user", e);
        }

        // Create user profile - more SQL in business logic
        String profileQuery = """
            INSERT INTO user_profiles (user_id, display_name, bio, avatar_url) 
            VALUES (?, ?, ?, ?)
            """;
            
        try (PreparedStatement stmt = connection.prepareStatement(profileQuery)) {
            stmt.setString(1, userId);
            stmt.setString(2, firstName + " " + lastName);
            stmt.setString(3, ""); // Empty bio
            stmt.setString(4, null); // No avatar
            stmt.executeUpdate();
        } catch (SQLException e) {
            // Inconsistent error handling
            System.err.println("Warning: Failed to create user profile: " + e.getMessage());
        }

        // Send welcome email - business logic
        sendWelcomeEmail(email, firstName);
        
        // Log user creation - more SQL
        String logQuery = "INSERT INTO audit_log (action, user_id, timestamp, details) VALUES (?, ?, NOW(), ?)";
        try (PreparedStatement stmt = connection.prepareStatement(logQuery)) {
            stmt.setString(1, "USER_CREATED");
            stmt.setString(2, userId);
            stmt.setString(3, "User registered with email: " + email);
            stmt.executeUpdate();
        } catch (SQLException e) {
            // Different error handling again
            e.printStackTrace();
        }

        // Return user object - need to query database again
        return getUserById(userId);
    }

    public User getUserById(String userId) {
        // More raw SQL in business method
        String query = """
            SELECT u.id, u.email, u.first_name, u.last_name, u.created_at, u.status,
                   p.display_name, p.bio, p.avatar_url
            FROM users u 
            LEFT JOIN user_profiles p ON u.id = p.user_id 
            WHERE u.id = ?
            """;
            
        try (PreparedStatement stmt = connection.prepareStatement(query)) {
            stmt.setString(1, userId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                // Manual object mapping in business logic
                User user = new User();
                user.setId(rs.getString("id"));
                user.setEmail(rs.getString("email"));
                user.setFirstName(rs.getString("first_name"));
                user.setLastName(rs.getString("last_name"));
                user.setCreatedAt(rs.getTimestamp("created_at"));
                user.setStatus(UserStatus.valueOf(rs.getString("status")));
                
                // Profile mapping
                UserProfile profile = new UserProfile();
                profile.setDisplayName(rs.getString("display_name"));
                profile.setBio(rs.getString("bio"));
                profile.setAvatarUrl(rs.getString("avatar_url"));
                user.setProfile(profile);
                
                return user;
            } else {
                return null;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error retrieving user", e);
        }
    }

    public void updateUserProfile(String userId, String displayName, String bio) {
        // Even more SQL in what should be business logic
        
        // Check if user exists
        if (getUserById(userId) == null) {
            throw new IllegalArgumentException("User not found: " + userId);
        }

        // Business validation
        if (displayName != null && displayName.length() > 100) {
            throw new IllegalArgumentException("Display name too long");
        }

        String updateQuery = """
            UPDATE user_profiles 
            SET display_name = ?, bio = ?, updated_at = NOW() 
            WHERE user_id = ?
            """;
            
        try (PreparedStatement stmt = connection.prepareStatement(updateQuery)) {
            stmt.setString(1, displayName);
            stmt.setString(2, bio);
            stmt.setString(3, userId);
            
            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected == 0) {
                // Upsert logic mixed in business method
                String insertQuery = """
                    INSERT INTO user_profiles (user_id, display_name, bio, created_at, updated_at) 
                    VALUES (?, ?, ?, NOW(), NOW())
                    """;
                try (PreparedStatement insertStmt = connection.prepareStatement(insertQuery)) {
                    insertStmt.setString(1, userId);
                    insertStmt.setString(2, displayName);
                    insertStmt.setString(3, bio);
                    insertStmt.executeUpdate();
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error updating user profile", e);
        }

        // More audit logging
        String logQuery = "INSERT INTO audit_log (action, user_id, timestamp, details) VALUES (?, ?, NOW(), ?)";
        try (PreparedStatement stmt = connection.prepareStatement(logQuery)) {
            stmt.setString(1, "PROFILE_UPDATED");
            stmt.setString(2, userId);
            stmt.setString(3, "Profile updated for user: " + userId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace(); // Inconsistent error handling
        }
    }

    private String hashPassword(String password) {
        // Simplified password hashing
        return "hashed_" + password;
    }

    private void sendWelcomeEmail(String email, String firstName) {
        // Email sending logic would be here
        System.out.println("Sending welcome email to: " + email);
    }
}

// Domain models mixed with persistence concerns
class User {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private Timestamp createdAt;
    private UserStatus status;
    private UserProfile profile;
    
    // Getters and setters...
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }
    public UserProfile getProfile() { return profile; }
    public void setProfile(UserProfile profile) { this.profile = profile; }
}

class UserProfile {
    private String displayName;
    private String bio;
    private String avatarUrl;
    
    // Getters and setters...
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}

enum UserStatus {
    ACTIVE, INACTIVE, SUSPENDED
}

/* 
Problems with this approach:
1. ❌ Business logic tightly coupled to database structure
2. ❌ Impossible to unit test without a real database
3. ❌ SQL queries scattered throughout business methods
4. ❌ Database connection management in business service
5. ❌ Manual object mapping mixed with business logic
6. ❌ Inconsistent error handling
7. ❌ No transaction management
8. ❌ Hard to change database or add caching
9. ❌ Violates Single Responsibility Principle
10. ❌ Database schema changes require business logic changes
*/
