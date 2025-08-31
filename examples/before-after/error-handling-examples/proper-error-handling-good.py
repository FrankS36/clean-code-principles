# ✅ GOOD: Robust Error Handling - Comprehensive error management
# Proper logging and monitoring
# Graceful error recovery
# Rich error context for debugging

import json
import logging
import requests
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import traceback
import time
from contextlib import contextmanager

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class ProcessingError:
    """Rich error context for debugging and monitoring"""
    error_type: str
    message: str
    user_id: Optional[str] = None
    operation: Optional[str] = None
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
    recoverable: bool = True
    retry_after: Optional[int] = None
    context: Optional[Dict] = None
    original_exception: Optional[Exception] = None

@dataclass
class ProcessingResult:
    """Rich result object with success/failure details"""
    success: bool
    processed_count: int
    failed_count: int
    errors: List[ProcessingError]
    processing_time: float
    context: Optional[Dict] = None

class DataProcessingException(Exception):
    """Base exception for data processing errors"""
    def __init__(self, message: str, error_type: str, severity: ErrorSeverity = ErrorSeverity.MEDIUM, 
                 recoverable: bool = True, context: Dict = None, original_exception: Exception = None):
        super().__init__(message)
        self.error_type = error_type
        self.severity = severity
        self.recoverable = recoverable
        self.context = context or {}
        self.original_exception = original_exception

class ValidationError(DataProcessingException):
    """Specific exception for data validation errors"""
    def __init__(self, message: str, field: str, value: any, context: Dict = None):
        super().__init__(
            message, 
            "VALIDATION_ERROR", 
            ErrorSeverity.MEDIUM, 
            recoverable=False,
            context={"field": field, "value": str(value), **(context or {})}
        )

class NetworkError(DataProcessingException):
    """Specific exception for network-related errors"""
    def __init__(self, message: str, url: str, status_code: int = None, context: Dict = None):
        super().__init__(
            message,
            "NETWORK_ERROR",
            ErrorSeverity.HIGH,
            recoverable=True,
            context={"url": url, "status_code": status_code, **(context or {})}
        )

class DatabaseError(DataProcessingException):
    """Specific exception for database-related errors"""
    def __init__(self, message: str, operation: str, context: Dict = None):
        super().__init__(
            message,
            "DATABASE_ERROR",
            ErrorSeverity.HIGH,
            recoverable=True,
            context={"operation": operation, **(context or {})}
        )

class StructuredLogger:
    """Structured logging for better observability"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def log_error(self, error: ProcessingError, request_id: str = None):
        """Log error with structured context"""
        log_context = {
            "error_type": error.error_type,
            "severity": error.severity.value,
            "recoverable": error.recoverable,
            "user_id": error.user_id,
            "operation": error.operation,
            "request_id": request_id,
            "context": error.context
        }
        
        if error.original_exception:
            log_context["exception_type"] = type(error.original_exception).__name__
            log_context["stack_trace"] = traceback.format_exception(
                type(error.original_exception), 
                error.original_exception, 
                error.original_exception.__traceback__
            )
        
        self.logger.error(f"Processing error: {error.message}", extra=log_context)
    
    def log_success(self, operation: str, context: Dict, request_id: str = None):
        """Log successful operations"""
        log_context = {
            "operation": operation,
            "request_id": request_id,
            **context
        }
        self.logger.info(f"Operation completed successfully: {operation}", extra=log_context)

class CircuitBreaker:
    """Circuit breaker pattern to prevent cascading failures"""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    @contextmanager
    def call(self):
        """Context manager for circuit breaker calls"""
        if self.state == "OPEN":
            if time.time() - self.last_failure_time < self.recovery_timeout:
                raise DataProcessingException(
                    "Circuit breaker is OPEN", 
                    "CIRCUIT_BREAKER_OPEN",
                    ErrorSeverity.HIGH,
                    recoverable=True
                )
            else:
                self.state = "HALF_OPEN"
        
        try:
            yield
            # Success - reset circuit breaker
            self.failure_count = 0
            self.state = "CLOSED"
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
            
            raise

class DataProcessor:
    """Robust data processor with comprehensive error handling"""
    
    def __init__(self):
        self.api_url = "https://api.example.com"
        self.database = DatabaseConnection()
        self.cache = CacheService()
        self.logger = StructuredLogger("data_processor")
        self.circuit_breaker = CircuitBreaker()
        self.metrics = MetricsCollector()
    
    def process_user_data(self, user_ids: List[str], request_id: str = None) -> ProcessingResult:
        """Process user data with robust error handling"""
        start_time = time.time()
        processed_count = 0
        errors = []
        results = {}
        
        self.logger.log_success("process_user_data_started", {
            "user_count": len(user_ids),
            "request_id": request_id
        })
        
        for user_id in user_ids:
            try:
                user_data = self.fetch_user_data_with_retry(user_id, request_id)
                if user_data:
                    results[user_id] = user_data
                    processed_count += 1
                    
            except DataProcessingException as e:
                error = ProcessingError(
                    error_type=e.error_type,
                    message=e.message,
                    user_id=user_id,
                    operation="fetch_user_data",
                    severity=e.severity,
                    recoverable=e.recoverable,
                    context=e.context,
                    original_exception=e.original_exception
                )
                errors.append(error)
                self.logger.log_error(error, request_id)
                self.metrics.record_error(e.error_type, e.severity)
                
            except Exception as e:
                # Unexpected error - wrap with context
                error = ProcessingError(
                    error_type="UNEXPECTED_ERROR",
                    message=f"Unexpected error processing user {user_id}: {str(e)}",
                    user_id=user_id,
                    operation="fetch_user_data",
                    severity=ErrorSeverity.HIGH,
                    recoverable=True,
                    original_exception=e
                )
                errors.append(error)
                self.logger.log_error(error, request_id)
                self.metrics.record_error("UNEXPECTED_ERROR", ErrorSeverity.HIGH)
        
        processing_time = time.time() - start_time
        
        result = ProcessingResult(
            success=len(errors) == 0,
            processed_count=processed_count,
            failed_count=len(errors),
            errors=errors,
            processing_time=processing_time,
            context={"total_users": len(user_ids), "request_id": request_id}
        )
        
        self.metrics.record_processing_result(result)
        return result
    
    def fetch_user_data_with_retry(self, user_id: str, request_id: str = None, max_retries: int = 3) -> Optional[Dict]:
        """Fetch user data with retry logic"""
        for attempt in range(max_retries + 1):
            try:
                with self.circuit_breaker.call():
                    return self.fetch_user_data(user_id, request_id)
                    
            except NetworkError as e:
                if attempt == max_retries:
                    raise  # Final attempt failed
                
                # Exponential backoff
                wait_time = 2 ** attempt
                self.logger.logger.warning(
                    f"Network error fetching user {user_id}, retrying in {wait_time}s: {e.message}",
                    extra={"attempt": attempt + 1, "max_retries": max_retries, "user_id": user_id}
                )
                time.sleep(wait_time)
                
            except DataProcessingException as e:
                if not e.recoverable:
                    raise  # Don't retry non-recoverable errors
                
                if attempt == max_retries:
                    raise
                
                wait_time = 2 ** attempt
                time.sleep(wait_time)
    
    def fetch_user_data(self, user_id: str, request_id: str = None) -> Dict:
        """Fetch user data with proper error handling"""
        if not user_id or not user_id.strip():
            raise ValidationError("User ID cannot be empty", "user_id", user_id)
        
        try:
            response = requests.get(
                f"{self.api_url}/users/{user_id}",
                timeout=10,
                headers={"X-Request-ID": request_id} if request_id else {}
            )
            
            if response.status_code == 404:
                raise DataProcessingException(
                    f"User {user_id} not found",
                    "USER_NOT_FOUND",
                    ErrorSeverity.LOW,
                    recoverable=False,
                    context={"user_id": user_id, "status_code": 404}
                )
            
            if response.status_code >= 500:
                raise NetworkError(
                    f"Server error fetching user {user_id}",
                    f"{self.api_url}/users/{user_id}",
                    response.status_code,
                    {"user_id": user_id}
                )
            
            if response.status_code >= 400:
                raise NetworkError(
                    f"Client error fetching user {user_id}: {response.text}",
                    f"{self.api_url}/users/{user_id}",
                    response.status_code,
                    {"user_id": user_id}
                )
            
            try:
                data = response.json()
                self.validate_user_data(data, user_id)
                return self.transform_user_data(data, user_id)
                
            except json.JSONDecodeError as e:
                raise DataProcessingException(
                    f"Invalid JSON response for user {user_id}",
                    "INVALID_JSON",
                    ErrorSeverity.MEDIUM,
                    recoverable=True,
                    context={"user_id": user_id, "response_text": response.text[:500]},
                    original_exception=e
                )
                
        except requests.exceptions.Timeout as e:
            raise NetworkError(
                f"Timeout fetching user {user_id}",
                f"{self.api_url}/users/{user_id}",
                context={"user_id": user_id, "timeout": 10}
            )
            
        except requests.exceptions.ConnectionError as e:
            raise NetworkError(
                f"Connection error fetching user {user_id}",
                f"{self.api_url}/users/{user_id}",
                context={"user_id": user_id}
            )
    
    def validate_user_data(self, data: Dict, user_id: str) -> None:
        """Validate user data with detailed error reporting"""
        validation_errors = []
        
        if not isinstance(data, dict):
            raise ValidationError("User data must be a dictionary", "data_type", type(data).__name__)
        
        required_fields = ['email', 'name']
        for field in required_fields:
            if field not in data:
                validation_errors.append(f"Missing required field: {field}")
            elif not data[field] or not str(data[field]).strip():
                validation_errors.append(f"Field {field} cannot be empty")
        
        if 'email' in data and data['email']:
            email = data['email']
            if '@' not in email or '.' not in email.split('@')[-1]:
                validation_errors.append(f"Invalid email format: {email}")
        
        if 'age' in data and data['age'] is not None:
            try:
                age = int(data['age'])
                if age < 0 or age > 150:
                    validation_errors.append(f"Age must be between 0 and 150, got: {age}")
            except (ValueError, TypeError):
                validation_errors.append(f"Age must be a valid number, got: {data['age']}")
        
        if validation_errors:
            raise ValidationError(
                f"User data validation failed: {'; '.join(validation_errors)}",
                "multiple",
                validation_errors,
                {"user_id": user_id, "validation_errors": validation_errors}
            )
    
    def transform_user_data(self, data: Dict, user_id: str) -> Dict:
        """Transform user data with error handling"""
        try:
            transformed = data.copy()
            
            # Safe date parsing
            if 'created_date' in data and data['created_date']:
                try:
                    transformed['created_date'] = datetime.strptime(data['created_date'], '%Y-%m-%d')
                except ValueError as e:
                    self.logger.logger.warning(
                        f"Invalid date format for user {user_id}: {data['created_date']}",
                        extra={"user_id": user_id, "date_value": data['created_date']}
                    )
                    # Keep original value instead of failing
                    transformed['created_date'] = data['created_date']
            
            # Safe JSON parsing for preferences
            if 'preferences' in data and isinstance(data['preferences'], str):
                try:
                    transformed['preferences'] = json.loads(data['preferences'])
                except json.JSONDecodeError as e:
                    self.logger.logger.warning(
                        f"Invalid preferences JSON for user {user_id}",
                        extra={"user_id": user_id, "preferences": data['preferences']}
                    )
                    # Set default preferences instead of failing
                    transformed['preferences'] = {}
            
            return transformed
            
        except Exception as e:
            raise DataProcessingException(
                f"Error transforming user data for {user_id}: {str(e)}",
                "TRANSFORMATION_ERROR",
                ErrorSeverity.MEDIUM,
                recoverable=True,
                context={"user_id": user_id},
                original_exception=e
            )

class DatabaseConnection:
    """Database connection with robust error handling"""
    
    def __init__(self):
        self.connected = False
        self.logger = StructuredLogger("database")
    
    def save_with_transaction(self, operations: List[Tuple[str, Dict]]) -> None:
        """Save multiple operations in a transaction"""
        if not self.connected:
            self.connect()
        
        try:
            # Begin transaction
            self.begin_transaction()
            
            for key, data in operations:
                self.save(key, data)
            
            # Commit transaction
            self.commit_transaction()
            
        except Exception as e:
            # Rollback on any error
            self.rollback_transaction()
            raise DatabaseError(
                f"Transaction failed: {str(e)}",
                "SAVE_TRANSACTION",
                context={"operation_count": len(operations)},
            )
    
    def save(self, key: str, data: Dict) -> None:
        """Save data with proper error handling"""
        try:
            if not self.connected:
                self.connect()
            
            # Simulate database save with validation
            if not key:
                raise DatabaseError("Key cannot be empty", "SAVE", context={"key": key})
            
            if not isinstance(data, dict):
                raise DatabaseError(
                    "Data must be a dictionary", 
                    "SAVE", 
                    context={"key": key, "data_type": type(data).__name__}
                )
            
            # Simulate successful save
            self.logger.log_success("database_save", {"key": key, "data_size": len(str(data))})
            
        except DatabaseError:
            raise  # Re-raise database errors
        except Exception as e:
            raise DatabaseError(
                f"Unexpected database error: {str(e)}",
                "SAVE",
                context={"key": key},
            )
    
    def connect(self) -> None:
        """Connect to database with retry logic"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Simulate connection
                self.connected = True
                self.logger.log_success("database_connect", {"attempt": attempt + 1})
                return
                
            except Exception as e:
                if attempt == max_retries - 1:
                    raise DatabaseError(
                        f"Failed to connect to database after {max_retries} attempts",
                        "CONNECTION",
                        context={"max_retries": max_retries}
                    )
                
                time.sleep(2 ** attempt)  # Exponential backoff
    
    def begin_transaction(self): pass
    def commit_transaction(self): pass
    def rollback_transaction(self): pass

class MetricsCollector:
    """Metrics collection with error handling"""
    
    def __init__(self):
        self.logger = StructuredLogger("metrics")
    
    def record_error(self, error_type: str, severity: ErrorSeverity) -> None:
        """Record error metrics"""
        try:
            # Simulate metrics recording
            self.logger.log_success("metrics_recorded", {
                "metric_type": "error",
                "error_type": error_type,
                "severity": severity.value
            })
        except Exception as e:
            # Don't fail the main operation for metrics errors
            self.logger.logger.warning(f"Failed to record error metrics: {e}")
    
    def record_processing_result(self, result: ProcessingResult) -> None:
        """Record processing result metrics"""
        try:
            self.logger.log_success("processing_metrics_recorded", {
                "processed_count": result.processed_count,
                "failed_count": result.failed_count,
                "processing_time": result.processing_time,
                "success_rate": result.processed_count / (result.processed_count + result.failed_count)
            })
        except Exception as e:
            self.logger.logger.warning(f"Failed to record processing metrics: {e}")

class CacheService:
    """Cache service with graceful failure handling"""
    
    def __init__(self):
        self.logger = StructuredLogger("cache")
    
    def get(self, key: str) -> Optional[any]:
        """Get from cache with error handling"""
        try:
            # Simulate cache get
            return None  # Cache miss
        except Exception as e:
            self.logger.logger.warning(f"Cache get failed for key {key}: {e}")
            return None  # Graceful degradation
    
    def set(self, key: str, value: any, ttl: int = 300) -> None:
        """Set cache with error handling"""
        try:
            # Simulate cache set
            self.logger.log_success("cache_set", {"key": key, "ttl": ttl})
        except Exception as e:
            # Cache failures shouldn't break the main flow
            self.logger.logger.warning(f"Cache set failed for key {key}: {e}")

# Usage demonstrates robust error handling
def main():
    """Demonstrates comprehensive error handling approach"""
    processor = DataProcessor()
    
    # Process with request tracking
    request_id = f"req_{int(time.time())}"
    user_ids = ['user1', 'user2', 'invalid_user', 'user4', 'user5']
    
    try:
        result = processor.process_user_data(user_ids, request_id)
        
        print(f"Processing completed:")
        print(f"  Success: {result.success}")
        print(f"  Processed: {result.processed_count}")
        print(f"  Failed: {result.failed_count}")
        print(f"  Processing time: {result.processing_time:.2f}s")
        
        if result.errors:
            print(f"  Errors encountered:")
            for error in result.errors:
                print(f"    - {error.error_type}: {error.message}")
                if error.user_id:
                    print(f"      User: {error.user_id}")
                if error.severity:
                    print(f"      Severity: {error.severity.value}")
        
    except Exception as e:
        print(f"Critical error: {e}")
        # Even critical errors are logged with context

if __name__ == "__main__":
    main()

# Benefits of robust error handling:
print("\nBenefits of robust error handling:")
print("✅ Complete visibility into system behavior")
print("✅ Rich error context for debugging")
print("✅ Graceful degradation and recovery")
print("✅ Structured logging for monitoring")
print("✅ Circuit breaker prevents cascading failures")
print("✅ Retry logic handles transient failures")
print("✅ Metrics collection for system health")
print("✅ Different error types handled appropriately")
print("✅ Transaction support for data consistency")
print("✅ Non-critical failures don't break main flow")
