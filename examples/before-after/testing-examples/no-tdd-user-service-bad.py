# ❌ BAD: Written without TDD - complex, untested, fragile
# Problems: No tests, unclear requirements, hidden bugs, hard to modify

import hashlib
import re
import smtplib
from datetime import datetime, timedelta
import sqlite3
from email.mime.text import MimeText

class UserService:
    """
    User management service written without tests
    Requirements discovered through production bugs and customer complaints
    """
    
    def __init__(self):
        # Direct database dependency - can't test without real DB
        self.db_path = "users.db"
        self._setup_database()
    
    def _setup_database(self):
        # Database setup in constructor - what could go wrong?
        conn = sqlite3.connect(self.db_path)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                email TEXT UNIQUE,
                password_hash TEXT,
                first_name TEXT,
                last_name TEXT,
                created_at TEXT,
                email_verified BOOLEAN DEFAULT 0,
                verification_token TEXT,
                failed_login_attempts INTEGER DEFAULT 0,
                locked_until TEXT
            )
        ''')
        conn.close()
    
    def register_user(self, email, password, first_name, last_name):
        """
        Register a new user - seems simple but full of edge cases
        """
        # Input validation - but is it enough?
        if not email:
            raise ValueError("Email required")
        
        if not password:
            raise ValueError("Password required")
            
        # Email validation - regex found on Stack Overflow
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValueError("Invalid email format")
        
        # Password validation - requirements not clear
        if len(password) < 8:
            raise ValueError("Password too short")
        
        # What about other password requirements?
        # What about SQL injection?
        # What about duplicate emails?
        
        # Hash password - is this secure enough?
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Generate verification token - is this random enough?
        verification_token = hashlib.md5(f"{email}{datetime.now()}".encode()).hexdigest()
        
        # Database operations - no transaction management
        conn = sqlite3.connect(self.db_path)
        try:
            # Check for existing user - race condition possible
            cursor = conn.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                raise ValueError("User already exists")
            
            # Insert new user
            conn.execute('''
                INSERT INTO users (email, password_hash, first_name, last_name, 
                                 created_at, verification_token)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (email, password_hash, first_name, last_name, 
                  datetime.now().isoformat(), verification_token))
            
            conn.commit()
            
            # Send verification email - what if this fails?
            self._send_verification_email(email, verification_token)
            
            return {"message": "User registered successfully", "email": email}
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def login_user(self, email, password):
        """
        User login with password verification and account locking
        """
        if not email or not password:
            raise ValueError("Email and password required")
        
        conn = sqlite3.connect(self.db_path)
        try:
            # Get user data
            cursor = conn.execute('''
                SELECT id, password_hash, email_verified, failed_login_attempts, 
                       locked_until FROM users WHERE email = ?
            ''', (email,))
            
            user_data = cursor.fetchone()
            if not user_data:
                # Should we reveal that user doesn't exist? Security implications?
                raise ValueError("Invalid credentials")
            
            user_id, stored_hash, email_verified, failed_attempts, locked_until = user_data
            
            # Check if account is locked
            if locked_until:
                locked_until_dt = datetime.fromisoformat(locked_until)
                if datetime.now() < locked_until_dt:
                    raise ValueError("Account is locked")
            
            # Check if email is verified
            if not email_verified:
                raise ValueError("Email not verified")
            
            # Verify password
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            if password_hash != stored_hash:
                # Increment failed attempts
                new_failed_attempts = failed_attempts + 1
                
                # Lock account after 5 failed attempts
                if new_failed_attempts >= 5:
                    locked_until = (datetime.now() + timedelta(hours=24)).isoformat()
                    conn.execute('''
                        UPDATE users SET failed_login_attempts = ?, locked_until = ?
                        WHERE id = ?
                    ''', (new_failed_attempts, locked_until, user_id))
                else:
                    conn.execute('''
                        UPDATE users SET failed_login_attempts = ?
                        WHERE id = ?
                    ''', (new_failed_attempts, user_id))
                
                conn.commit()
                raise ValueError("Invalid credentials")
            
            # Reset failed attempts on successful login
            conn.execute('''
                UPDATE users SET failed_login_attempts = 0, locked_until = NULL
                WHERE id = ?
            ''', (user_id,))
            
            conn.commit()
            
            # Return user info - but what should we include?
            cursor = conn.execute('''
                SELECT id, email, first_name, last_name, created_at
                FROM users WHERE id = ?
            ''', (user_id,))
            
            user_info = cursor.fetchone()
            return {
                "id": user_info[0],
                "email": user_info[1],
                "first_name": user_info[2],
                "last_name": user_info[3],
                "created_at": user_info[4]
            }
            
        finally:
            conn.close()
    
    def verify_email(self, token):
        """
        Verify user email with token
        """
        if not token:
            raise ValueError("Token required")
        
        conn = sqlite3.connect(self.db_path)
        try:
            # Find user by token
            cursor = conn.execute('''
                SELECT id, email FROM users WHERE verification_token = ?
            ''', (token,))
            
            user_data = cursor.fetchone()
            if not user_data:
                raise ValueError("Invalid verification token")
            
            user_id, email = user_data
            
            # Update user as verified
            conn.execute('''
                UPDATE users SET email_verified = 1, verification_token = NULL
                WHERE id = ?
            ''', (user_id,))
            
            conn.commit()
            
            return {"message": "Email verified successfully", "email": email}
            
        finally:
            conn.close()
    
    def change_password(self, user_id, old_password, new_password):
        """
        Change user password
        """
        if not all([user_id, old_password, new_password]):
            raise ValueError("All fields required")
        
        # Password validation - duplicated from registration
        if len(new_password) < 8:
            raise ValueError("Password too short")
        
        conn = sqlite3.connect(self.db_path)
        try:
            # Get current password hash
            cursor = conn.execute('''
                SELECT password_hash FROM users WHERE id = ?
            ''', (user_id,))
            
            result = cursor.fetchone()
            if not result:
                raise ValueError("User not found")
            
            stored_hash = result[0]
            
            # Verify old password
            old_password_hash = hashlib.sha256(old_password.encode()).hexdigest()
            if old_password_hash != stored_hash:
                raise ValueError("Current password is incorrect")
            
            # Hash new password
            new_password_hash = hashlib.sha256(new_password.encode()).hexdigest()
            
            # Update password
            conn.execute('''
                UPDATE users SET password_hash = ? WHERE id = ?
            ''', (new_password_hash, user_id))
            
            conn.commit()
            
            return {"message": "Password changed successfully"}
            
        finally:
            conn.close()
    
    def _send_verification_email(self, email, token):
        """
        Send verification email - what if SMTP is down?
        """
        try:
            # Hard-coded SMTP configuration
            smtp_server = smtplib.SMTP('smtp.gmail.com', 587)
            smtp_server.starttls()
            smtp_server.login('noreply@company.com', 'app_password')
            
            # Create email
            verification_url = f"https://company.com/verify?token={token}"
            body = f"Click here to verify your email: {verification_url}"
            
            msg = MimeText(body)
            msg['Subject'] = 'Verify your email'
            msg['From'] = 'noreply@company.com'
            msg['To'] = email
            
            smtp_server.send_message(msg)
            smtp_server.quit()
            
        except Exception as e:
            # What should happen if email fails? Silent failure?
            print(f"Failed to send verification email: {e}")
            # Should this prevent user registration?

# Example usage - no tests to verify this works
if __name__ == "__main__":
    service = UserService()
    
    # Happy path - but what about edge cases?
    try:
        result = service.register_user(
            "john@example.com", 
            "password123", 
            "John", 
            "Doe"
        )
        print(result)
        
        # What happens if we try to register same user again?
        # What happens with invalid email formats?
        # What happens with empty passwords?
        # What happens if database is locked?
        # What happens if email service is down?
        
    except Exception as e:
        print(f"Error: {e}")

"""
Problems with this approach:
1. ❌ No tests to verify correctness
2. ❌ Complex business logic without validation
3. ❌ Database operations not transactional
4. ❌ Hard dependencies on database and email service
5. ❌ Security vulnerabilities (weak hashing, timing attacks)
6. ❌ Race conditions in user registration
7. ❌ Error handling inconsistent and unclear
8. ❌ No separation of concerns (DB, email, validation all mixed)
9. ❌ Hard-coded configuration values
10. ❌ Silent failures in email sending
11. ❌ Duplicated validation logic
12. ❌ No input sanitization for SQL injection
13. ❌ Unclear error messages that may leak information
14. ❌ No logging or monitoring
15. ❌ Impossible to unit test individual components
16. ❌ Changes require full integration testing
17. ❌ Production bugs discovered by users
18. ❌ Code is fragile and scary to modify
"""
