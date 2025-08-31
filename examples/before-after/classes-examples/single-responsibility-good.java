// ✅ GOOD: Single Responsibility Principle applied correctly
// Benefits: Each class has one reason to change, easy to test, maintainable

import java.time.LocalDateTime;
import java.util.Optional;

// Domain model - represents user data
public class User {
    private final UserId id;
    private final Email email;
    private final Name firstName;
    private final Name lastName;
    private final LocalDateTime createdAt;
    private final boolean active;
    private final LocalDateTime lastLogin;
    
    private User(UserId id, Email email, Name firstName, Name lastName, 
                LocalDateTime createdAt, boolean active, LocalDateTime lastLogin) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.createdAt = createdAt;
        this.active = active;
        this.lastLogin = lastLogin;
    }
    
    // Factory method for creating new users
    public static User create(Email email, Name firstName, Name lastName) {
        return new User(
            UserId.generate(),
            email,
            firstName,
            lastName,
            LocalDateTime.now(),
            true,
            null
        );
    }
    
    // Factory method for reconstructing from persistence
    public static User reconstruct(UserId id, Email email, Name firstName, Name lastName,
                                  LocalDateTime createdAt, boolean active, LocalDateTime lastLogin) {
        return new User(id, email, firstName, lastName, createdAt, active, lastLogin);
    }
    
    // Business behavior
    public User recordLogin() {
        return new User(id, email, firstName, lastName, createdAt, active, LocalDateTime.now());
    }
    
    public User updateName(Name firstName, Name lastName) {
        return new User(id, email, firstName, lastName, createdAt, active, lastLogin);
    }
    
    public User deactivate() {
        return new User(id, email, firstName, lastName, createdAt, false, lastLogin);
    }
    
    // Getters (immutable)
    public UserId getId() { return id; }
    public Email getEmail() { return email; }
    public Name getFirstName() { return firstName; }
    public Name getLastName() { return lastName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isActive() { return active; }
    public LocalDateTime getLastLogin() { return lastLogin; }
}

// Value objects with validation
public class Email {
    private final String value;
    
    private Email(String value) {
        this.value = value;
    }
    
    public static Email of(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Invalid email format");
        }
        
        return new Email(email.toLowerCase().trim());
    }
    
    public String getValue() { return value; }
    
    @Override
    public boolean equals(Object obj) {
        return obj instanceof Email && ((Email) obj).value.equals(this.value);
    }
    
    @Override
    public int hashCode() { return value.hashCode(); }
    
    @Override
    public String toString() { return value; }
}

public class Name {
    private final String value;
    
    private Name(String value) {
        this.value = value;
    }
    
    public static Name of(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        
        if (name.trim().length() > 50) {
            throw new IllegalArgumentException("Name cannot exceed 50 characters");
        }
        
        return new Name(name.trim());
    }
    
    public String getValue() { return value; }
    
    @Override
    public boolean equals(Object obj) {
        return obj instanceof Name && ((Name) obj).value.equals(this.value);
    }
    
    @Override
    public int hashCode() { return value.hashCode(); }
    
    @Override
    public String toString() { return value; }
}

public class UserId {
    private final String value;
    
    private UserId(String value) {
        this.value = value;
    }
    
    public static UserId generate() {
        return new UserId(java.util.UUID.randomUUID().toString());
    }
    
    public static UserId of(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be empty");
        }
        return new UserId(id);
    }
    
    public String getValue() { return value; }
    
    @Override
    public boolean equals(Object obj) {
        return obj instanceof UserId && ((UserId) obj).value.equals(this.value);
    }
    
    @Override
    public int hashCode() { return value.hashCode(); }
    
    @Override
    public String toString() { return value; }
}

// Password value object with hashing responsibility
public class Password {
    private final String hashedValue;
    
    private Password(String hashedValue) {
        this.hashedValue = hashedValue;
    }
    
    public static Password fromPlaintext(String plaintext) {
        validatePasswordStrength(plaintext);
        return new Password(hashPassword(plaintext));
    }
    
    public static Password fromHash(String hashedValue) {
        return new Password(hashedValue);
    }
    
    public boolean matches(String plaintext) {
        return hashPassword(plaintext).equals(hashedValue);
    }
    
    public String getHashedValue() { return hashedValue; }
    
    private static void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        
        if (!password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("Password must contain uppercase letter");
        }
        
        if (!password.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("Password must contain lowercase letter");
        }
        
        if (!password.matches(".*\\d.*")) {
            throw new IllegalArgumentException("Password must contain digit");
        }
        
        if (!password.matches(".*[!@#$%^&*()_+].*")) {
            throw new IllegalArgumentException("Password must contain special character");
        }
    }
    
    private static String hashPassword(String password) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
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
}

// Repository interface - data access responsibility
public interface UserRepository {
    void save(User user);
    Optional<User> findById(UserId id);
    Optional<User> findByEmail(Email email);
    boolean existsByEmail(Email email);
    void update(User user);
}

// Password repository - separate concern
public interface PasswordRepository {
    void savePassword(UserId userId, Password password);
    Optional<Password> getPassword(UserId userId);
    void updatePassword(UserId userId, Password newPassword);
}

// Email service interface - notification responsibility
public interface EmailService {
    void sendWelcomeEmail(Email email, Name firstName);
    void sendPasswordResetEmail(Email email, String resetToken);
}

// Analytics service interface - tracking responsibility
public interface AnalyticsService {
    void trackUserRegistration(UserId userId, Email email);
    void trackUserLogin(UserId userId);
    void trackPasswordChange(UserId userId);
}

// Audit service interface - logging responsibility
public interface AuditService {
    void logUserCreated(UserId userId, Email email);
    void logUserAuthenticated(UserId userId);
    void logPasswordChanged(UserId userId);
    void logError(String operation, String error);
}

// Registration result value object
public class RegistrationResult {
    private final boolean success;
    private final UserId userId;
    private final String errorMessage;
    
    private RegistrationResult(boolean success, UserId userId, String errorMessage) {
        this.success = success;
        this.userId = userId;
        this.errorMessage = errorMessage;
    }
    
    public static RegistrationResult success(UserId userId) {
        return new RegistrationResult(true, userId, null);
    }
    
    public static RegistrationResult failure(String errorMessage) {
        return new RegistrationResult(false, null, errorMessage);
    }
    
    public boolean isSuccess() { return success; }
    public UserId getUserId() { return userId; }
    public String getErrorMessage() { return errorMessage; }
}

// Authentication result value object
public class AuthenticationResult {
    private final boolean success;
    private final User user;
    private final String errorMessage;
    
    private AuthenticationResult(boolean success, User user, String errorMessage) {
        this.success = success;
        this.user = user;
        this.errorMessage = errorMessage;
    }
    
    public static AuthenticationResult success(User user) {
        return new AuthenticationResult(true, user, null);
    }
    
    public static AuthenticationResult failure(String errorMessage) {
        return new AuthenticationResult(false, null, errorMessage);
    }
    
    public boolean isSuccess() { return success; }
    public User getUser() { return user; }
    public String getErrorMessage() { return errorMessage; }
}

// User service - coordinates user operations (application service)
public class UserService {
    private final UserRepository userRepository;
    private final PasswordRepository passwordRepository;
    private final EmailService emailService;
    private final AnalyticsService analyticsService;
    private final AuditService auditService;
    
    public UserService(UserRepository userRepository,
                      PasswordRepository passwordRepository,
                      EmailService emailService,
                      AnalyticsService analyticsService,
                      AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordRepository = passwordRepository;
        this.emailService = emailService;
        this.analyticsService = analyticsService;
        this.auditService = auditService;
    }
    
    public RegistrationResult registerUser(String email, String password, String firstName, String lastName) {
        try {
            // Create value objects (validation happens here)
            Email emailVO = Email.of(email);
            Password passwordVO = Password.fromPlaintext(password);
            Name firstNameVO = Name.of(firstName);
            Name lastNameVO = Name.of(lastName);
            
            // Business rule: email must be unique
            if (userRepository.existsByEmail(emailVO)) {
                return RegistrationResult.failure("User already exists with this email");
            }
            
            // Create user
            User user = User.create(emailVO, firstNameVO, lastNameVO);
            
            // Save user and password
            userRepository.save(user);
            passwordRepository.savePassword(user.getId(), passwordVO);
            
            // Send welcome email
            emailService.sendWelcomeEmail(emailVO, firstNameVO);
            
            // Track and audit
            analyticsService.trackUserRegistration(user.getId(), emailVO);
            auditService.logUserCreated(user.getId(), emailVO);
            
            return RegistrationResult.success(user.getId());
            
        } catch (IllegalArgumentException e) {
            auditService.logError("USER_REGISTRATION", e.getMessage());
            return RegistrationResult.failure(e.getMessage());
        } catch (Exception e) {
            auditService.logError("USER_REGISTRATION", "Unexpected error: " + e.getMessage());
            return RegistrationResult.failure("Registration failed due to system error");
        }
    }
    
    public AuthenticationResult authenticateUser(String email, String password) {
        try {
            Email emailVO = Email.of(email);
            
            Optional<User> userOpt = userRepository.findByEmail(emailVO);
            if (userOpt.isEmpty()) {
                auditService.logError("USER_AUTHENTICATION", "User not found: " + email);
                return AuthenticationResult.failure("Invalid credentials");
            }
            
            User user = userOpt.get();
            if (!user.isActive()) {
                auditService.logError("USER_AUTHENTICATION", "Inactive user login attempt: " + email);
                return AuthenticationResult.failure("Account is deactivated");
            }
            
            Optional<Password> passwordOpt = passwordRepository.getPassword(user.getId());
            if (passwordOpt.isEmpty() || !passwordOpt.get().matches(password)) {
                auditService.logError("USER_AUTHENTICATION", "Invalid password for: " + email);
                return AuthenticationResult.failure("Invalid credentials");
            }
            
            // Update last login
            User updatedUser = user.recordLogin();
            userRepository.update(updatedUser);
            
            // Track and audit
            analyticsService.trackUserLogin(user.getId());
            auditService.logUserAuthenticated(user.getId());
            
            return AuthenticationResult.success(updatedUser);
            
        } catch (Exception e) {
            auditService.logError("USER_AUTHENTICATION", "Unexpected error: " + e.getMessage());
            return AuthenticationResult.failure("Authentication failed due to system error");
        }
    }
    
    public boolean changePassword(UserId userId, String oldPassword, String newPassword) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                auditService.logError("PASSWORD_CHANGE", "User not found: " + userId);
                return false;
            }
            
            Optional<Password> currentPasswordOpt = passwordRepository.getPassword(userId);
            if (currentPasswordOpt.isEmpty() || !currentPasswordOpt.get().matches(oldPassword)) {
                auditService.logError("PASSWORD_CHANGE", "Invalid old password for user: " + userId);
                return false;
            }
            
            Password newPasswordVO = Password.fromPlaintext(newPassword);
            passwordRepository.updatePassword(userId, newPasswordVO);
            
            // Track and audit
            analyticsService.trackPasswordChange(userId);
            auditService.logPasswordChanged(userId);
            
            return true;
            
        } catch (IllegalArgumentException e) {
            auditService.logError("PASSWORD_CHANGE", e.getMessage());
            return false;
        } catch (Exception e) {
            auditService.logError("PASSWORD_CHANGE", "Unexpected error: " + e.getMessage());
            return false;
        }
    }
    
    public boolean updateUserProfile(UserId userId, String firstName, String lastName) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                auditService.logError("PROFILE_UPDATE", "User not found: " + userId);
                return false;
            }
            
            Name firstNameVO = Name.of(firstName);
            Name lastNameVO = Name.of(lastName);
            
            User updatedUser = userOpt.get().updateName(firstNameVO, lastNameVO);
            userRepository.update(updatedUser);
            
            return true;
            
        } catch (IllegalArgumentException e) {
            auditService.logError("PROFILE_UPDATE", e.getMessage());
            return false;
        } catch (Exception e) {
            auditService.logError("PROFILE_UPDATE", "Unexpected error: " + e.getMessage());
            return false;
        }
    }
}

/* 
Benefits of this Single Responsibility approach:
1. ✅ Each class has one reason to change
2. ✅ Easy to test - dependencies can be mocked
3. ✅ High cohesion - related functionality grouped together
4. ✅ Low coupling - classes don't depend on implementation details
5. ✅ Reusable components - Email can be used elsewhere
6. ✅ Flexible - can swap implementations easily
7. ✅ Clear separation of concerns
8. ✅ Domain logic separated from infrastructure
9. ✅ Value objects provide validation and immutability
10. ✅ Easy to understand and maintain
11. ✅ Follows dependency inversion principle
12. ✅ Supports test-driven development
13. ✅ Enables parallel development
14. ✅ Reduces merge conflicts
15. ✅ Makes refactoring safer and easier

Each class now has a single, well-defined responsibility:
- User: Domain model and business behavior
- Email/Name/UserId/Password: Value objects with validation
- UserService: Application service coordinating operations
- Repository interfaces: Data access contracts
- Service interfaces: External service contracts
*/
