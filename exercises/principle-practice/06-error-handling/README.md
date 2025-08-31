# Error Handling - Practice Exercises

Master the art of robust error handling through hands-on practice. These exercises progress from basic exception usage to complex error recovery patterns, teaching you to build resilient systems that fail gracefully and provide meaningful feedback.

## 🎯 Learning Objectives

After completing these exercises, you will:

- **Replace return codes** with proper exception handling
- **Design exception hierarchies** that match caller needs
- **Implement retry logic** with exponential backoff
- **Create circuit breaker patterns** to prevent cascading failures
- **Build structured logging** for error monitoring
- **Design graceful degradation** strategies

## 📋 Exercise Overview

| Exercise | Focus Area | Difficulty | Time Estimate |
|----------|------------|------------|---------------|
| 1 | Return Codes → Exceptions | ⭐⭐ Beginner | 45 minutes |
| 2 | Exception Hierarchies | ⭐⭐⭐ Intermediate | 60 minutes |
| 3 | Retry and Circuit Breaker | ⭐⭐⭐⭐ Advanced | 75 minutes |
| 4 | Error Monitoring & Logging | ⭐⭐⭐⭐ Advanced | 60 minutes |
| 5 | Resilient System Design | ⭐⭐⭐⭐⭐ Expert | 120 minutes |

**Total Estimated Time**: 6 hours (can be spread across multiple sessions)

## 🔄 Exercise 1: Return Codes → Exceptions (45 minutes)

### Objective
Learn to replace return code patterns with clean exception handling that separates error handling from business logic.

### Starting Code (Return Codes Pattern)
```python
class FileProcessor:
    SUCCESS = 0
    FILE_NOT_FOUND = -1
    PERMISSION_DENIED = -2
    INVALID_FORMAT = -3
    PROCESSING_ERROR = -4
    
    def process_file(self, file_path: str) -> tuple[int, str]:
        # Check if file exists
        if not os.path.exists(file_path):
            return self.FILE_NOT_FOUND, ""
        
        # Check permissions
        if not os.access(file_path, os.R_OK):
            return self.PERMISSION_DENIED, ""
        
        # Read file
        try:
            with open(file_path, 'r') as f:
                content = f.read()
        except Exception:
            return self.PROCESSING_ERROR, ""
        
        # Validate format
        if not self.is_valid_format(content):
            return self.INVALID_FORMAT, ""
        
        # Process content
        try:
            result = self.process_content(content)
            return self.SUCCESS, result
        except Exception:
            return self.PROCESSING_ERROR, ""
```

### Tasks

#### Part A: Design Exception Hierarchy (15 minutes)
1. **Create appropriate exception classes** for the different error conditions
2. **Design the hierarchy** based on how errors should be handled
3. **Add rich context** to each exception type

#### Part B: Refactor to Exceptions (25 minutes)
1. **Transform the method** to use exceptions instead of return codes
2. **Separate the happy path** from error handling
3. **Preserve all error information** with meaningful messages

#### Part C: Update Usage (5 minutes)
1. **Rewrite calling code** to use try-catch instead of return code checking
2. **Demonstrate different handling** for different exception types

### Success Criteria
- ✅ Business logic is clean and focused on the happy path
- ✅ Different error types have appropriate exception classes
- ✅ Exception messages provide rich context for debugging
- ✅ Calling code can handle different errors appropriately

## 🏗️ Exercise 2: Exception Hierarchies (60 minutes)

### Objective
Design exception hierarchies that match caller needs and enable appropriate error handling strategies.

### Scenario: Payment Processing System
You're building a payment processing system that needs to handle various types of failures with different recovery strategies.

### Requirements

#### Error Categories Needed:
1. **Validation Errors**: Invalid input data (don't retry)
2. **Temporary Errors**: Network issues, service unavailable (retry with backoff)
3. **Permanent Errors**: Declined cards, insufficient funds (don't retry, notify user)
4. **System Errors**: Database failures, service outages (retry, alert ops team)

### Tasks

#### Part A: Exception Hierarchy Design (20 minutes)
1. **Design base exception class** with common fields and methods
2. **Create category-based hierarchy** for different error types
3. **Add specific exceptions** for common scenarios
4. **Include metadata** relevant to each error type

#### Part B: Implementation (30 minutes)
1. **Implement payment processor** that throws appropriate exceptions
2. **Add retry metadata** to temporary errors
3. **Include user-friendly messages** for permanent errors
4. **Add operational context** for system errors

#### Part C: Usage Demonstration (10 minutes)
1. **Show different handling strategies** for each error category
2. **Implement retry logic** for temporary errors
3. **Demonstrate user notification** for permanent errors
4. **Show alerting logic** for system errors

### Success Criteria
- ✅ Exception hierarchy matches caller needs
- ✅ Different error types enable appropriate handling
- ✅ Rich metadata supports debugging and recovery
- ✅ Clear distinction between retryable and permanent errors

## 🔁 Exercise 3: Retry and Circuit Breaker (75 minutes)

### Objective
Implement resilience patterns to handle transient failures gracefully and prevent cascading failures.

### Scenario: External API Integration
Build a service that integrates with external APIs and needs to handle various failure modes gracefully.

### Requirements

#### Patterns to Implement:
1. **Exponential Backoff Retry**: For transient network failures
2. **Circuit Breaker**: To prevent cascading failures
3. **Timeout Management**: To prevent hanging operations
4. **Bulkhead Pattern**: To isolate different API calls

### Tasks

#### Part A: Retry Logic (25 minutes)
1. **Implement exponential backoff** with jitter
2. **Add retry policies** for different error types
3. **Include maximum retry limits** to prevent infinite loops
4. **Track retry attempts** for monitoring

Example starter code:
```java
public class ExternalApiClient {
    public ApiResponse callExternalApi(ApiRequest request) {
        // Implement retry logic here
        // Consider: Which errors should trigger retries?
        // How long should we wait between retries?
        // When should we give up?
    }
}
```

#### Part B: Circuit Breaker (30 minutes)
1. **Implement circuit breaker states** (Closed, Open, Half-Open)
2. **Add failure threshold configuration**
3. **Include recovery timeout logic**
4. **Track circuit breaker state** for monitoring

#### Part C: Integration (20 minutes)
1. **Combine retry and circuit breaker** patterns
2. **Add timeout management** for all operations
3. **Implement bulkhead isolation** for different API endpoints
4. **Add comprehensive monitoring** and alerting

### Success Criteria
- ✅ Transient failures are handled gracefully with retry
- ✅ Circuit breaker prevents cascading failures
- ✅ Operations timeout appropriately
- ✅ Different APIs are isolated from each other's failures

## 📊 Exercise 4: Error Monitoring & Logging (60 minutes)

### Objective
Build comprehensive error monitoring and structured logging to enable effective debugging and system observability.

### Scenario: Microservice Error Tracking
Create an error tracking system for a microservice that needs to provide visibility into error patterns and enable rapid debugging.

### Requirements

#### Monitoring Components:
1. **Structured Logging**: JSON-formatted logs with context
2. **Error Metrics**: Counters, rates, and histograms
3. **Alerting Rules**: Threshold-based alerts for error conditions
4. **Error Aggregation**: Group similar errors for analysis

### Tasks

#### Part A: Structured Logging (20 minutes)
1. **Design log entry structure** with consistent fields
2. **Add correlation IDs** for request tracing
3. **Include error context** (user ID, operation, parameters)
4. **Implement different log levels** appropriately

Example starter structure:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "service": "payment-service",
  "correlation_id": "req-12345",
  "operation": "process_payment",
  "error_type": "VALIDATION_ERROR",
  "message": "Invalid payment method",
  "context": {
    "user_id": "user-456",
    "payment_method": "invalid_card",
    "amount": 100.00
  }
}
```

#### Part B: Error Metrics (20 minutes)
1. **Implement error counters** by type and severity
2. **Track error rates** and percentiles
3. **Add business metrics** (failed payments, etc.)
4. **Create health check endpoints**

#### Part C: Alerting and Aggregation (20 minutes)
1. **Define alerting thresholds** for different error types
2. **Implement error grouping** by signature
3. **Add escalation logic** for critical errors
4. **Create error dashboards** for monitoring

### Success Criteria
- ✅ Comprehensive structured logging with rich context
- ✅ Error metrics enable trend analysis
- ✅ Alerting provides timely notification of issues
- ✅ Error aggregation helps identify patterns

## 🏛️ Exercise 5: Resilient System Design (120 minutes)

### Objective
Design and implement a complete resilient system that gracefully handles failures, provides meaningful user feedback, and maintains data consistency.

### Scenario: E-commerce Order Processing
Build a robust order processing system that handles inventory, payment, shipping, and notification failures gracefully while maintaining data consistency.

### System Requirements

#### Core Operations:
1. **Inventory Reservation**: Check and reserve items
2. **Payment Processing**: Charge customer payment method
3. **Shipping Arrangement**: Schedule delivery
4. **Customer Notification**: Send confirmation emails

#### Failure Scenarios to Handle:
1. **Inventory Shortage**: Partial or complete unavailability
2. **Payment Failures**: Declined cards, service outages
3. **Shipping Issues**: Carrier unavailability, address problems
4. **Notification Failures**: Email service outages

### Tasks

#### Part A: System Design (30 minutes)
1. **Design error handling strategy** for each operation
2. **Plan compensation logic** for partial failures
3. **Define consistency requirements** and transaction boundaries
4. **Create error recovery workflows**

#### Part B: Core Implementation (60 minutes)
1. **Implement order processing flow** with proper error handling
2. **Add compensation logic** for failed operations
3. **Include audit logging** for all state changes
4. **Implement idempotency** for retry safety

#### Part C: Resilience Patterns (30 minutes)
1. **Add timeout and retry** logic for external calls
2. **Implement circuit breakers** for each external dependency
3. **Create fallback mechanisms** for non-critical failures
4. **Add graceful degradation** for partial system failures

### Example Architecture:
```python
class OrderProcessor:
    def process_order(self, order: Order) -> OrderResult:
        """
        Process order with comprehensive error handling:
        1. Reserve inventory (compensatable)
        2. Process payment (compensatable)
        3. Arrange shipping (compensatable)
        4. Send notifications (best effort)
        """
        pass

class CompensationManager:
    def compensate_order(self, order: Order, completed_steps: List[str]):
        """
        Compensate completed operations when later steps fail
        """
        pass
```

#### Part D: Testing and Validation (20 minutes)
1. **Create error injection tests** for each failure scenario
2. **Validate compensation logic** works correctly
3. **Test end-to-end error scenarios**
4. **Verify monitoring and alerting**

### Success Criteria
- ✅ System handles all failure scenarios gracefully
- ✅ Data consistency is maintained through compensations
- ✅ Users receive meaningful feedback for all error conditions
- ✅ Operations team has visibility into system health
- ✅ System degrades gracefully under partial failures

## 🎯 Self-Assessment Questions

After completing the exercises, evaluate your understanding:

### Exception Design
- [ ] Can I design exception hierarchies that match caller needs?
- [ ] Do I create exceptions with rich context for debugging?
- [ ] Can I distinguish between recoverable and permanent errors?

### Resilience Patterns
- [ ] Do I implement appropriate retry logic for transient failures?
- [ ] Can I design and implement circuit breaker patterns?
- [ ] Do I understand when and how to use different resilience patterns?

### Error Monitoring
- [ ] Can I design structured logging that enables effective debugging?
- [ ] Do I create appropriate metrics and alerts for error conditions?
- [ ] Can I build error aggregation and analysis tools?

### System Design
- [ ] Can I design complete error handling strategies for complex systems?
- [ ] Do I understand compensation patterns for maintaining consistency?
- [ ] Can I implement graceful degradation under partial failures?

## 🚀 Next Steps

1. **Apply to your projects**: Look for opportunities to improve error handling in your current codebase
2. **Study the checklist**: Use `/principles/06-error-handling/checklist.md` for code reviews
3. **Practice more**: Create additional examples with different failure scenarios
4. **Advanced patterns**: Explore saga patterns, event sourcing for error recovery

**Target Mastery**: You should feel confident designing error handling strategies for complex systems and be able to build resilient applications that fail gracefully and recover automatically.
