// ❌ BAD EXAMPLE: Hidden Side Effects
// These functions have side effects that aren't obvious from their names

let globalUserCache = new Map();
let totalApiCalls = 0;
let auditLog = [];

// Problem 1: Function that sounds like a query but modifies state
function getUser(userId) {
    // Sounds like it just returns a user, but...
    totalApiCalls++;  // Hidden side effect: modifies global counter
    
    if (globalUserCache.has(userId)) {
        return globalUserCache.get(userId);
    }
    
    const user = fetch(`/api/users/${userId}`);
    globalUserCache.set(userId, user);  // Hidden side effect: modifies cache
    
    // Hidden side effect: writes to audit log
    auditLog.push({
        action: 'user_accessed',
        userId: userId,
        timestamp: new Date()
    });
    
    return user;
}

// Problem 2: Function that sounds pure but has I/O side effects
function calculateShippingCost(order) {
    // Sounds like pure calculation, but...
    const baseRate = 5.99;
    const weight = order.items.reduce((sum, item) => sum + item.weight, 0);
    const cost = baseRate + (weight * 0.5);
    
    // Hidden side effect: saves calculation to database for analytics
    database.saveShippingCalculation({
        orderId: order.id,
        cost: cost,
        calculatedAt: new Date()
    });
    
    // Hidden side effect: logs for monitoring
    console.log(`Shipping calculated for order ${order.id}: $${cost}`);
    
    return cost;
}

// Problem 3: Function that modifies its input parameter
function validateEmail(email) {
    // Sounds like it just validates, but...
    email = email.trim().toLowerCase();  // Hidden side effect: modifies input
    
    const isValid = email.includes('@') && email.includes('.');
    
    if (!isValid) {
        // Hidden side effect: logs invalid attempts
        securityLog.logInvalidEmailAttempt(email, getClientIP());
    }
    
    return isValid;
}

// Problem 4: Function with cascading side effects
function formatUserProfile(user) {
    // Sounds like it just formats data, but...
    const formatted = {
        displayName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        joinDate: formatDate(user.createdAt)
    };
    
    // Hidden side effect: updates last profile view
    user.lastProfileView = new Date();
    
    // Hidden side effect: triggers recommendation engine
    recommendationEngine.updateUserInteractions(user.id, 'profile_view');
    
    // Hidden side effect: increments view counter
    analytics.incrementProfileViews(user.id);
    
    return formatted;
}

// Problem 5: Function that sounds like it creates but also saves
function createOrder(orderData) {
    // Name suggests it creates an order object, but...
    const order = {
        id: generateOrderId(),
        ...orderData,
        status: 'pending',
        createdAt: new Date()
    };
    
    // Hidden side effect: immediately saves to database
    database.orders.save(order);
    
    // Hidden side effect: sends confirmation email
    emailService.sendOrderConfirmation(order.customerEmail, order);
    
    // Hidden side effect: updates inventory
    inventory.reserveItems(order.items);
    
    // Hidden side effect: triggers workflow
    orderWorkflow.start(order.id);
    
    return order;
}

// Problem 6: Function that caches but doesn't indicate it
function loadConfiguration() {
    // Sounds like it loads fresh config, but...
    
    // Hidden side effect: uses and modifies global cache
    if (configCache && configCache.timestamp > Date.now() - 60000) {
        return configCache.data;  // Returns cached version
    }
    
    const config = fs.readFileSync('config.json', 'utf8');
    const parsed = JSON.parse(config);
    
    // Hidden side effect: caches for future calls
    configCache = {
        data: parsed,
        timestamp: Date.now()
    };
    
    // Hidden side effect: validates and logs warnings
    validateConfigurationAndLogWarnings(parsed);
    
    return parsed;
}

// Problem 7: Function that processes and notifies
function processPayment(paymentData) {
    // Sounds like it processes payment, but also does more...
    const result = paymentGateway.charge(paymentData.cardToken, paymentData.amount);
    
    if (result.success) {
        // Hidden side effect: updates user account
        userAccount.addTransaction({
            type: 'payment',
            amount: paymentData.amount,
            timestamp: new Date()
        });
        
        // Hidden side effect: sends receipt
        emailService.sendReceipt(paymentData.customerEmail, result);
        
        // Hidden side effect: triggers loyalty points
        loyaltyProgram.awardPoints(paymentData.userId, paymentData.amount);
    } else {
        // Hidden side effect: logs failure
        securityLog.logFailedPayment(paymentData, result.error);
        
        // Hidden side effect: sends notification
        notificationService.alertCustomer(paymentData.customerEmail, 'payment_failed');
    }
    
    return result;
}

// Problem 8: Function that gets data but also tracks
function getUserPreferences(userId) {
    // Sounds like a simple getter, but...
    const preferences = database.getUserPreferences(userId);
    
    // Hidden side effect: tracks access for analytics
    analytics.track('preferences_accessed', {
        userId: userId,
        timestamp: new Date(),
        source: 'direct_access'
    });
    
    // Hidden side effect: updates last accessed timestamp
    database.updateUserLastSeen(userId, new Date());
    
    // Hidden side effect: triggers personalization updates
    personalizationEngine.refreshRecommendations(userId);
    
    return preferences;
}

// These functions are problematic because:
// 1. Their names don't reveal all the things they do
// 2. Callers are surprised by side effects
// 3. Testing is difficult due to hidden dependencies
// 4. Debugging is harder when side effects aren't obvious
// 5. Refactoring is risky because you might break hidden behaviors
