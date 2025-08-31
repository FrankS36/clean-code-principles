// ✅ GOOD: Clean Exception Handling - Business logic is clear and focused
// Exceptions separate error handling from happy path
// Rich error context for debugging
// Type-safe error handling with compiler support

// Exception hierarchy designed for caller needs
abstract class PaymentException extends Exception {
    private final String transactionId;
    private final PaymentRequest originalRequest;
    
    public PaymentException(String message, String transactionId, PaymentRequest request) {
        super(message);
        this.transactionId = transactionId;
        this.originalRequest = request;
    }
    
    public PaymentException(String message, Throwable cause, String transactionId, PaymentRequest request) {
        super(message, cause);
        this.transactionId = transactionId;
        this.originalRequest = request;
    }
    
    public String getTransactionId() { return transactionId; }
    public PaymentRequest getOriginalRequest() { return originalRequest; }
}

// Retryable errors - network issues, temporary service unavailability
class RetryablePaymentException extends PaymentException {
    private final int retryAfterSeconds;
    
    public RetryablePaymentException(String message, String transactionId, PaymentRequest request, int retryAfterSeconds) {
        super(message, transactionId, request);
        this.retryAfterSeconds = retryAfterSeconds;
    }
    
    public RetryablePaymentException(String message, Throwable cause, String transactionId, PaymentRequest request, int retryAfterSeconds) {
        super(message, cause, transactionId, request);
        this.retryAfterSeconds = retryAfterSeconds;
    }
    
    public int getRetryAfterSeconds() { return retryAfterSeconds; }
}

// Permanent errors - declined cards, insufficient funds, invalid data
class PermanentPaymentException extends PaymentException {
    private final String errorCode;
    private final String userFriendlyMessage;
    
    public PermanentPaymentException(String message, String errorCode, String userMessage, String transactionId, PaymentRequest request) {
        super(message, transactionId, request);
        this.errorCode = errorCode;
        this.userFriendlyMessage = userMessage;
    }
    
    public String getErrorCode() { return errorCode; }
    public String getUserFriendlyMessage() { return userFriendlyMessage; }
}

// Specific exception types for different error conditions
class InsufficientFundsException extends PermanentPaymentException {
    private final double availableBalance;
    private final double requestedAmount;
    
    public InsufficientFundsException(double available, double requested, String transactionId, PaymentRequest request) {
        super(
            String.format("Insufficient funds: requested %.2f, available %.2f", requested, available),
            "INSUFFICIENT_FUNDS",
            "Your account doesn't have enough funds for this transaction.",
            transactionId,
            request
        );
        this.availableBalance = available;
        this.requestedAmount = requested;
    }
    
    public double getAvailableBalance() { return availableBalance; }
    public double getRequestedAmount() { return requestedAmount; }
}

class PaymentDeclinedException extends PermanentPaymentException {
    private final String declineReason;
    
    public PaymentDeclinedException(String reason, String transactionId, PaymentRequest request) {
        super(
            "Payment was declined: " + reason,
            "PAYMENT_DECLINED",
            "Your payment was declined. Please try a different payment method.",
            transactionId,
            request
        );
        this.declineReason = reason;
    }
    
    public String getDeclineReason() { return declineReason; }
}

class AccountSuspendedException extends PermanentPaymentException {
    private final String suspensionReason;
    private final Date suspendedUntil;
    
    public AccountSuspendedException(String reason, Date until, String transactionId, PaymentRequest request) {
        super(
            "Account is suspended: " + reason,
            "ACCOUNT_SUSPENDED",
            "Your account is temporarily suspended. Please contact customer support.",
            transactionId,
            request
        );
        this.suspensionReason = reason;
        this.suspendedUntil = until;
    }
    
    public String getSuspensionReason() { return suspensionReason; }
    public Date getSuspendedUntil() { return suspendedUntil; }
}

class PaymentValidationException extends PermanentPaymentException {
    private final List<String> validationErrors;
    
    public PaymentValidationException(List<String> errors, String transactionId, PaymentRequest request) {
        super(
            "Payment validation failed: " + String.join(", ", errors),
            "VALIDATION_ERROR",
            "Please check your payment details and try again.",
            transactionId,
            request
        );
        this.validationErrors = new ArrayList<>(errors);
    }
    
    public List<String> getValidationErrors() { return new ArrayList<>(validationErrors); }
}

// Clean payment processor with focused business logic
public class PaymentProcessor {
    private final AccountService accountService;
    private final PaymentGateway paymentGateway;
    private final TransactionLogger transactionLogger;
    private final Logger logger;
    
    public PaymentProcessor(AccountService accountService, PaymentGateway paymentGateway, 
                          TransactionLogger transactionLogger, Logger logger) {
        this.accountService = accountService;
        this.paymentGateway = paymentGateway;
        this.transactionLogger = transactionLogger;
        this.logger = logger;
    }
    
    // Clean business logic - happy path is obvious
    public PaymentResult processPayment(PaymentRequest request) throws PaymentException {
        String transactionId = generateTransactionId();
        
        try {
            // Validate input - fail fast
            validatePaymentRequest(request, transactionId);
            
            // Check account status
            AccountInfo account = getValidAccount(request.getAccountId(), transactionId, request);
            
            // Verify sufficient funds
            verifyAccountBalance(account, request.getAmount(), transactionId, request);
            
            // Process payment through gateway
            PaymentGatewayResponse gatewayResponse = processGatewayPayment(request, transactionId);
            
            // Update account balance
            updateAccountBalance(request.getAccountId(), request.getAmount(), transactionId, request);
            
            // Log transaction
            logSuccessfulTransaction(request, transactionId, gatewayResponse);
            
            return new PaymentResult(transactionId, gatewayResponse.getGatewayTransactionId(), 
                                   request.getAmount(), account.getNewBalance());
            
        } catch (PaymentException e) {
            // Log the error with full context
            logPaymentError(e, request, transactionId);
            throw e; // Re-throw to let caller handle appropriately
        } catch (Exception e) {
            // Wrap unexpected exceptions with context
            String message = "Unexpected error during payment processing";
            logger.error(message, e);
            throw new RetryablePaymentException(message, e, transactionId, request, 60);
        }
    }
    
    private void validatePaymentRequest(PaymentRequest request, String transactionId) 
            throws PaymentValidationException {
        List<String> errors = new ArrayList<>();
        
        if (request == null) {
            errors.add("Payment request cannot be null");
        } else {
            if (request.getAmount() <= 0) {
                errors.add("Payment amount must be positive");
            }
            if (request.getAmount() > 10000) {
                errors.add("Payment amount exceeds maximum limit of $10,000");
            }
            if (request.getAccountId() == null || request.getAccountId().trim().isEmpty()) {
                errors.add("Account ID is required");
            }
            if (request.getPaymentMethod() == null) {
                errors.add("Payment method is required");
            }
        }
        
        if (!errors.isEmpty()) {
            throw new PaymentValidationException(errors, transactionId, request);
        }
    }
    
    private AccountInfo getValidAccount(String accountId, String transactionId, PaymentRequest request) 
            throws PaymentException {
        try {
            AccountInfo account = accountService.getAccount(accountId);
            if (account == null) {
                throw new PermanentPaymentException(
                    "Account not found: " + accountId,
                    "ACCOUNT_NOT_FOUND",
                    "The specified account was not found.",
                    transactionId,
                    request
                );
            }
            
            if (account.isSuspended()) {
                throw new AccountSuspendedException(
                    account.getSuspensionReason(),
                    account.getSuspendedUntil(),
                    transactionId,
                    request
                );
            }
            
            return account;
            
        } catch (PaymentException e) {
            throw e; // Re-throw payment exceptions
        } catch (Exception e) {
            throw new RetryablePaymentException(
                "Failed to retrieve account information: " + e.getMessage(),
                e,
                transactionId,
                request,
                30
            );
        }
    }
    
    private void verifyAccountBalance(AccountInfo account, double amount, String transactionId, 
                                    PaymentRequest request) throws InsufficientFundsException {
        if (account.getBalance() < amount) {
            throw new InsufficientFundsException(
                account.getBalance(),
                amount,
                transactionId,
                request
            );
        }
    }
    
    private PaymentGatewayResponse processGatewayPayment(PaymentRequest request, String transactionId) 
            throws PaymentException {
        try {
            PaymentGatewayResponse response = paymentGateway.charge(request);
            
            if (response.isDeclined()) {
                throw new PaymentDeclinedException(response.getDeclineReason(), transactionId, request);
            }
            
            if (!response.isSuccessful()) {
                throw new RetryablePaymentException(
                    "Payment gateway processing failed: " + response.getErrorMessage(),
                    transactionId,
                    request,
                    60
                );
            }
            
            return response;
            
        } catch (PaymentException e) {
            throw e; // Re-throw payment exceptions
        } catch (NetworkException e) {
            throw new RetryablePaymentException(
                "Network error communicating with payment gateway",
                e,
                transactionId,
                request,
                30
            );
        } catch (Exception e) {
            throw new RetryablePaymentException(
                "Unexpected error from payment gateway: " + e.getMessage(),
                e,
                transactionId,
                request,
                60
            );
        }
    }
    
    private void updateAccountBalance(String accountId, double amount, String transactionId, 
                                    PaymentRequest request) throws PaymentException {
        try {
            boolean success = accountService.debitAccount(accountId, amount);
            if (!success) {
                throw new RetryablePaymentException(
                    "Failed to update account balance",
                    transactionId,
                    request,
                    30
                );
            }
        } catch (Exception e) {
            // This is critical - we need to rollback the gateway transaction
            rollbackGatewayTransaction(transactionId, request);
            throw new RetryablePaymentException(
                "Database error updating account balance: " + e.getMessage(),
                e,
                transactionId,
                request,
                60
            );
        }
    }
    
    private void rollbackGatewayTransaction(String transactionId, PaymentRequest request) {
        try {
            paymentGateway.refund(transactionId);
            logger.info("Successfully rolled back gateway transaction: " + transactionId);
        } catch (Exception e) {
            logger.error("CRITICAL: Failed to rollback gateway transaction: " + transactionId, e);
            // Alert administrators immediately
            alertAdministrators("Failed gateway rollback", transactionId, e);
        }
    }
    
    private void logSuccessfulTransaction(PaymentRequest request, String transactionId, 
                                        PaymentGatewayResponse response) {
        try {
            transactionLogger.logSuccess(request, transactionId, response);
        } catch (Exception e) {
            // Logging failure shouldn't fail the payment
            logger.warn("Failed to log successful transaction: " + transactionId, e);
        }
    }
    
    private void logPaymentError(PaymentException e, PaymentRequest request, String transactionId) {
        Map<String, Object> context = new HashMap<>();
        context.put("transactionId", transactionId);
        context.put("accountId", request.getAccountId());
        context.put("amount", request.getAmount());
        context.put("paymentMethod", request.getPaymentMethod());
        context.put("exceptionType", e.getClass().getSimpleName());
        
        logger.error("Payment processing failed: " + e.getMessage(), e, context);
    }
    
    private String generateTransactionId() {
        return "txn_" + UUID.randomUUID().toString();
    }
    
    private void alertAdministrators(String message, String transactionId, Exception error) {
        // Implementation would send alerts to administrators
    }
}

// Clean usage with proper exception handling
public class PaymentService {
    private final PaymentProcessor processor;
    private final NotificationService notificationService;
    private final OrderService orderService;
    private final RetryScheduler retryScheduler;
    
    public PaymentService(PaymentProcessor processor, NotificationService notificationService,
                         OrderService orderService, RetryScheduler retryScheduler) {
        this.processor = processor;
        this.notificationService = notificationService;
        this.orderService = orderService;
        this.retryScheduler = retryScheduler;
    }
    
    public void handlePayment(PaymentRequest request) {
        try {
            // Clean business logic - no error checking clutter
            PaymentResult result = processor.processPayment(request);
            
            // Handle success
            notificationService.sendPaymentConfirmation(request.getCustomerId(), result);
            orderService.updateOrderStatus(request.getOrderId(), OrderStatus.PAID);
            
        } catch (InsufficientFundsException e) {
            // Specific handling for insufficient funds
            notificationService.notifyInsufficientFunds(
                request.getCustomerId(), 
                e.getAvailableBalance(), 
                e.getRequestedAmount()
            );
            orderService.updateOrderStatus(request.getOrderId(), OrderStatus.PAYMENT_FAILED);
            
        } catch (PaymentDeclinedException e) {
            // Specific handling for declined payments
            notificationService.notifyPaymentDeclined(request.getCustomerId(), e.getUserFriendlyMessage());
            orderService.updateOrderStatus(request.getOrderId(), OrderStatus.PAYMENT_FAILED);
            
        } catch (AccountSuspendedException e) {
            // Specific handling for suspended accounts
            notificationService.notifyAccountSuspended(request.getCustomerId(), e.getSuspendedUntil());
            orderService.updateOrderStatus(request.getOrderId(), OrderStatus.ACCOUNT_ISSUE);
            
        } catch (PaymentValidationException e) {
            // Specific handling for validation errors
            notificationService.notifyValidationErrors(request.getCustomerId(), e.getValidationErrors());
            orderService.updateOrderStatus(request.getOrderId(), OrderStatus.INVALID_PAYMENT);
            
        } catch (RetryablePaymentException e) {
            // Handle retryable errors with exponential backoff
            retryScheduler.scheduleRetry(request, e.getRetryAfterSeconds());
            orderService.updateOrderStatus(request.getOrderId(), OrderStatus.PAYMENT_RETRY);
            
        } catch (PermanentPaymentException e) {
            // Handle other permanent errors
            notificationService.notifyPaymentError(request.getCustomerId(), e.getUserFriendlyMessage());
            orderService.updateOrderStatus(request.getOrderId(), OrderStatus.PAYMENT_FAILED);
        }
    }
}

// Benefits of exception-based approach:
public class PaymentDemo {
    public static void main(String[] args) {
        System.out.println("Benefits of exception-based error handling:");
        System.out.println("✅ Business logic is clean and focused");
        System.out.println("✅ Error handling is separated from happy path");
        System.out.println("✅ Rich error context for debugging");
        System.out.println("✅ Type-safe error handling with compiler support");
        System.out.println("✅ Specific error types enable appropriate handling");
        System.out.println("✅ Exception hierarchies match caller needs");
        System.out.println("✅ Automatic stack traces for debugging");
        System.out.println("✅ Easier to implement retry and recovery logic");
        System.out.println("✅ Error information is preserved through call stack");
        System.out.println("✅ More maintainable and testable code");
    }
}
