# ✅ GOOD: Built with Test-Driven Development - clean, tested, maintainable
# Benefits: Clear requirements, comprehensive tests, easy to modify and extend

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import re
import secrets
import hashlib
import bcrypt


# Domain models - clear data structures
@dataclass
class User:
    id: Optional[str]
    email: str
    first_name: str
    last_name: str
    created_at: datetime
    email_verified: bool = False
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None

@dataclass
class RegistrationResult:
    success: bool
    user_id: Optional[str] = None
    message: Optional[str] = None
    verification_token: Optional[str] = None

@dataclass
class LoginResult:
    success: bool
    user: Optional[User] = None
    message: Optional[str] = None

@dataclass
class VerificationResult:
    success: bool
    message: str


# Interface definitions - testable boundaries
class UserRepository(ABC):
    @abstractmethod
    def save_user(self, user: User) -> str:
        pass
    
    @abstractmethod
    def find_by_email(self, email: str) -> Optional[User]:
        pass
    
    @abstractmethod
    def find_by_id(self, user_id: str) -> Optional[User]:
        pass
    
    @abstractmethod
    def update_user(self, user: User) -> None:
        pass

class EmailService(ABC):
    @abstractmethod
    def send_verification_email(self, email: str, token: str) -> bool:
        pass

class TokenGenerator(ABC):
    @abstractmethod
    def generate_token(self) -> str:
        pass

class PasswordHasher(ABC):
    @abstractmethod
    def hash_password(self, password: str) -> str:
        pass
    
    @abstractmethod
    def verify_password(self, password: str, hashed: str) -> bool:
        pass


# Main service - pure business logic
class UserService:
    def __init__(self, 
                 user_repository: UserRepository,
                 email_service: EmailService,
                 token_generator: TokenGenerator,
                 password_hasher: PasswordHasher):
        self.user_repository = user_repository
        self.email_service = email_service
        self.token_generator = token_generator
        self.password_hasher = password_hasher
        
        # Configuration
        self.max_failed_attempts = 5
        self.lockout_duration_hours = 24
        self.min_password_length = 8

    def register_user(self, email: str, password: str, first_name: str, last_name: str) -> RegistrationResult:
        """Register a new user with email verification"""
        
        # Validate inputs
        validation_error = self._validate_registration_input(email, password, first_name, last_name)
        if validation_error:
            return RegistrationResult(success=False, message=validation_error)
        
        # Check if user already exists
        existing_user = self.user_repository.find_by_email(email)
        if existing_user:
            return RegistrationResult(success=False, message="User already exists with this email")
        
        # Create user
        user = User(
            id=None,  # Will be set by repository
            email=email.lower().strip(),
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            created_at=datetime.now()
        )
        
        # Hash password
        user.password_hash = self.password_hasher.hash_password(password)
        
        # Save user
        user_id = self.user_repository.save_user(user)
        
        # Generate and send verification email
        verification_token = self.token_generator.generate_token()
        email_sent = self.email_service.send_verification_email(email, verification_token)
        
        if not email_sent:
            return RegistrationResult(
                success=False, 
                message="User created but verification email failed"
            )
        
        return RegistrationResult(
            success=True,
            user_id=user_id,
            verification_token=verification_token,
            message="User registered successfully. Please check your email for verification."
        )

    def login_user(self, email: str, password: str) -> LoginResult:
        """Authenticate user with email and password"""
        
        if not email or not password:
            return LoginResult(success=False, message="Email and password are required")
        
        user = self.user_repository.find_by_email(email.lower().strip())
        if not user:
            return LoginResult(success=False, message="Invalid credentials")
        
        # Check if account is locked
        if self._is_account_locked(user):
            return LoginResult(success=False, message="Account is temporarily locked due to too many failed attempts")
        
        # Check if email is verified
        if not user.email_verified:
            return LoginResult(success=False, message="Please verify your email before logging in")
        
        # Verify password
        if not self.password_hasher.verify_password(password, user.password_hash):
            self._handle_failed_login(user)
            return LoginResult(success=False, message="Invalid credentials")
        
        # Reset failed attempts on successful login
        if user.failed_login_attempts > 0:
            user.failed_login_attempts = 0
            user.locked_until = None
            self.user_repository.update_user(user)
        
        return LoginResult(success=True, user=user, message="Login successful")

    def verify_email(self, token: str) -> VerificationResult:
        """Verify user email with verification token"""
        
        if not token:
            return VerificationResult(success=False, message="Verification token is required")
        
        # In a real implementation, you'd store tokens separately
        # For this example, we'll assume the token maps to a user somehow
        user = self._find_user_by_verification_token(token)
        
        if not user:
            return VerificationResult(success=False, message="Invalid or expired verification token")
        
        if user.email_verified:
            return VerificationResult(success=True, message="Email is already verified")
        
        user.email_verified = True
        self.user_repository.update_user(user)
        
        return VerificationResult(success=True, message="Email verified successfully")

    def change_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        """Change user password with verification of old password"""
        
        if not all([user_id, old_password, new_password]):
            raise ValueError("All fields are required")
        
        user = self.user_repository.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Verify old password
        if not self.password_hasher.verify_password(old_password, user.password_hash):
            raise ValueError("Current password is incorrect")
        
        # Validate new password
        password_error = self._validate_password(new_password)
        if password_error:
            raise ValueError(password_error)
        
        # Update password
        user.password_hash = self.password_hasher.hash_password(new_password)
        self.user_repository.update_user(user)
        
        return True

    # Private helper methods - easy to test individually

    def _validate_registration_input(self, email: str, password: str, first_name: str, last_name: str) -> Optional[str]:
        """Validate user registration input"""
        
        if not email or not email.strip():
            return "Email is required"
        
        if not self._is_valid_email(email):
            return "Invalid email format"
        
        password_error = self._validate_password(password)
        if password_error:
            return password_error
        
        if not first_name or not first_name.strip():
            return "First name is required"
        
        if not last_name or not last_name.strip():
            return "Last name is required"
        
        return None

    def _validate_password(self, password: str) -> Optional[str]:
        """Validate password requirements"""
        
        if not password:
            return "Password is required"
        
        if len(password) < self.min_password_length:
            return f"Password must be at least {self.min_password_length} characters long"
        
        if not re.search(r'[A-Z]', password):
            return "Password must contain at least one uppercase letter"
        
        if not re.search(r'[a-z]', password):
            return "Password must contain at least one lowercase letter"
        
        if not re.search(r'\d', password):
            return "Password must contain at least one number"
        
        return None

    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    def _is_account_locked(self, user: User) -> bool:
        """Check if user account is locked"""
        if not user.locked_until:
            return False
        return datetime.now() < user.locked_until

    def _handle_failed_login(self, user: User) -> None:
        """Handle failed login attempt"""
        user.failed_login_attempts += 1
        
        if user.failed_login_attempts >= self.max_failed_attempts:
            user.locked_until = datetime.now() + timedelta(hours=self.lockout_duration_hours)
        
        self.user_repository.update_user(user)

    def _find_user_by_verification_token(self, token: str) -> Optional[User]:
        """Find user by verification token (simplified for example)"""
        # In real implementation, you'd have a separate tokens table
        # This is simplified for the example
        return None


# Implementation classes
class BCryptPasswordHasher(PasswordHasher):
    def hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

class SecureTokenGenerator(TokenGenerator):
    def generate_token(self) -> str:
        return secrets.token_urlsafe(32)


# ===== COMPREHENSIVE TEST SUITE =====

import unittest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta


class TestUserService(unittest.TestCase):
    
    def setUp(self):
        self.user_repository = Mock(spec=UserRepository)
        self.email_service = Mock(spec=EmailService)
        self.token_generator = Mock(spec=TokenGenerator)
        self.password_hasher = Mock(spec=PasswordHasher)
        
        self.user_service = UserService(
            self.user_repository,
            self.email_service,
            self.token_generator,
            self.password_hasher
        )

    def test_register_user_success(self):
        # Arrange
        self.user_repository.find_by_email.return_value = None
        self.user_repository.save_user.return_value = "user123"
        self.password_hasher.hash_password.return_value = "hashed_password"
        self.token_generator.generate_token.return_value = "verification_token"
        self.email_service.send_verification_email.return_value = True
        
        # Act
        result = self.user_service.register_user(
            "john@example.com", "Password123", "John", "Doe"
        )
        
        # Assert
        self.assertTrue(result.success)
        self.assertEqual(result.user_id, "user123")
        self.assertEqual(result.verification_token, "verification_token")
        self.user_repository.save_user.assert_called_once()
        self.email_service.send_verification_email.assert_called_once_with(
            "john@example.com", "verification_token"
        )

    def test_register_user_duplicate_email(self):
        # Arrange
        existing_user = User("123", "john@example.com", "John", "Doe", datetime.now())
        self.user_repository.find_by_email.return_value = existing_user
        
        # Act
        result = self.user_service.register_user(
            "john@example.com", "Password123", "John", "Doe"
        )
        
        # Assert
        self.assertFalse(result.success)
        self.assertEqual(result.message, "User already exists with this email")
        self.user_repository.save_user.assert_not_called()

    def test_register_user_invalid_email(self):
        # Act
        result = self.user_service.register_user(
            "invalid-email", "Password123", "John", "Doe"
        )
        
        # Assert
        self.assertFalse(result.success)
        self.assertEqual(result.message, "Invalid email format")

    def test_register_user_weak_password(self):
        # Act
        result = self.user_service.register_user(
            "john@example.com", "weak", "John", "Doe"
        )
        
        # Assert
        self.assertFalse(result.success)
        self.assertIn("Password must be at least", result.message)

    def test_register_user_email_send_failure(self):
        # Arrange
        self.user_repository.find_by_email.return_value = None
        self.user_repository.save_user.return_value = "user123"
        self.password_hasher.hash_password.return_value = "hashed_password"
        self.token_generator.generate_token.return_value = "verification_token"
        self.email_service.send_verification_email.return_value = False
        
        # Act
        result = self.user_service.register_user(
            "john@example.com", "Password123", "John", "Doe"
        )
        
        # Assert
        self.assertFalse(result.success)
        self.assertIn("verification email failed", result.message)

    def test_login_user_success(self):
        # Arrange
        user = User("123", "john@example.com", "John", "Doe", datetime.now())
        user.email_verified = True
        user.password_hash = "hashed_password"
        
        self.user_repository.find_by_email.return_value = user
        self.password_hasher.verify_password.return_value = True
        
        # Act
        result = self.user_service.login_user("john@example.com", "Password123")
        
        # Assert
        self.assertTrue(result.success)
        self.assertEqual(result.user.email, "john@example.com")
        self.assertEqual(result.message, "Login successful")

    def test_login_user_invalid_credentials(self):
        # Arrange
        self.user_repository.find_by_email.return_value = None
        
        # Act
        result = self.user_service.login_user("john@example.com", "Password123")
        
        # Assert
        self.assertFalse(result.success)
        self.assertEqual(result.message, "Invalid credentials")

    def test_login_user_unverified_email(self):
        # Arrange
        user = User("123", "john@example.com", "John", "Doe", datetime.now())
        user.email_verified = False
        user.password_hash = "hashed_password"
        
        self.user_repository.find_by_email.return_value = user
        
        # Act
        result = self.user_service.login_user("john@example.com", "Password123")
        
        # Assert
        self.assertFalse(result.success)
        self.assertIn("verify your email", result.message)

    def test_login_user_account_locked(self):
        # Arrange
        user = User("123", "john@example.com", "John", "Doe", datetime.now())
        user.email_verified = True
        user.locked_until = datetime.now() + timedelta(hours=1)
        
        self.user_repository.find_by_email.return_value = user
        
        # Act
        result = self.user_service.login_user("john@example.com", "Password123")
        
        # Assert
        self.assertFalse(result.success)
        self.assertIn("temporarily locked", result.message)

    def test_login_user_wrong_password_increments_failed_attempts(self):
        # Arrange
        user = User("123", "john@example.com", "John", "Doe", datetime.now())
        user.email_verified = True
        user.password_hash = "hashed_password"
        user.failed_login_attempts = 2
        
        self.user_repository.find_by_email.return_value = user
        self.password_hasher.verify_password.return_value = False
        
        # Act
        result = self.user_service.login_user("john@example.com", "WrongPassword")
        
        # Assert
        self.assertFalse(result.success)
        self.assertEqual(user.failed_login_attempts, 3)
        self.user_repository.update_user.assert_called_once_with(user)

    def test_login_user_locks_account_after_max_failures(self):
        # Arrange
        user = User("123", "john@example.com", "John", "Doe", datetime.now())
        user.email_verified = True
        user.password_hash = "hashed_password"
        user.failed_login_attempts = 4  # One less than max
        
        self.user_repository.find_by_email.return_value = user
        self.password_hasher.verify_password.return_value = False
        
        # Act
        result = self.user_service.login_user("john@example.com", "WrongPassword")
        
        # Assert
        self.assertFalse(result.success)
        self.assertEqual(user.failed_login_attempts, 5)
        self.assertIsNotNone(user.locked_until)
        self.user_repository.update_user.assert_called_once_with(user)

    def test_change_password_success(self):
        # Arrange
        user = User("123", "john@example.com", "John", "Doe", datetime.now())
        user.password_hash = "old_hashed_password"
        
        self.user_repository.find_by_id.return_value = user
        self.password_hasher.verify_password.return_value = True
        self.password_hasher.hash_password.return_value = "new_hashed_password"
        
        # Act
        result = self.user_service.change_password("123", "OldPassword123", "NewPassword123")
        
        # Assert
        self.assertTrue(result)
        self.password_hasher.hash_password.assert_called_with("NewPassword123")
        self.user_repository.update_user.assert_called_once_with(user)

    def test_change_password_wrong_old_password(self):
        # Arrange
        user = User("123", "john@example.com", "John", "Doe", datetime.now())
        user.password_hash = "old_hashed_password"
        
        self.user_repository.find_by_id.return_value = user
        self.password_hasher.verify_password.return_value = False
        
        # Act & Assert
        with self.assertRaises(ValueError) as context:
            self.user_service.change_password("123", "WrongPassword", "NewPassword123")
        
        self.assertIn("Current password is incorrect", str(context.exception))

    def test_change_password_invalid_new_password(self):
        # Arrange
        user = User("123", "john@example.com", "John", "Doe", datetime.now())
        user.password_hash = "old_hashed_password"
        
        self.user_repository.find_by_id.return_value = user
        self.password_hasher.verify_password.return_value = True
        
        # Act & Assert
        with self.assertRaises(ValueError) as context:
            self.user_service.change_password("123", "OldPassword123", "weak")
        
        self.assertIn("Password must be at least", str(context.exception))


class TestPasswordValidation(unittest.TestCase):
    
    def setUp(self):
        self.user_service = UserService(Mock(), Mock(), Mock(), Mock())
    
    def test_validate_password_success(self):
        result = self.user_service._validate_password("StrongPass123")
        self.assertIsNone(result)
    
    def test_validate_password_too_short(self):
        result = self.user_service._validate_password("Short1")
        self.assertIn("at least 8 characters", result)
    
    def test_validate_password_no_uppercase(self):
        result = self.user_service._validate_password("lowercase123")
        self.assertIn("uppercase letter", result)
    
    def test_validate_password_no_lowercase(self):
        result = self.user_service._validate_password("UPPERCASE123")
        self.assertIn("lowercase letter", result)
    
    def test_validate_password_no_number(self):
        result = self.user_service._validate_password("NoNumbers")
        self.assertIn("number", result)


class TestEmailValidation(unittest.TestCase):
    
    def setUp(self):
        self.user_service = UserService(Mock(), Mock(), Mock(), Mock())
    
    def test_valid_emails(self):
        valid_emails = [
            "user@example.com",
            "test.email@domain.co.uk",
            "user+tag@example.org"
        ]
        
        for email in valid_emails:
            with self.subTest(email=email):
                self.assertTrue(self.user_service._is_valid_email(email))
    
    def test_invalid_emails(self):
        invalid_emails = [
            "invalid",
            "invalid@",
            "@invalid.com",
            "invalid@.com",
            "invalid.com"
        ]
        
        for email in invalid_emails:
            with self.subTest(email=email):
                self.assertFalse(self.user_service._is_valid_email(email))


if __name__ == '__main__':
    unittest.main()

"""
Benefits of this TDD approach:
1. ✅ Comprehensive test coverage ensures correctness
2. ✅ Clear requirements documented through tests
3. ✅ Each component can be tested in isolation
4. ✅ Easy to add new features with confidence
5. ✅ Business logic separated from infrastructure
6. ✅ Dependency injection enables different implementations
7. ✅ Error handling is explicit and tested
8. ✅ Edge cases are covered by tests
9. ✅ Fast test execution with no external dependencies
10. ✅ Refactoring is safe with comprehensive test suite
11. ✅ Code is self-documenting through descriptive tests
12. ✅ Security considerations built into design
13. ✅ Maintainable and easy to extend
14. ✅ Production bugs are prevented, not discovered
15. ✅ Changes can be made with confidence
"""
