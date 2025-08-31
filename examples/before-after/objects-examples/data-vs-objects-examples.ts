// 🎯 DEMONSTRATION: Objects vs Data Structures - When to Use What
// This file shows appropriate use cases for both approaches

// ============================================================================
// DATA STRUCTURES: Expose data, minimal behavior
// Use for: Data transfer, configuration, simple containers
// ============================================================================

// ✅ Good Data Structure - Order Summary DTO
interface OrderSummaryDTO {
    readonly orderId: string;
    readonly customerName: string;
    readonly customerEmail: string;
    readonly totalAmount: number;
    readonly itemCount: number;
    readonly orderDate: Date;
    readonly status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
    readonly shippingAddress: AddressDTO;
}

// ✅ Good Data Structure - API Response
interface UserProfileResponse {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatarUrl: string | null;
    readonly joinDate: string; // ISO date string
    readonly isVerified: boolean;
    readonly preferences: UserPreferencesDTO;
}

// ✅ Good Data Structure - Configuration
interface DatabaseConfig {
    readonly host: string;
    readonly port: number;
    readonly database: string;
    readonly ssl: boolean;
    readonly connectionTimeout: number;
    readonly maxRetries: number;
}

// ✅ Good Data Structure - Simple Value Container
interface AddressDTO {
    readonly street: string;
    readonly city: string;
    readonly state: string;
    readonly zipCode: string;
    readonly country: string;
}

interface UserPreferencesDTO {
    readonly theme: 'light' | 'dark';
    readonly language: string;
    readonly emailNotifications: boolean;
    readonly pushNotifications: boolean;
}

// ============================================================================
// OBJECTS: Hide data, expose behavior
// Use for: Business logic, maintaining invariants, complex operations
// ============================================================================

// ✅ Good Object - Rich Domain Entity
class BankAccount {
    private _accountNumber: string;
    private _balance: number;
    private _isActive: boolean;
    private _transactions: Transaction[];

    constructor(accountNumber: string, initialBalance: number) {
        this._accountNumber = accountNumber;
        this._balance = Math.max(0, initialBalance);
        this._isActive = true;
        this._transactions = [];
    }

    // Expose behavior, not data
    deposit(amount: number): TransactionResult {
        if (!this._isActive) {
            return TransactionResult.failed('Account is inactive');
        }
        
        if (amount <= 0) {
            return TransactionResult.failed('Amount must be positive');
        }

        this._balance += amount;
        this._recordTransaction('deposit', amount);
        return TransactionResult.success(this._balance);
    }

    withdraw(amount: number): TransactionResult {
        if (!this._isActive) {
            return TransactionResult.failed('Account is inactive');
        }

        if (amount <= 0) {
            return TransactionResult.failed('Amount must be positive');
        }

        if (amount > this._balance) {
            return TransactionResult.failed('Insufficient funds');
        }

        this._balance -= amount;
        this._recordTransaction('withdrawal', amount);
        return TransactionResult.success(this._balance);
    }

    freeze(): void {
        this._isActive = false;
    }

    unfreeze(): void {
        this._isActive = true;
    }

    // Controlled access to necessary data
    get accountNumber(): string { return this._accountNumber; }
    get currentBalance(): number { return this._balance; }
    get isActive(): boolean { return this._isActive; }
    
    getTransactionHistory(): ReadonlyArray<Transaction> {
        return [...this._transactions]; // Return copy to prevent external modification
    }

    private _recordTransaction(type: 'deposit' | 'withdrawal', amount: number): void {
        this._transactions.push(new Transaction(type, amount, new Date(), this._balance));
    }
}

// ✅ Good Object - Value Object
class Money {
    private readonly _amount: number;
    private readonly _currency: string;

    constructor(amount: number, currency: string) {
        if (amount < 0) {
            throw new Error('Amount cannot be negative');
        }
        this._amount = amount;
        this._currency = currency.toUpperCase();
    }

    add(other: Money): Money {
        this._validateSameCurrency(other);
        return new Money(this._amount + other._amount, this._currency);
    }

    subtract(other: Money): Money {
        this._validateSameCurrency(other);
        if (this._amount < other._amount) {
            throw new Error('Result would be negative');
        }
        return new Money(this._amount - other._amount, this._currency);
    }

    multiply(factor: number): Money {
        if (factor < 0) {
            throw new Error('Factor cannot be negative');
        }
        return new Money(this._amount * factor, this._currency);
    }

    equals(other: Money): boolean {
        return this._amount === other._amount && this._currency === other._currency;
    }

    isGreaterThan(other: Money): boolean {
        this._validateSameCurrency(other);
        return this._amount > other._amount;
    }

    get amount(): number { return this._amount; }
    get currency(): string { return this._currency; }

    toString(): string {
        return `${this._amount} ${this._currency}`;
    }

    private _validateSameCurrency(other: Money): void {
        if (this._currency !== other._currency) {
            throw new Error(`Cannot operate on different currencies: ${this._currency} and ${other._currency}`);
        }
    }
}

// ✅ Good Object - Service with Business Logic
class ShoppingCart {
    private _items: Map<string, CartItem> = new Map();
    private _appliedCoupons: Set<string> = new Set();

    addItem(productId: string, price: Money, quantity: number): void {
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }

        const existingItem = this._items.get(productId);
        if (existingItem) {
            existingItem.increaseQuantity(quantity);
        } else {
            this._items.set(productId, new CartItem(productId, price, quantity));
        }
    }

    removeItem(productId: string): boolean {
        return this._items.delete(productId);
    }

    applyCoupon(couponCode: string): boolean {
        if (this._appliedCoupons.has(couponCode)) {
            return false; // Already applied
        }

        // Business logic for coupon validation would go here
        if (this._isValidCoupon(couponCode)) {
            this._appliedCoupons.add(couponCode);
            return true;
        }
        return false;
    }

    calculateTotal(): Money {
        if (this._items.size === 0) {
            return new Money(0, 'USD');
        }

        let total = new Money(0, 'USD');
        for (const item of this._items.values()) {
            total = total.add(item.getTotalPrice());
        }

        // Apply coupon discounts
        const discount = this._calculateCouponDiscount(total);
        return total.subtract(discount);
    }

    getItemCount(): number {
        return Array.from(this._items.values())
            .reduce((sum, item) => sum + item.quantity, 0);
    }

    isEmpty(): boolean {
        return this._items.size === 0;
    }

    private _isValidCoupon(couponCode: string): boolean {
        // Mock validation - in real app, would check database/service
        return ['SAVE10', 'WELCOME20', 'FREESHIP'].includes(couponCode);
    }

    private _calculateCouponDiscount(total: Money): Money {
        let discount = new Money(0, total.currency);
        
        for (const coupon of this._appliedCoupons) {
            switch (coupon) {
                case 'SAVE10':
                    discount = discount.add(total.multiply(0.1));
                    break;
                case 'WELCOME20':
                    discount = discount.add(total.multiply(0.2));
                    break;
                // FREESHIP would be handled differently
            }
        }
        
        return discount;
    }
}

// Supporting classes
class CartItem {
    constructor(
        public readonly productId: string,
        public readonly price: Money,
        public quantity: number
    ) {
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }
    }

    increaseQuantity(amount: number): void {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        this.quantity += amount;
    }

    getTotalPrice(): Money {
        return this.price.multiply(this.quantity);
    }
}

class Transaction {
    constructor(
        public readonly type: 'deposit' | 'withdrawal',
        public readonly amount: number,
        public readonly timestamp: Date,
        public readonly balanceAfter: number
    ) {}
}

class TransactionResult {
    private constructor(
        public readonly success: boolean,
        public readonly newBalance?: number,
        public readonly errorMessage?: string
    ) {}

    static success(newBalance: number): TransactionResult {
        return new TransactionResult(true, newBalance);
    }

    static failed(errorMessage: string): TransactionResult {
        return new TransactionResult(false, undefined, errorMessage);
    }
}

// ============================================================================
// USAGE EXAMPLES: Demonstrating when to use each approach
// ============================================================================

// Data Structures - for data transfer and configuration
function sendOrderConfirmationEmail(orderSummary: OrderSummaryDTO): void {
    console.log(`Sending confirmation for order ${orderSummary.orderId}`);
    console.log(`Customer: ${orderSummary.customerName}`);
    console.log(`Total: $${orderSummary.totalAmount}`);
    // Email sending logic here
}

function connectToDatabase(config: DatabaseConfig): void {
    console.log(`Connecting to ${config.host}:${config.port}/${config.database}`);
    // Database connection logic here
}

// Objects - for business logic and behavior
function demonstrateObjectBehavior(): void {
    // Rich objects encapsulate business logic
    const account = new BankAccount('ACC-123', 1000);
    
    const depositResult = account.deposit(500);
    if (depositResult.success) {
        console.log(`Deposit successful. New balance: $${depositResult.newBalance}`);
    }

    const withdrawResult = account.withdraw(200);
    if (withdrawResult.success) {
        console.log(`Withdrawal successful. New balance: $${withdrawResult.newBalance}`);
    }

    // Shopping cart maintains its own business rules
    const cart = new ShoppingCart();
    const price = new Money(29.99, 'USD');
    
    cart.addItem('product-1', price, 2);
    cart.applyCoupon('SAVE10');
    
    const total = cart.calculateTotal();
    console.log(`Cart total: ${total.toString()}`);
}

// ============================================================================
// KEY TAKEAWAYS
// ============================================================================

/*
USE DATA STRUCTURES WHEN:
✅ Transferring data between system boundaries (DTOs)
✅ Configuration and settings
✅ API requests/responses
✅ Simple data containers with no business logic
✅ Performance is critical and you need direct access

USE OBJECTS WHEN:
✅ Encapsulating business logic and rules
✅ Maintaining invariants and data consistency
✅ Complex behavior and state management
✅ You want to hide implementation details
✅ Building a rich domain model

AVOID HYBRIDS:
❌ Don't mix public data with complex business methods
❌ Don't create objects that are just getters/setters with scattered logic
❌ Don't expose internal state that breaks encapsulation
❌ Don't create data structures with complex behavior

REMEMBER:
- Objects hide data and expose behavior
- Data structures expose data and have minimal behavior  
- Choose the right tool for the specific job
- Be consistent within your application architecture
*/
