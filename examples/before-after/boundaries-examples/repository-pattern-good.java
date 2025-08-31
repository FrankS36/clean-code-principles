// ✅ GOOD: Clean separation with Repository pattern
// Benefits: Testable, maintainable, flexible data access

import java.time.LocalDateTime;
import java.util.Optional;

// Pure business logic - no database knowledge
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final AuditService auditService;
    private final PasswordHasher passwordHasher;

    public UserService(UserRepository userRepository, 
                      EmailService emailService,
                      AuditService auditService,
                      PasswordHasher passwordHasher) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.auditService = auditService;
        this.passwordHasher = passwordHasher;
    }

    public User registerUser(String email, String password, String firstName, String lastName) {
        // Pure business logic - easy to understand and test
        
        // Business validation
        validateRegistrationInput(email, password, firstName, lastName);
        
        // Check business rule: unique email
        if (userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("User already exists with email: " + email);
        }

        // Create domain object with business logic
        User user = User.create(
            generateUserId(),
            email,
            passwordHasher.hash(password),
            firstName,
            lastName
        );

        // Persist through repository
        User savedUser = userRepository.save(user);
        
        // Send welcome email (business rule)
        emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getFirstName());
        
        // Audit the business event
        auditService.logUserCreated(savedUser.getId(), savedUser.getEmail());
        
        return savedUser;
    }

    public Optional<User> findUserById(String userId) {
        // Simple delegation to repository
        return userRepository.findById(userId);
    }

    public User updateUserProfile(String userId, String displayName, String bio) {
        // Business logic focused on domain rules
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        // Business validation
        validateProfileUpdate(displayName, bio);
        
        // Update through domain object
        user.updateProfile(displayName, bio);
        
        // Save and audit
        User updatedUser = userRepository.save(user);
        auditService.logProfileUpdated(userId);
        
        return updatedUser;
    }

    // Private helper methods for business logic
    private void validateRegistrationInput(String email, String password, String firstName, String lastName) {
        if (email == null || !email.contains("@")) {
            throw new InvalidInputException("Invalid email format");
        }
        if (password == null || password.length() < 8) {
            throw new InvalidInputException("Password must be at least 8 characters");
        }
        if (firstName == null || firstName.trim().isEmpty()) {
            throw new InvalidInputException("First name is required");
        }
        if (lastName == null || lastName.trim().isEmpty()) {
            throw new InvalidInputException("Last name is required");
        }
    }

    private void validateProfileUpdate(String displayName, String bio) {
        if (displayName != null && displayName.length() > 100) {
            throw new InvalidInputException("Display name too long (max 100 characters)");
        }
        if (bio != null && bio.length() > 500) {
            throw new InvalidInputException("Bio too long (max 500 characters)");
        }
    }

    private String generateUserId() {
        return java.util.UUID.randomUUID().toString();
    }
}

// Domain model - pure business object
public class User {
    private final String id;
    private final String email;
    private final String passwordHash;
    private final String firstName;
    private final String lastName;
    private final LocalDateTime createdAt;
    private final UserStatus status;
    private UserProfile profile;

    // Private constructor enforces creation through factory method
    private User(String id, String email, String passwordHash, String firstName, 
                String lastName, LocalDateTime createdAt, UserStatus status, UserProfile profile) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.firstName = firstName;
        this.lastName = lastName;
        this.createdAt = createdAt;
        this.status = status;
        this.profile = profile;
    }

    // Factory method with business logic
    public static User create(String id, String email, String passwordHash, 
                             String firstName, String lastName) {
        UserProfile defaultProfile = UserProfile.createDefault(firstName + " " + lastName);
        return new User(id, email, passwordHash, firstName, lastName, 
                       LocalDateTime.now(), UserStatus.ACTIVE, defaultProfile);
    }

    // Reconstruction from persistence (used by repository)
    public static User reconstruct(String id, String email, String passwordHash, 
                                  String firstName, String lastName, LocalDateTime createdAt, 
                                  UserStatus status, UserProfile profile) {
        return new User(id, email, passwordHash, firstName, lastName, createdAt, status, profile);
    }

    // Business behavior
    public void updateProfile(String displayName, String bio) {
        this.profile = this.profile.update(displayName, bio);
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    // Getters (immutable)
    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public UserStatus getStatus() { return status; }
    public UserProfile getProfile() { return profile; }
}

// Value object for user profile
public class UserProfile {
    private final String displayName;
    private final String bio;
    private final String avatarUrl;

    private UserProfile(String displayName, String bio, String avatarUrl) {
        this.displayName = displayName;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
    }

    public static UserProfile createDefault(String displayName) {
        return new UserProfile(displayName, "", null);
    }

    public static UserProfile create(String displayName, String bio, String avatarUrl) {
        return new UserProfile(displayName, bio, avatarUrl);
    }

    public UserProfile update(String newDisplayName, String newBio) {
        return new UserProfile(
            newDisplayName != null ? newDisplayName : this.displayName,
            newBio != null ? newBio : this.bio,
            this.avatarUrl
        );
    }

    // Getters
    public String getDisplayName() { return displayName; }
    public String getBio() { return bio; }
    public String getAvatarUrl() { return avatarUrl; }
}

// Repository interface - defines what business logic needs
public interface UserRepository {
    User save(User user);
    Optional<User> findById(String id);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    void deleteById(String id);
}

// Other service interfaces
public interface EmailService {
    void sendWelcomeEmail(String email, String firstName);
}

public interface AuditService {
    void logUserCreated(String userId, String email);
    void logProfileUpdated(String userId);
}

public interface PasswordHasher {
    String hash(String password);
    boolean verify(String password, String hash);
}

// Database implementation of repository (separate from business logic)
public class DatabaseUserRepository implements UserRepository {
    private final DataSource dataSource;

    public DatabaseUserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public User save(User user) {
        // Implementation handles SQL, transactions, mapping
        // This is where all the database complexity lives
        try (Connection conn = dataSource.getConnection()) {
            // Start transaction
            conn.setAutoCommit(false);
            
            try {
                // Check if user exists
                if (userExists(conn, user.getId())) {
                    updateUser(conn, user);
                } else {
                    insertUser(conn, user);
                }
                
                // Save profile
                saveUserProfile(conn, user);
                
                // Commit transaction
                conn.commit();
                return user;
                
            } catch (Exception e) {
                conn.rollback();
                throw new RepositoryException("Failed to save user", e);
            }
        } catch (Exception e) {
            throw new RepositoryException("Database error", e);
        }
    }

    @Override
    public Optional<User> findById(String id) {
        // SQL query implementation
        String query = """
            SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, 
                   u.created_at, u.status, p.display_name, p.bio, p.avatar_url
            FROM users u 
            LEFT JOIN user_profiles p ON u.id = p.user_id 
            WHERE u.id = ?
            """;
            
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, id);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return Optional.of(mapToUser(rs));
            }
            return Optional.empty();
            
        } catch (Exception e) {
            throw new RepositoryException("Failed to find user", e);
        }
    }

    @Override
    public boolean existsByEmail(String email) {
        String query = "SELECT COUNT(*) FROM users WHERE email = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();
            rs.next();
            return rs.getInt(1) > 0;
            
        } catch (Exception e) {
            throw new RepositoryException("Failed to check email existence", e);
        }
    }

    // Private methods handle database mapping complexity
    private User mapToUser(ResultSet rs) throws Exception {
        UserProfile profile = UserProfile.create(
            rs.getString("display_name"),
            rs.getString("bio"),
            rs.getString("avatar_url")
        );
        
        return User.reconstruct(
            rs.getString("id"),
            rs.getString("email"),
            rs.getString("password_hash"),
            rs.getString("first_name"),
            rs.getString("last_name"),
            rs.getTimestamp("created_at").toLocalDateTime(),
            UserStatus.valueOf(rs.getString("status")),
            profile
        );
    }

    // Other private methods for SQL operations...
    private boolean userExists(Connection conn, String id) throws Exception { /* ... */ return false; }
    private void insertUser(Connection conn, User user) throws Exception { /* ... */ }
    private void updateUser(Connection conn, User user) throws Exception { /* ... */ }
    private void saveUserProfile(Connection conn, User user) throws Exception { /* ... */ }
}

// Domain enums
public enum UserStatus {
    ACTIVE, INACTIVE, SUSPENDED
}

// Domain exceptions
public class UserAlreadyExistsException extends RuntimeException {
    public UserAlreadyExistsException(String message) { super(message); }
}

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) { super(message); }
}

public class InvalidInputException extends RuntimeException {
    public InvalidInputException(String message) { super(message); }
}

public class RepositoryException extends RuntimeException {
    public RepositoryException(String message, Throwable cause) { super(message, cause); }
}

// Mock DataSource interface
interface DataSource {
    Connection getConnection() throws Exception;
}

interface Connection {
    PreparedStatement prepareStatement(String sql) throws Exception;
    void setAutoCommit(boolean autoCommit) throws Exception;
    void commit() throws Exception;
    void rollback() throws Exception;
}

interface PreparedStatement {
    void setString(int parameterIndex, String value) throws Exception;
    ResultSet executeQuery() throws Exception;
    int executeUpdate() throws Exception;
}

interface ResultSet {
    boolean next() throws Exception;
    String getString(String columnLabel) throws Exception;
    int getInt(String columnLabel) throws Exception;
    java.sql.Timestamp getTimestamp(String columnLabel) throws Exception;
}

/* 
Benefits of this approach:
1. ✅ Business logic pure and testable
2. ✅ Database concerns isolated in repository
3. ✅ Easy to mock repository for unit tests
4. ✅ Can change database implementation without affecting business logic
5. ✅ Transaction management handled in repository
6. ✅ Consistent error handling
7. ✅ Domain objects have behavior, not just data
8. ✅ Clear separation of concerns
9. ✅ Single Responsibility Principle maintained
10. ✅ Database schema changes don't affect business logic
*/
