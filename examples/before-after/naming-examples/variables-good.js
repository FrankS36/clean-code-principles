// ✅ GOOD EXAMPLE: Meaningful Variable Naming
// This code demonstrates clean, intention-revealing variable names

// Solution 1: Descriptive names that reveal intent
let currentDate = new Date();
let currentUser = getCurrentUser();
let totalPrice = calculatePrice(cart);

// Solution 2: Full words instead of abbreviations
let user = getUser();
let homeAddress = user.getHomeAddress();
let phoneNumber = user.getPhoneNumber();
let quantity = item.getQuantity();

// Solution 3: Descriptive names that indicate content
let userData = fetchUserData();
let productCatalog = fetchProductData();
let orderHistory = fetchOrderData();

// Solution 4: Names that match the actual data structure
let currentUser = getCurrentUser(); // returns single user object
let selectedProduct = findProduct(id); // returns single product
let latestOrder = getLatestOrder(); // returns single order

// Solution 5: Named constants for magic numbers
const LARGE_ORDER_THRESHOLD = 1000;
const VOLUME_DISCOUNT_RATE = 0.15;

function processPayment(amount) {
    if (amount > LARGE_ORDER_THRESHOLD) {
        return applyDiscountRate(amount, VOLUME_DISCOUNT_RATE);
    }
    return amount;
}

// Solution 6: Intention-revealing names for each step
let userApiResponse = api.fetch('/users/123');
let userProfile = parseUserData(userApiResponse);
let validatedProfile = validateUserProfile(userProfile);
let enrichedProfile = enrichWithPreferences(validatedProfile);

// Solution 7: Modern naming without type prefixes
let firstName = "John";
let age = 25;
let isActive = true;
let products = [];

// Solution 8: Specific names without noise words
let user = getUser();
let userProfile = user.getProfile();
let userAccount = new User();
let product = getProduct();

// Solution 9: Context-revealing function names
function validateEmailAddress(emailInput) {
    return emailInput.includes('@') && emailInput.includes('.');
}

function markOrderAsCompleted(order) {
    order.status = 'completed';
    order.completedAt = new Date();
    return order;
}

// Solution 10: Consistent vocabulary throughout
class UserService {
    getUser(id) { /* retrieves user */ }
    getUserProfile(id) { /* retrieves profile - consistent with get */ }
    getUserSettings(id) { /* retrieves settings - consistent vocabulary */ }
    getUserPreferences(id) { /* retrieves preferences - same pattern */ }
}

// Solution 11: Names that clearly indicate purpose
let isPaymentProcessingEnabled = true;
let activeUserCount = 0;
let orderProcessingStatus = 'pending';

// Solution 12: Business domain terms for business concepts
let customer = getCustomerRecord(id);
let orderSummary = api.getOrderSummary('/orders/123');
let paymentResult = processPayment(paymentRequest);

// Additional examples of good naming practices

// Boolean variables with clear yes/no meaning
let hasValidEmail = validateEmail(user.email);
let isEligibleForDiscount = checkDiscountEligibility(user);
let canProcessPayment = verifyPaymentMethod(paymentInfo);

// Collections with descriptive names
let pendingOrders = orders.filter(order => order.status === 'pending');
let premiumCustomers = customers.filter(customer => customer.tier === 'premium');
let expiredSubscriptions = subscriptions.filter(sub => sub.expiresAt < new Date());

// Function names that describe exact behavior
function calculateMonthlySubscriptionFee(user, plan) {
    return plan.basePrice * (1 - user.discountRate);
}

function sendWelcomeEmailToNewUser(user) {
    const emailContent = buildWelcomeEmail(user);
    return emailService.send(user.email, emailContent);
}

function logUserLoginAttempt(username, isSuccessful, ipAddress) {
    const logEntry = {
        username,
        success: isSuccessful,
        timestamp: new Date(),
        sourceIp: ipAddress
    };
    logger.info('User login attempt', logEntry);
}

// This code is self-documenting and easy to understand
// The reader can immediately understand what each variable represents
// and what each function does without needing additional context
