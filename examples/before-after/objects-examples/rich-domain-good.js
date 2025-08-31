// ✅ GOOD: Rich Domain Model
// Business logic encapsulated within domain objects
// Objects control their own state and maintain invariants
// Follows Tell Don't Ask principle

// Rich domain object with encapsulated behavior
class User {
    constructor(id, name, email) {
        this._id = id;
        this._name = name;
        this._email = email;
        this._isActive = true;
        this._loginAttempts = 0;
        this._lastLoginDate = null;
        this._subscription = new Subscription('free');
        
        this._validateEmail(email);
    }

    // Expose behavior, not data
    authenticate(password) {
        if (!this._isActive) {
            return AuthenticationResult.accountLocked();
        }

        if (this._loginAttempts >= 3) {
            this._deactivate();
            return AuthenticationResult.accountLocked();
        }

        if (this._isValidPassword(password)) {
            this._resetLoginAttempts();
            this._updateLastLogin();
            return AuthenticationResult.success();
        } else {
            this._incrementLoginAttempts();
            return AuthenticationResult.invalidCredentials();
        }
    }

    upgradeSubscription(subscriptionType, expiryDate) {
        if (!this._isActive) {
            throw new Error('Cannot upgrade inactive user subscription');
        }
        this._subscription = new Subscription(subscriptionType, expiryDate);
    }

    canAccessPremiumFeatures() {
        return this._subscription.isPremiumActive();
    }

    // Controlled access to necessary data
    get id() { return this._id; }
    get name() { return this._name; }
    get email() { return this._email; }
    get isActive() { return this._isActive; }

    // Private methods to maintain encapsulation
    _validateEmail(email) {
        if (!email || !email.includes('@')) {
            throw new Error('Invalid email address');
        }
    }

    _isValidPassword(password) {
        return password && password.length > 6;
    }

    _resetLoginAttempts() {
        this._loginAttempts = 0;
    }

    _incrementLoginAttempts() {
        this._loginAttempts++;
    }

    _updateLastLogin() {
        this._lastLoginDate = new Date();
    }

    _deactivate() {
        this._isActive = false;
    }
}

// Value object for subscription logic
class Subscription {
    constructor(type, expiryDate = null) {
        this._type = type;
        this._expiryDate = expiryDate;
        this._validateSubscription(type, expiryDate);
    }

    isPremiumActive() {
        if (this._type === 'free') return false;
        if (this._type === 'premium') {
            return !this._expiryDate || this._expiryDate > new Date();
        }
        return false;
    }

    get type() { return this._type; }
    get expiryDate() { return this._expiryDate; }

    _validateSubscription(type, expiryDate) {
        const validTypes = ['free', 'premium'];
        if (!validTypes.includes(type)) {
            throw new Error(`Invalid subscription type: ${type}`);
        }
        if (type === 'premium' && !expiryDate) {
            throw new Error('Premium subscription requires expiry date');
        }
    }
}

// Result object for authentication
class AuthenticationResult {
    constructor(success, reason = null) {
        this._success = success;
        this._reason = reason;
    }

    static success() {
        return new AuthenticationResult(true);
    }

    static accountLocked() {
        return new AuthenticationResult(false, 'Account locked due to too many failed attempts');
    }

    static invalidCredentials() {
        return new AuthenticationResult(false, 'Invalid credentials');
    }

    get isSuccess() { return this._success; }
    get reason() { return this._reason; }
}

// Rich domain object for orders
class Order {
    constructor(id, userId) {
        this._id = id;
        this._userId = userId;
        this._items = [];
        this._status = 'pending';
        this._discountAmount = 0;
        this._createdDate = new Date();
        this._taxRate = 0.08;
        this._freeShippingThreshold = 50;
    }

    addItem(product, quantity) {
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }

        const existingItem = this._findItem(product.id);
        if (existingItem) {
            existingItem.increaseQuantity(quantity);
        } else {
            this._items.push(new OrderItem(product, quantity));
        }
    }

    applyDiscount(discountCode) {
        const discount = this._calculateDiscount(discountCode);
        this._discountAmount = discount;
        return discount > 0;
    }

    process() {
        this._validateForProcessing();
        
        if (this._qualifiesForFreeShipping()) {
            this._status = 'processing_free_shipping';
        } else {
            this._status = 'processing_paid_shipping';
        }

        return new OrderProcessingResult(true, this._calculateTotal());
    }

    calculateTotal() {
        return this._calculateTotal();
    }

    // Controlled access to necessary data
    get id() { return this._id; }
    get userId() { return this._userId; }
    get status() { return this._status; }
    get itemCount() { return this._items.length; }
    get createdDate() { return this._createdDate; }

    // Private methods maintain business logic encapsulation
    _findItem(productId) {
        return this._items.find(item => item.productId === productId);
    }

    _calculateSubtotal() {
        return this._items.reduce((sum, item) => sum + item.getTotalPrice(), 0);
    }

    _calculateTax(subtotal) {
        return subtotal * this._taxRate;
    }

    _calculateTotal() {
        const subtotal = this._calculateSubtotal();
        const tax = this._calculateTax(subtotal);
        return subtotal + tax - this._discountAmount;
    }

    _calculateDiscount(discountCode) {
        const total = this._calculateSubtotal();
        
        switch (discountCode) {
            case 'SAVE10':
                return total * 0.1;
            case 'FIRSTORDER':
                return Math.min(total * 0.2, 20);
            default:
                return 0;
        }
    }

    _qualifiesForFreeShipping() {
        return this._calculateTotal() >= this._freeShippingThreshold;
    }

    _validateForProcessing() {
        if (this._items.length === 0) {
            throw new Error('Cannot process order with no items');
        }
        if (this._status !== 'pending') {
            throw new Error('Can only process pending orders');
        }
    }
}

// Value object for order items
class OrderItem {
    constructor(product, quantity) {
        this._product = product;
        this._quantity = quantity;
        this._validateQuantity(quantity);
    }

    increaseQuantity(amount) {
        if (amount <= 0) {
            throw new Error('Quantity increase must be positive');
        }
        this._quantity += amount;
    }

    getTotalPrice() {
        return this._product.price * this._quantity;
    }

    get productId() { return this._product.id; }
    get quantity() { return this._quantity; }

    _validateQuantity(quantity) {
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }
    }
}

// Result object for order processing
class OrderProcessingResult {
    constructor(success, total, reason = null) {
        this._success = success;
        this._total = total;
        this._reason = reason;
    }

    get isSuccess() { return this._success; }
    get total() { return this._total; }
    get reason() { return this._reason; }
}

// Minimal services for orchestration only
class UserRepository {
    save(user) {
        // Persistence logic only - no business logic
        console.log(`Saving user ${user.id}`);
    }
}

class OrderRepository {
    save(order) {
        // Persistence logic only - no business logic
        console.log(`Saving order ${order.id}`);
    }
}

class NotificationService {
    sendOrderConfirmation(order) {
        // Infrastructure concern - sending notifications
        console.log(`Order confirmation sent for order ${order.id}`);
    }
}

// Usage demonstrates the benefits
const user = new User('123', 'John Doe', 'john@example.com');

// Tell the object what to do, don't ask for data to manipulate
const authResult = user.authenticate('password123');
if (authResult.isSuccess) {
    console.log('User authenticated successfully');
} else {
    console.log(`Authentication failed: ${authResult.reason}`);
}

const order = new Order('456', user.id);

// Objects maintain their own invariants
try {
    order.addItem({ id: '1', name: 'Widget', price: 25 }, 2);
    order.addItem({ id: '2', name: 'Gadget', price: 15 }, 1);
    
    const discountApplied = order.applyDiscount('SAVE10');
    console.log(`Discount applied: ${discountApplied}`);
    
    const result = order.process();
    if (result.isSuccess) {
        console.log(`Order processed successfully. Total: $${result.total}`);
    }
} catch (error) {
    console.log(`Order processing failed: ${error.message}`);
}

// Business invariants are protected
try {
    user.upgradeSubscription('premium', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    console.log(`Can access premium features: ${user.canAccessPremiumFeatures()}`);
} catch (error) {
    console.log(`Subscription upgrade failed: ${error.message}`);
}

// Benefits of rich domain model:
console.log('\nBenefits of rich domain model:');
console.log('✅ Business logic encapsulated in domain objects');
console.log('✅ Objects control their own state and maintain invariants');
console.log('✅ Follows Tell Don\'t Ask principle');
console.log('✅ Better encapsulation and data protection');
console.log('✅ Easier to test business rules in isolation');
console.log('✅ More maintainable and expressive code');
