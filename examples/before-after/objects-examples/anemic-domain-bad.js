// ❌ BAD: Anemic Domain Model
// Business logic scattered across service classes
// Objects are just data holders with getters/setters
// Violates Tell Don't Ask principle

// Anemic domain objects - just data holders
class User {
    constructor() {
        this.id = '';
        this.name = '';
        this.email = '';
        this.isActive = true;
        this.loginAttempts = 0;
        this.lastLoginDate = null;
        this.subscriptionType = 'free';
        this.subscriptionExpiryDate = null;
    }

    // Only getters and setters - no behavior
    getId() { return this.id; }
    setId(id) { this.id = id; }
    
    getName() { return this.name; }
    setName(name) { this.name = name; }
    
    getEmail() { return this.email; }
    setEmail(email) { this.email = email; }
    
    getIsActive() { return this.isActive; }
    setIsActive(active) { this.isActive = active; }
    
    getLoginAttempts() { return this.loginAttempts; }
    setLoginAttempts(attempts) { this.loginAttempts = attempts; }
    
    getLastLoginDate() { return this.lastLoginDate; }
    setLastLoginDate(date) { this.lastLoginDate = date; }
    
    getSubscriptionType() { return this.subscriptionType; }
    setSubscriptionType(type) { this.subscriptionType = type; }
    
    getSubscriptionExpiryDate() { return this.subscriptionExpiryDate; }
    setSubscriptionExpiryDate(date) { this.subscriptionExpiryDate = date; }
}

class Order {
    constructor() {
        this.id = '';
        this.userId = '';
        this.items = [];
        this.status = 'pending';
        this.total = 0;
        this.discountAmount = 0;
        this.createdDate = new Date();
        this.shippingAddress = '';
        this.paymentMethod = '';
    }

    // Again, just getters and setters
    getId() { return this.id; }
    setId(id) { this.id = id; }
    
    getUserId() { return this.userId; }
    setUserId(userId) { this.userId = userId; }
    
    getItems() { return this.items; }
    setItems(items) { this.items = items; }
    
    getStatus() { return this.status; }
    setStatus(status) { this.status = status; }
    
    getTotal() { return this.total; }
    setTotal(total) { this.total = total; }
    
    // ... more getters/setters
}

// All business logic scattered in service classes
class UserService {
    constructor() {
        this.maxLoginAttempts = 3;
    }

    // Business logic for user authentication scattered here
    authenticateUser(user, password) {
        // Directly manipulating user state
        if (user.getLoginAttempts() >= this.maxLoginAttempts) {
            user.setIsActive(false);
            return { success: false, reason: 'Account locked' };
        }

        if (this.validatePassword(user, password)) {
            user.setLoginAttempts(0);
            user.setLastLoginDate(new Date());
            return { success: true };
        } else {
            user.setLoginAttempts(user.getLoginAttempts() + 1);
            return { success: false, reason: 'Invalid credentials' };
        }
    }

    // More business logic scattered across services
    canAccessPremiumFeatures(user) {
        if (user.getSubscriptionType() === 'free') return false;
        if (user.getSubscriptionType() === 'premium') {
            const now = new Date();
            return user.getSubscriptionExpiryDate() > now;
        }
        return false;
    }

    upgradeSubscription(user, newType, expiryDate) {
        if (!user.getIsActive()) {
            throw new Error('Cannot upgrade inactive user');
        }
        user.setSubscriptionType(newType);
        user.setSubscriptionExpiryDate(expiryDate);
    }

    validatePassword(user, password) {
        // Mock validation
        return password.length > 6;
    }
}

class OrderService {
    constructor() {
        this.taxRate = 0.08;
        this.freeShippingThreshold = 50;
    }

    // Business logic for orders scattered here
    calculateTotal(order) {
        let subtotal = 0;
        
        // Directly accessing and manipulating order data
        for (let item of order.getItems()) {
            subtotal += item.price * item.quantity;
        }
        
        const tax = subtotal * this.taxRate;
        const total = subtotal + tax - order.getDiscountAmount();
        
        // Directly setting the total
        order.setTotal(total);
        return total;
    }

    applyDiscount(order, discountCode) {
        let discountAmount = 0;
        
        // Business rules scattered in service
        if (discountCode === 'SAVE10') {
            discountAmount = order.getTotal() * 0.1;
        } else if (discountCode === 'FIRSTORDER' && this.isFirstOrder(order)) {
            discountAmount = Math.min(order.getTotal() * 0.2, 20);
        }
        
        order.setDiscountAmount(discountAmount);
        this.calculateTotal(order); // Recalculate
    }

    processOrder(order) {
        // More business logic scattered here
        if (order.getItems().length === 0) {
            throw new Error('Cannot process empty order');
        }
        
        this.calculateTotal(order);
        
        if (order.getTotal() >= this.freeShippingThreshold) {
            // Directly manipulating order state
            order.setStatus('processing_free_shipping');
        } else {
            order.setStatus('processing_paid_shipping');
        }
        
        // Send confirmation email
        this.sendOrderConfirmation(order);
    }

    isFirstOrder(order) {
        // Would need to query database to check
        return false; // Mock implementation
    }

    sendOrderConfirmation(order) {
        console.log(`Order confirmation sent for order ${order.getId()}`);
    }
}

// Usage demonstrates the problems
const userService = new UserService();
const orderService = new OrderService();

const user = new User();
user.setId('123');
user.setName('John Doe');
user.setEmail('john@example.com');

const order = new Order();
order.setUserId(user.getId());
order.setItems([
    { id: '1', name: 'Widget', price: 25, quantity: 2 },
    { id: '2', name: 'Gadget', price: 15, quantity: 1 }
]);

// Problems with this approach:
// 1. Business logic is scattered across service classes
// 2. Objects are just data holders with no behavior
// 3. Violates Tell Don't Ask - we're constantly asking objects for data to manipulate
// 4. No encapsulation - anyone can modify object state directly
// 5. Difficult to maintain invariants
// 6. Hard to test individual business rules
// 7. Coupling between services and domain object internals

orderService.processOrder(order);
userService.authenticateUser(user, 'password123');

// Anyone can break business rules by directly manipulating state
user.setLoginAttempts(-5); // This shouldn't be possible!
order.setTotal(-100);      // This breaks business invariants!

console.log('Problems with anemic domain model:');
console.log('- Business logic scattered across services');
console.log('- Objects are just data containers');
console.log('- No encapsulation or invariant protection');
console.log('- Violates Tell Don\'t Ask principle');
console.log('- Difficult to maintain and test');
