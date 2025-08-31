// ❌ BAD EXAMPLE: Over-Commented Code
// This code has too many unnecessary comments that actually hurt readability

/**
 * Shopping cart class
 * Handles shopping cart operations
 */
class ShoppingCart {
    /**
     * Constructor for ShoppingCart
     * @param {string} userId - The user ID
     */
    constructor(userId) {
        // Set the user ID property
        this.userId = userId;
        // Initialize empty items array
        this.items = [];
        // Set created timestamp
        this.createdAt = new Date();
        // Initialize total to zero
        this.total = 0;
    }

    /**
     * Add item to cart
     * @param {Object} item - The item to add
     */
    addItem(item) {
        // Check if item is valid
        if (!item) {
            // Throw error if item is null or undefined
            throw new Error('Item is required');
        }

        // Check if item has required properties
        if (!item.id || !item.price || !item.quantity) {
            // Throw error if required properties are missing
            throw new Error('Item must have id, price, and quantity');
        }

        // Check if quantity is positive
        if (item.quantity <= 0) {
            // Throw error if quantity is not positive
            throw new Error('Quantity must be positive');
        }

        // Check if item already exists in cart
        const existingItemIndex = this.items.findIndex(cartItem => cartItem.id === item.id);
        
        // If item exists
        if (existingItemIndex !== -1) {
            // Update the quantity of existing item
            this.items[existingItemIndex].quantity += item.quantity;
        } else {
            // Add new item to items array
            this.items.push({
                id: item.id,           // Item ID
                name: item.name,       // Item name
                price: item.price,     // Item price
                quantity: item.quantity // Item quantity
            });
        }

        // Recalculate the total
        this.calculateTotal();
    }

    /**
     * Remove item from cart
     * @param {string} itemId - The ID of item to remove
     */
    removeItem(itemId) {
        // Check if itemId is provided
        if (!itemId) {
            // Throw error if itemId is missing
            throw new Error('Item ID is required');
        }

        // Find the index of item to remove
        const itemIndex = this.items.findIndex(item => item.id === itemId);
        
        // Check if item was found
        if (itemIndex === -1) {
            // Throw error if item not found
            throw new Error('Item not found in cart');
        }

        // Remove the item from array
        this.items.splice(itemIndex, 1);
        
        // Recalculate the total
        this.calculateTotal();
    }

    /**
     * Update item quantity
     * @param {string} itemId - The ID of item to update
     * @param {number} newQuantity - The new quantity
     */
    updateQuantity(itemId, newQuantity) {
        // Check if itemId is provided
        if (!itemId) {
            // Throw error if itemId is missing
            throw new Error('Item ID is required');
        }

        // Check if newQuantity is provided
        if (newQuantity === undefined || newQuantity === null) {
            // Throw error if newQuantity is missing
            throw new Error('New quantity is required');
        }

        // Check if newQuantity is positive
        if (newQuantity <= 0) {
            // Throw error if newQuantity is not positive
            throw new Error('Quantity must be positive');
        }

        // Find the item to update
        const item = this.items.find(cartItem => cartItem.id === itemId);
        
        // Check if item was found
        if (!item) {
            // Throw error if item not found
            throw new Error('Item not found in cart');
        }

        // Update the quantity
        item.quantity = newQuantity;
        
        // Recalculate the total
        this.calculateTotal();
    }

    /**
     * Calculate the total price of all items
     */
    calculateTotal() {
        // Initialize total to zero
        let total = 0;
        
        // Loop through all items
        for (let i = 0; i < this.items.length; i++) {
            // Get current item
            const item = this.items[i];
            // Calculate item total (price * quantity)
            const itemTotal = item.price * item.quantity;
            // Add item total to running total
            total += itemTotal;
        }
        
        // Set the total property
        this.total = total;
    }

    /**
     * Get cart summary
     * @returns {Object} Cart summary object
     */
    getSummary() {
        // Create summary object
        const summary = {
            // User ID
            userId: this.userId,
            // Number of items
            itemCount: this.items.length,
            // Total price
            total: this.total,
            // Created date
            createdAt: this.createdAt,
            // Items array
            items: this.items
        };
        
        // Return the summary
        return summary;
    }

    /**
     * Clear all items from cart
     */
    clear() {
        // Empty the items array
        this.items = [];
        // Reset total to zero
        this.total = 0;
    }

    /**
     * Check if cart is empty
     * @returns {boolean} True if cart is empty, false otherwise
     */
    isEmpty() {
        // Check if items array length is zero
        return this.items.length === 0;
    }

    /**
     * Get item count
     * @returns {number} Number of items in cart
     */
    getItemCount() {
        // Return the length of items array
        return this.items.length;
    }

    /**
     * Apply discount to cart
     * @param {number} discountPercent - Discount percentage (0-100)
     */
    applyDiscount(discountPercent) {
        // Check if discountPercent is provided
        if (discountPercent === undefined || discountPercent === null) {
            // Throw error if discountPercent is missing
            throw new Error('Discount percent is required');
        }

        // Check if discount is valid range
        if (discountPercent < 0 || discountPercent > 100) {
            // Throw error if discount is out of range
            throw new Error('Discount must be between 0 and 100');
        }

        // Calculate discount amount
        const discountAmount = this.total * (discountPercent / 100);
        
        // Apply discount to total
        this.total = this.total - discountAmount;
    }
}

// Export the class
module.exports = ShoppingCart;

// Problems with this code:
// 1. Comments explain what the code obviously does
// 2. Every single line has unnecessary documentation
// 3. JSDoc comments restate information available from function signatures
// 4. Comments make the code harder to read, not easier
// 5. Redundant parameter documentation
// 6. Comments that explain trivial operations
// 7. Noise comments that add no value
// 8. Comments that just restate variable assignments
// 9. Over-documentation makes it hard to find actual logic
// 10. The signal-to-noise ratio is terrible
