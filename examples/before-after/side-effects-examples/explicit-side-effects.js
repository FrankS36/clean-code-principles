// ✅ GOOD EXAMPLE: Explicit Side Effects
// These functions clearly communicate their side effects through naming and design

// Solution 1: Separate query from side effects
function findUserInCache(userId) {
    // Pure query function - no side effects
    return globalUserCache.get(userId) || null;
}

function fetchUserFromAPI(userId) {
    // Clear that this makes an API call
    return fetch(`/api/users/${userId}`);
}

function cacheUser(userId, user) {
    // Clear that this modifies the cache
    globalUserCache.set(userId, user);
}

function trackUserAccess(userId, auditLog) {
    // Clear that this logs access
    auditLog.push({
        action: 'user_accessed',
        userId: userId,
        timestamp: new Date()
    });
}

function incrementApiCallCounter() {
    // Clear that this modifies a counter
    totalApiCalls++;
    return totalApiCalls;
}

async function getUserWithCachingAndTracking(userId, auditLog) {
    // Orchestration function - explicit about all operations
    incrementApiCallCounter();
    
    let user = findUserInCache(userId);
    if (!user) {
        user = await fetchUserFromAPI(userId);
        cacheUser(userId, user);
    }
    
    trackUserAccess(userId, auditLog);
    return user;
}

// Solution 2: Pure calculation separated from side effects
function calculateShippingCostOnly(order) {
    // Pure function - easy to test
    const baseRate = 5.99;
    const weight = order.items.reduce((sum, item) => sum + item.weight, 0);
    return baseRate + (weight * 0.5);
}

function saveShippingCalculationToDatabase(orderId, cost) {
    // Clear that this saves to database
    return database.saveShippingCalculation({
        orderId: orderId,
        cost: cost,
        calculatedAt: new Date()
    });
}

function logShippingCalculation(orderId, cost) {
    // Clear that this logs
    console.log(`Shipping calculated for order ${orderId}: $${cost}`);
}

function calculateAndRecordShippingCost(order) {
    // Orchestration function - explicit about all operations
    const cost = calculateShippingCostOnly(order);
    saveShippingCalculationToDatabase(order.id, cost);
    logShippingCalculation(order.id, cost);
    return cost;
}

// Solution 3: Input modification made explicit
function normalizeEmail(email) {
    // Clear that this transforms the input
    return email.trim().toLowerCase();
}

function isValidEmailFormat(email) {
    // Pure validation function
    return email.includes('@') && email.includes('.');
}

function logInvalidEmailAttempt(email, securityLog) {
    // Clear that this logs security events
    securityLog.logInvalidEmailAttempt(email, getClientIP());
}

function validateAndNormalizeEmail(email, securityLog) {
    // Clear that this both validates AND normalizes
    const normalizedEmail = normalizeEmail(email);
    const isValid = isValidEmailFormat(normalizedEmail);
    
    if (!isValid) {
        logInvalidEmailAttempt(normalizedEmail, securityLog);
    }
    
    return {
        email: normalizedEmail,
        isValid: isValid
    };
}

// Solution 4: Side effects separated and named clearly
function formatUserDisplayData(user) {
    // Pure formatting function
    return {
        displayName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        joinDate: formatDate(user.createdAt)
    };
}

function updateUserProfileViewTimestamp(user) {
    // Clear that this modifies the user object
    user.lastProfileView = new Date();
}

function triggerUserRecommendationUpdate(userId, recommendationEngine) {
    // Clear that this triggers external processing
    recommendationEngine.updateUserInteractions(userId, 'profile_view');
}

function recordProfileViewAnalytics(userId, analytics) {
    // Clear that this records analytics
    analytics.incrementProfileViews(userId);
}

function formatUserProfileWithTracking(user, recommendationEngine, analytics) {
    // Orchestration function - explicit about all operations
    const formattedProfile = formatUserDisplayData(user);
    
    updateUserProfileViewTimestamp(user);
    triggerUserRecommendationUpdate(user.id, recommendationEngine);
    recordProfileViewAnalytics(user.id, analytics);
    
    return formattedProfile;
}

// Solution 5: Creation separated from persistence
function buildOrderObject(orderData) {
    // Pure function - creates object without side effects
    return {
        id: generateOrderId(),
        ...orderData,
        status: 'pending',
        createdAt: new Date()
    };
}

function saveOrderToDatabase(order, database) {
    // Clear that this persists to database
    return database.orders.save(order);
}

function sendOrderConfirmationEmail(order, emailService) {
    // Clear that this sends email
    return emailService.sendOrderConfirmation(order.customerEmail, order);
}

function reserveOrderItems(order, inventory) {
    // Clear that this modifies inventory
    return inventory.reserveItems(order.items);
}

function startOrderWorkflow(orderId, orderWorkflow) {
    // Clear that this triggers workflow
    return orderWorkflow.start(orderId);
}

function createAndProcessOrder(orderData, database, emailService, inventory, orderWorkflow) {
    // Orchestration function - explicit about all operations
    const order = buildOrderObject(orderData);
    
    saveOrderToDatabase(order, database);
    sendOrderConfirmationEmail(order, emailService);
    reserveOrderItems(order, inventory);
    startOrderWorkflow(order.id, orderWorkflow);
    
    return order;
}

// Solution 6: Caching behavior made explicit
let configCache = null;

function loadConfigurationFromFile() {
    // Clear that this reads from file system
    const config = fs.readFileSync('config.json', 'utf8');
    return JSON.parse(config);
}

function isCacheValid(cache, maxAgeMs = 60000) {
    // Pure function to check cache validity
    return cache && cache.timestamp > Date.now() - maxAgeMs;
}

function cacheConfiguration(config) {
    // Clear that this updates the cache
    configCache = {
        data: config,
        timestamp: Date.now()
    };
}

function validateConfigurationAndLogWarnings(config) {
    // Clear that this validates and logs
    // Implementation would validate and log warnings
}

function loadConfigurationFromCache() {
    // Clear that this returns cached data
    return configCache ? configCache.data : null;
}

function loadConfigurationWithCaching() {
    // Clear that this uses caching strategy
    if (isCacheValid(configCache)) {
        return loadConfigurationFromCache();
    }
    
    const config = loadConfigurationFromFile();
    validateConfigurationAndLogWarnings(config);
    cacheConfiguration(config);
    
    return config;
}

// Solution 7: Payment processing with explicit notifications
function chargePaymentMethod(paymentData, paymentGateway) {
    // Clear that this charges payment
    return paymentGateway.charge(paymentData.cardToken, paymentData.amount);
}

function recordTransactionInUserAccount(transaction, userAccount) {
    // Clear that this modifies user account
    userAccount.addTransaction(transaction);
}

function sendPaymentReceipt(customerEmail, paymentResult, emailService) {
    // Clear that this sends email
    emailService.sendReceipt(customerEmail, paymentResult);
}

function awardLoyaltyPoints(userId, amount, loyaltyProgram) {
    // Clear that this awards points
    loyaltyProgram.awardPoints(userId, amount);
}

function logPaymentFailure(paymentData, error, securityLog) {
    // Clear that this logs security event
    securityLog.logFailedPayment(paymentData, error);
}

function notifyCustomerOfFailure(customerEmail, notificationService) {
    // Clear that this sends notification
    notificationService.alertCustomer(customerEmail, 'payment_failed');
}

function processPaymentWithNotifications(paymentData, dependencies) {
    // Orchestration function with explicit dependencies
    const { paymentGateway, userAccount, emailService, loyaltyProgram, securityLog, notificationService } = dependencies;
    
    const result = chargePaymentMethod(paymentData, paymentGateway);
    
    if (result.success) {
        const transaction = {
            type: 'payment',
            amount: paymentData.amount,
            timestamp: new Date()
        };
        
        recordTransactionInUserAccount(transaction, userAccount);
        sendPaymentReceipt(paymentData.customerEmail, result, emailService);
        awardLoyaltyPoints(paymentData.userId, paymentData.amount, loyaltyProgram);
    } else {
        logPaymentFailure(paymentData, result.error, securityLog);
        notifyCustomerOfFailure(paymentData.customerEmail, notificationService);
    }
    
    return result;
}

// Solution 8: Data access separated from tracking
function fetchUserPreferencesFromDatabase(userId, database) {
    // Clear that this queries database
    return database.getUserPreferences(userId);
}

function trackPreferencesAccess(userId, analytics) {
    // Clear that this records analytics
    analytics.track('preferences_accessed', {
        userId: userId,
        timestamp: new Date(),
        source: 'direct_access'
    });
}

function updateUserLastSeenTimestamp(userId, database) {
    // Clear that this updates database
    database.updateUserLastSeen(userId, new Date());
}

function refreshUserRecommendations(userId, personalizationEngine) {
    // Clear that this triggers personalization
    personalizationEngine.refreshRecommendations(userId);
}

function getUserPreferencesWithTracking(userId, dependencies) {
    // Orchestration function with explicit dependencies
    const { database, analytics, personalizationEngine } = dependencies;
    
    const preferences = fetchUserPreferencesFromDatabase(userId, database);
    
    trackPreferencesAccess(userId, analytics);
    updateUserLastSeenTimestamp(userId, database);
    refreshUserRecommendations(userId, personalizationEngine);
    
    return preferences;
}

// Key improvements in this version:
// 1. Function names clearly indicate what they do
// 2. Side effects are separated from pure logic
// 3. Dependencies are explicit and injectable
// 4. Each function has a single, clear responsibility
// 5. Orchestration functions coordinate multiple operations explicitly
// 6. Testing is easier because concerns are separated
// 7. No surprises - functions do exactly what their names suggest
