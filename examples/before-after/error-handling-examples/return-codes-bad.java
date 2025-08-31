// ❌ BAD: Return Codes - Error handling clutters business logic
// Makes code hard to read and maintain
// Easy to forget error checking
// No context about what went wrong

public class PaymentProcessor {
    // Error codes make the API unclear
    public static final int SUCCESS = 0;
    public static final int INVALID_PAYMENT_METHOD = -1;
    public static final int INSUFFICIENT_FUNDS = -2;
    public static final int PAYMENT_DECLINED = -3;
    public static final int NETWORK_ERROR = -4;
    public static final int PROCESSING_ERROR = -5;
    public static final int ACCOUNT_SUSPENDED = -6;
    public static final int INVALID_AMOUNT = -7;

    // Business logic is cluttered with error code checking
    public int processPayment(PaymentRequest request) {
        // Input validation clutters the start
        int validationResult = validatePaymentRequest(request);
        if (validationResult != SUCCESS) {
            logError("Validation failed: " + validationResult);
            return validationResult;
        }

        // Account checking with error codes
        int accountStatus = checkAccountStatus(request.getAccountId());
        if (accountStatus != SUCCESS) {
            logError("Account check failed: " + accountStatus);
            return accountStatus;
        }

        // Balance checking with more error codes
        int balanceCheck = checkAccountBalance(request.getAccountId(), request.getAmount());
        if (balanceCheck != SUCCESS) {
            logError("Balance check failed: " + balanceCheck);
            return balanceCheck;
        }

        // Payment gateway processing
        int gatewayResult = callPaymentGateway(request);
        if (gatewayResult != SUCCESS) {
            logError("Payment gateway failed: " + gatewayResult);
            return gatewayResult;
        }

        // Database update with error codes
        int dbResult = updateAccountBalance(request.getAccountId(), request.getAmount());
        if (dbResult != SUCCESS) {
            logError("Database update failed: " + dbResult);
            // Now we need to rollback the payment gateway transaction
            int rollbackResult = rollbackPaymentGateway(request);
            if (rollbackResult != SUCCESS) {
                logError("Rollback also failed: " + rollbackResult);
                // What do we return now? Multiple failures!
            }
            return dbResult;
        }

        // Transaction logging
        int logResult = logTransaction(request);
        if (logResult != SUCCESS) {
            logError("Transaction logging failed: " + logResult);
            // Do we rollback for logging failure? The business logic is unclear
        }

        return SUCCESS;
    }

    private int validatePaymentRequest(PaymentRequest request) {
        if (request == null) {
            return PROCESSING_ERROR;
        }
        if (request.getAmount() <= 0) {
            return INVALID_AMOUNT;
        }
        if (request.getPaymentMethod() == null) {
            return INVALID_PAYMENT_METHOD;
        }
        return SUCCESS;
    }

    private int checkAccountStatus(String accountId) {
        AccountInfo account = accountService.getAccount(accountId);
        if (account == null) {
            return PROCESSING_ERROR; // Generic error - no context
        }
        if (account.isSuspended()) {
            return ACCOUNT_SUSPENDED;
        }
        return SUCCESS;
    }

    private int checkAccountBalance(String accountId, double amount) {
        Double balance = accountService.getBalance(accountId);
        if (balance == null) {
            return PROCESSING_ERROR; // Another generic error
        }
        if (balance < amount) {
            return INSUFFICIENT_FUNDS;
        }
        return SUCCESS;
    }

    private int callPaymentGateway(PaymentRequest request) {
        try {
            PaymentGatewayResponse response = paymentGateway.charge(request);
            if (response.isDeclined()) {
                return PAYMENT_DECLINED;
            }
            if (!response.isSuccessful()) {
                return PROCESSING_ERROR; // Lost the specific error details
            }
            return SUCCESS;
        } catch (NetworkException e) {
            return NETWORK_ERROR;
        } catch (Exception e) {
            return PROCESSING_ERROR;
        }
    }

    private int updateAccountBalance(String accountId, double amount) {
        try {
            boolean success = accountService.debitAccount(accountId, amount);
            return success ? SUCCESS : PROCESSING_ERROR;
        } catch (Exception e) {
            return PROCESSING_ERROR;
        }
    }

    private int rollbackPaymentGateway(PaymentRequest request) {
        try {
            boolean success = paymentGateway.refund(request.getTransactionId());
            return success ? SUCCESS : PROCESSING_ERROR;
        } catch (Exception e) {
            return PROCESSING_ERROR;
        }
    }

    private int logTransaction(PaymentRequest request) {
        try {
            transactionLogger.log(request);
            return SUCCESS;
        } catch (Exception e) {
            return PROCESSING_ERROR;
        }
    }

    private void logError(String message) {
        System.err.println(message); // Poor logging
    }
}

// Usage is equally cluttered and error-prone
public class PaymentService {
    public void handlePayment(PaymentRequest request) {
        PaymentProcessor processor = new PaymentProcessor();
        int result = processor.processPayment(request);

        // Error handling clutters the calling code
        switch (result) {
            case PaymentProcessor.SUCCESS:
                sendPaymentConfirmation(request.getCustomerId());
                updateOrderStatus(request.getOrderId(), "PAID");
                break;
                
            case PaymentProcessor.INVALID_PAYMENT_METHOD:
                notifyCustomer(request.getCustomerId(), "Invalid payment method");
                updateOrderStatus(request.getOrderId(), "PAYMENT_FAILED");
                break;
                
            case PaymentProcessor.INSUFFICIENT_FUNDS:
                notifyCustomer(request.getCustomerId(), "Insufficient funds");
                updateOrderStatus(request.getOrderId(), "PAYMENT_FAILED");
                break;
                
            case PaymentProcessor.PAYMENT_DECLINED:
                notifyCustomer(request.getCustomerId(), "Payment was declined");
                updateOrderStatus(request.getOrderId(), "PAYMENT_FAILED");
                break;
                
            case PaymentProcessor.NETWORK_ERROR:
                // Should we retry? The error code doesn't tell us
                scheduleRetry(request);
                break;
                
            case PaymentProcessor.ACCOUNT_SUSPENDED:
                notifyCustomer(request.getCustomerId(), "Account is suspended");
                updateOrderStatus(request.getOrderId(), "ACCOUNT_ISSUE");
                break;
                
            default:
                // Generic handling for unknown errors
                notifyAdministrator("Unknown payment error: " + result);
                updateOrderStatus(request.getOrderId(), "SYSTEM_ERROR");
                break;
        }
    }

    // Helper methods omitted for brevity...
    private void sendPaymentConfirmation(String customerId) { }
    private void updateOrderStatus(String orderId, String status) { }
    private void notifyCustomer(String customerId, String message) { }
    private void scheduleRetry(PaymentRequest request) { }
    private void notifyAdministrator(String message) { }
}

// Problems with this approach:
// 1. Business logic is cluttered with error checking
// 2. Easy to forget to check return codes
// 3. No context about what specifically went wrong
// 4. Hard to handle multiple types of errors appropriately
// 5. Error information is lost (original exception details)
// 6. Difficult to implement proper retry logic
// 7. Code is hard to read and understand
// 8. Error handling is scattered throughout the codebase
// 9. Generic error codes lose valuable debugging information
// 10. Rollback logic becomes complex and error-prone

public class PaymentDemo {
    public static void main(String[] args) {
        PaymentRequest request = new PaymentRequest("12345", 100.0, "credit_card");
        PaymentService service = new PaymentService();
        
        // The calling code has no indication that this might fail
        // No compiler help to ensure error handling
        service.handlePayment(request);
        
        System.out.println("Problems with return code approach:");
        System.out.println("- Business logic cluttered with error checking");
        System.out.println("- Easy to forget error checking");
        System.out.println("- No context about specific failures");
        System.out.println("- Hard to handle different error types appropriately");
        System.out.println("- Lost exception details and stack traces");
        System.out.println("- Difficult to implement proper recovery strategies");
    }
}
