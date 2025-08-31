// ✅ GOOD EXAMPLE: Self-Documenting Code
// This code expresses its intent clearly through structure and naming

class ShoppingCart {
    constructor(userId) {
        this.userId = userId;
        this.items = [];
        this.createdAt = new Date();
        this.total = 0;
    }

    addItem(item) {
        this.validateItem(item);
        
        const existingItem = this.findExistingItem(item.id);
        if (existingItem) {
            this.increaseItemQuantity(existingItem, item.quantity);
        } else {
            this.addNewItem(item);
        }
        
        this.recalculateTotal();
    }

    removeItem(itemId) {
        this.validateItemId(itemId);
        
        const itemIndex = this.findItemIndex(itemId);
        if (itemIndex === -1) {
            throw new Error('Item not found in cart');
        }
        
        this.items.splice(itemIndex, 1);
        this.recalculateTotal();
    }

    updateQuantity(itemId, newQuantity) {
        this.validateItemId(itemId);
        this.validateQuantity(newQuantity);
        
        const item = this.findExistingItem(itemId);
        if (!item) {
            throw new Error('Item not found in cart');
        }
        
        item.quantity = newQuantity;
        this.recalculateTotal();
    }

    applyDiscount(discountPercent) {
        this.validateDiscountPercent(discountPercent);
        
        const discountAmount = this.calculateDiscountAmount(discountPercent);
        this.total = this.total - discountAmount;
    }

    getSummary() {
        return {
            userId: this.userId,
            itemCount: this.items.length,
            total: this.total,
            createdAt: this.createdAt,
            items: this.items
        };
    }

    clear() {
        this.items = [];
        this.total = 0;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    getItemCount() {
        return this.items.length;
    }

    // Private helper methods with intention-revealing names

    validateItem(item) {
        if (!item) {
            throw new Error('Item is required');
        }
        
        if (!this.hasRequiredProperties(item)) {
            throw new Error('Item must have id, price, and quantity');
        }
        
        this.validateQuantity(item.quantity);
    }

    hasRequiredProperties(item) {
        return item.id && item.price && item.quantity;
    }

    validateItemId(itemId) {
        if (!itemId) {
            throw new Error('Item ID is required');
        }
    }

    validateQuantity(quantity) {
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }
    }

    validateDiscountPercent(discountPercent) {
        if (discountPercent === undefined || discountPercent === null) {
            throw new Error('Discount percent is required');
        }
        
        if (!this.isValidDiscountRange(discountPercent)) {
            throw new Error('Discount must be between 0 and 100');
        }
    }

    isValidDiscountRange(discountPercent) {
        return discountPercent >= 0 && discountPercent <= 100;
    }

    findExistingItem(itemId) {
        return this.items.find(item => item.id === itemId);
    }

    findItemIndex(itemId) {
        return this.items.findIndex(item => item.id === itemId);
    }

    increaseItemQuantity(existingItem, additionalQuantity) {
        existingItem.quantity += additionalQuantity;
    }

    addNewItem(item) {
        this.items.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        });
    }

    recalculateTotal() {
        this.total = this.items.reduce((sum, item) => {
            return sum + this.calculateItemTotal(item);
        }, 0);
    }

    calculateItemTotal(item) {
        return item.price * item.quantity;
    }

    calculateDiscountAmount(discountPercent) {
        return this.total * (discountPercent / 100);
    }
}

// Additional examples of self-documenting techniques

class OrderProcessor {
    processOrder(order) {
        this.validateOrderCanBeProcessed(order);
        this.reserveInventoryForOrder(order);
        
        try {
            this.chargeCustomerForOrder(order);
            this.markOrderAsConfirmed(order);
            this.triggerOrderFulfillment(order);
        } catch (paymentError) {
            this.rollbackInventoryReservation(order);
            throw paymentError;
        }
    }

    validateOrderCanBeProcessed(order) {
        if (this.isOrderEmpty(order)) {
            throw new Error('Order must contain at least one item');
        }
        
        if (this.hasInsufficientStock(order)) {
            throw new Error('Insufficient stock for one or more items');
        }
        
        if (this.exceedsOrderLimit(order)) {
            throw new Error('Order exceeds maximum allowed amount');
        }
    }

    isOrderEmpty(order) {
        return !order.items || order.items.length === 0;
    }

    hasInsufficientStock(order) {
        return order.items.some(item => 
            this.getAvailableStock(item.productId) < item.quantity
        );
    }

    exceedsOrderLimit(order) {
        const MAX_ORDER_AMOUNT = 10000;
        return order.total > MAX_ORDER_AMOUNT;
    }

    // Business rule that benefits from a comment explaining "why"
    calculatePriorityShipping(order) {
        // Priority shipping required for orders > $500 to meet SLA commitments
        // Standard shipping takes 5-7 days, priority takes 2-3 days
        const PRIORITY_SHIPPING_THRESHOLD = 500;
        
        return order.total > PRIORITY_SHIPPING_THRESHOLD;
    }

    // External API constraint that benefits from a comment
    formatPhoneNumber(phoneNumber) {
        // Legacy payment API requires exact format: (123) 456-7890
        // Any deviation results in 400 error - cannot be changed until v2 API
        const digitsOnly = phoneNumber.replace(/\D/g, '');
        
        if (digitsOnly.length !== 10) {
            throw new Error('Phone number must have exactly 10 digits');
        }
        
        return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    }
}

// Utility functions with clear, single responsibilities

function calculateTaxAmount(subtotal, taxRate) {
    return subtotal * taxRate;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function isValidEmailAddress(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

function generateOrderConfirmationNumber() {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    return `ORD-${timestamp}-${randomSuffix}`;
}

module.exports = ShoppingCart;

// Benefits of this self-documenting approach:
// 1. Function names clearly reveal intent
// 2. Complex logic is broken into understandable pieces
// 3. Validation logic is extracted and reusable
// 4. Business rules are expressed through code structure
// 5. Helper methods make the main flow easy to follow
// 6. Comments are only used when they add genuine value
// 7. Code reads like well-written prose
// 8. Easy to test individual pieces of functionality
// 9. New team members can understand the code quickly
// 10. Changes are easier to make because concerns are separated
