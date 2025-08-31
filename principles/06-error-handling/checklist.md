# Error Handling - Daily Checklist

Use this checklist for code reviews, design decisions, and daily development to ensure robust, maintainable error handling throughout your applications.

## 🎯 Quick Decision Guide

### When adding error handling, ask:
- **What can go wrong?** Identify all possible failure modes
- **How should it be handled?** Different errors need different strategies
- **Who needs to know?** Users, developers, operations teams
- **Can it be recovered?** Retry, fallback, or permanent failure
- **What context is needed?** For debugging and monitoring

**→ Retryable errors = Exponential backoff | Permanent errors = User feedback | System errors = Alerts**

## 📋 Pre-Commit Checklist

### ✅ Exception Usage

#### **Use Exceptions Instead of Return Codes**
- [ ] Exceptions are used for error conditions, not normal flow
- [ ] Business logic is clean and focused on happy path
- [ ] Return codes are not mixed with business data
- [ ] Error checking doesn't clutter the main logic
- [ ] Compiler helps enforce error handling (checked exceptions when appropriate)

#### **Exception Design**
- [ ] Exception classes are designed for caller needs
- [ ] Exception hierarchies enable appropriate handling
- [ ] Rich context is provided in exception messages
- [ ] Original exceptions are preserved in wrapped exceptions
- [ ] Exception names clearly indicate the error condition

#### **Proper Exception Handling**
- [ ] Specific exception types are caught instead of generic `Exception`
- [ ] Exceptions are not swallowed silently
- [ ] Each exception type has appropriate handling logic
- [ ] Resources are properly cleaned up in finally blocks
- [ ] Exception handling doesn't hide the original error

### ✅ Error Context and Logging

#### **Rich Error Context**
- [ ] Error messages include enough information for debugging
- [ ] Relevant parameters and state are included in error messages
- [ ] User-friendly messages are separate from technical details
- [ ] Correlation IDs are used for request tracing
- [ ] Error context includes operation and timing information

#### **Structured Logging**
- [ ] Errors are logged with structured data (JSON, key-value pairs)
- [ ] Log levels are used appropriately (ERROR, WARN, INFO, DEBUG)
- [ ] Sensitive information is not logged (passwords, tokens)
- [ ] Error logs include stack traces for unexpected errors
- [ ] Business context is included in error logs

### ✅ Resilience Patterns

#### **Retry Logic**
- [ ] Retry is only used for transient/recoverable errors
- [ ] Exponential backoff is implemented to avoid overwhelming systems
- [ ] Maximum retry limits prevent infinite loops
- [ ] Jitter is added to prevent thundering herd problems
- [ ] Non-retryable errors are identified and handled appropriately

#### **Circuit Breaker**
- [ ] Circuit breaker is used for external dependencies
- [ ] Failure thresholds are configured appropriately
- [ ] Recovery timeout allows for system healing
- [ ] Circuit breaker state is monitored and alerted
- [ ] Fallback mechanisms are provided when circuit is open

#### **Timeout Management**
- [ ] All external calls have appropriate timeouts
- [ ] Timeout values are configured based on SLA requirements
- [ ] Timeout errors are handled gracefully
- [ ] Operations can be cancelled when timeouts occur
- [ ] Cascading timeout effects are considered

## 🔍 Code Review Checklist

### **Look for these RED FLAGS:**

#### **Silent Failures**
- [ ] **Empty catch blocks**: `catch (Exception e) { }`
- [ ] **Generic error handling**: Treating all errors the same way
- [ ] **Lost context**: Error information is discarded
- [ ] **No logging**: Errors occur without any record
- [ ] **Return null**: Using null to indicate errors

#### **Poor Exception Design**
- [ ] **Exception for control flow**: Using exceptions for normal program flow
- [ ] **Too generic**: Only using base Exception class
- [ ] **No context**: Exception messages that don't help debugging
- [ ] **Broken hierarchies**: Exception inheritance that doesn't match usage
- [ ] **Swallowing exceptions**: Catching and not re-throwing appropriately

#### **Resource Leaks**
- [ ] **Missing finally blocks**: Resources not cleaned up on errors
- [ ] **Unclosed resources**: Files, connections, streams left open
- [ ] **Transaction leaks**: Database transactions not rolled back
- [ ] **Memory leaks**: Objects held longer than necessary due to error paths
- [ ] **Missing compensation**: Partial operations not cleaned up

### **Look for these GOOD PATTERNS:**

#### **Clean Error Handling**
- [ ] **Specific exceptions**: Using appropriate exception types
- [ ] **Rich context**: Error messages with debugging information
- [ ] **Proper propagation**: Exceptions bubble up with context
- [ ] **Resource cleanup**: Using try-with-resources or finally blocks
- [ ] **Separation of concerns**: Error handling separate from business logic

#### **Resilience Implementation**
- [ ] **Retry with backoff**: Exponential backoff for transient failures
- [ ] **Circuit breaker**: Protection against cascading failures
- [ ] **Graceful degradation**: Reduced functionality when components fail
- [ ] **Bulkhead isolation**: Failures in one area don't affect others
- [ ] **Monitoring integration**: Errors feed into monitoring systems

## 🎨 Exception Design Patterns

### **Exception Hierarchy Template**
```java
// Base exception with common functionality
public abstract class ServiceException extends Exception {
    private final String errorCode;
    private final Map<String, Object> context;
    
    protected ServiceException(String message, String errorCode, 
                             Map<String, Object> context, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.context = context != null ? new HashMap<>(context) : new HashMap<>();
    }
}

// Retryable errors
public class TransientServiceException extends ServiceException {
    private final Duration retryAfter;
    // Implementation...
}

// Permanent errors
public class PermanentServiceException extends ServiceException {
    private final String userMessage;
    // Implementation...
}
```

### **Structured Error Logging Template**
```python
import logging
import json
from datetime import datetime

def log_error(error, operation, user_id=None, request_id=None, **context):
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "level": "ERROR",
        "operation": operation,
        "error_type": type(error).__name__,
        "message": str(error),
        "user_id": user_id,
        "request_id": request_id,
        "context": context
    }
    
    if hasattr(error, '__traceback__'):
        log_entry["stack_trace"] = traceback.format_tb(error.__traceback__)
    
    logging.error(json.dumps(log_entry))
```

## ⚠️ Common Anti-Patterns to Avoid

### **Silent Failure**
```javascript
// ❌ BAD - Error is completely lost
try {
    processImportantData();
} catch (error) {
    // Silent failure
}

// ✅ GOOD - Error is logged and handled
try {
    processImportantData();
} catch (error) {
    logger.error('Failed to process important data', { error, operation: 'processImportantData' });
    throw new ProcessingException('Data processing failed', error);
}
```

### **Generic Exception Handling**
```java
// ❌ BAD - All errors treated the same
try {
    processPayment(payment);
} catch (Exception e) {
    return "Payment failed";
}

// ✅ GOOD - Specific handling for different errors
try {
    processPayment(payment);
} catch (InsufficientFundsException e) {
    return "Insufficient funds: " + e.getAvailableAmount();
} catch (PaymentDeclinedException e) {
    return "Payment declined: " + e.getReason();
} catch (NetworkException e) {
    scheduleRetry(payment);
    return "Payment is being processed, please wait";
}
```

### **Exception for Control Flow**
```python
# ❌ BAD - Using exceptions for normal flow
def get_user_preference(user_id, preference_name):
    try:
        return user_preferences[user_id][preference_name]
    except KeyError:
        return default_preferences[preference_name]

# ✅ GOOD - Normal flow without exceptions
def get_user_preference(user_id, preference_name):
    user_prefs = user_preferences.get(user_id, {})
    return user_prefs.get(preference_name, default_preferences[preference_name])
```

## 🧪 Testing Error Conditions

### **Error Injection Testing**
- [ ] Test all identified error conditions
- [ ] Verify error messages and context
- [ ] Ensure proper resource cleanup on errors
- [ ] Test retry and circuit breaker behavior
- [ ] Validate error monitoring and alerting

### **Integration Error Testing**
- [ ] Test network failure scenarios
- [ ] Verify database error handling
- [ ] Test external service failures
- [ ] Validate timeout behavior
- [ ] Test partial system failures

### **Recovery Testing**
- [ ] Test system recovery after failures
- [ ] Verify data consistency after errors
- [ ] Test compensation logic
- [ ] Validate monitoring recovery
- [ ] Test alert resolution

## 📊 Error Monitoring Checklist

### **Metrics to Track**
- [ ] Error rates by type and severity
- [ ] Error patterns and trends
- [ ] Recovery times and success rates
- [ ] Circuit breaker state changes
- [ ] Retry attempt statistics

### **Alerting Rules**
- [ ] High error rates (> 5% of requests)
- [ ] Critical errors (data corruption, security)
- [ ] Circuit breaker state changes
- [ ] Repeated failures for same operation
- [ ] System-wide error spikes

### **Dashboard Elements**
- [ ] Real-time error rates
- [ ] Error distribution by type
- [ ] System health indicators
- [ ] Recovery trend analysis
- [ ] Top error patterns

## 📊 Self-Assessment Scoring

Rate yourself on each area (1-5 scale):

### **Exception Design**
- [ ] I design exception hierarchies that match caller needs
- [ ] I provide rich context in all error messages
- [ ] I distinguish between recoverable and permanent errors
- [ ] I avoid using exceptions for normal control flow
- [ ] I create user-friendly error messages separate from technical details

### **Error Resilience**
- [ ] I implement appropriate retry logic with exponential backoff
- [ ] I use circuit breaker patterns for external dependencies
- [ ] I design graceful degradation for partial system failures
- [ ] I implement proper timeout management
- [ ] I create bulkhead isolation between system components

### **Error Monitoring**
- [ ] I implement comprehensive structured logging
- [ ] I create appropriate error metrics and alerts
- [ ] I track error patterns and trends
- [ ] I provide actionable error information for debugging
- [ ] I integrate error handling with monitoring systems

### **System Design**
- [ ] I identify all possible failure modes in system design
- [ ] I implement compensation patterns for maintaining consistency
- [ ] I design error handling strategies appropriate for each component
- [ ] I test all error scenarios comprehensively
- [ ] I create runbooks for error response and recovery

**Target Score**: 4-5 in all areas before moving to next principle

## 💡 Daily Practice Tips

1. **Morning Review**: Before coding, identify what could go wrong in today's work
2. **Error-First Design**: When designing new features, consider error scenarios first
3. **Log Review**: Regularly review error logs to identify patterns
4. **Failure Testing**: Regularly test failure scenarios in development
5. **Recovery Drills**: Practice error recovery procedures with your team

## 🎯 Quick Reference

**Use Exceptions**: For error conditions, not normal flow  
**Rich Context**: Error messages should enable debugging  
**Specific Handling**: Different errors need different responses  
**Fail Fast**: Detect errors as early as possible  
**Monitor Everything**: Track error patterns and system health  
**Test Failures**: Validate error scenarios work correctly  
**Plan Recovery**: Design for graceful failure and recovery  

Remember: Good error handling makes systems reliable, debuggable, and maintainable!
