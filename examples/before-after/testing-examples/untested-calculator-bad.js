// ❌ BAD: Untested code with hidden complexity and edge case bugs
// Problems: No tests, unclear requirements, edge cases not handled, hard to maintain

/**
 * Order total calculator - seems simple but has hidden complexity
 * Written without tests, requirements discovered through production bugs
 */

class OrderCalculator {
  calculateTotal(items, customer, promoCode) {
    // No input validation - will crash on bad data
    let subtotal = 0;
    
    // Complex business logic without tests
    for (let item of items) {
      let itemTotal = item.price * item.quantity;
      
      // Bulk discount logic - discovered through customer complaints
      if (item.quantity > 10) {
        itemTotal = itemTotal * 0.9; // 10% bulk discount
      }
      
      // Category-specific discounts - added after launch
      if (item.category === 'electronics' && itemTotal > 500) {
        itemTotal = itemTotal * 0.95; // 5% electronics discount
      }
      
      subtotal += itemTotal;
    }
    
    // Tax calculation - varies by customer location
    let tax = 0;
    if (customer.state === 'CA') {
      tax = subtotal * 0.0875; // California tax
    } else if (customer.state === 'NY') {
      tax = subtotal * 0.08; // New York tax
    } else if (customer.state === 'TX') {
      tax = subtotal * 0.0625; // Texas tax
    }
    // What about other states? Bug waiting to happen!
    
    // Promotional code handling - added hastily for marketing campaign
    let discount = 0;
    if (promoCode) {
      if (promoCode === 'SAVE10' && subtotal > 100) {
        discount = subtotal * 0.1;
      } else if (promoCode === 'SAVE20' && subtotal > 200 && customer.isPremium) {
        discount = subtotal * 0.2;
      } else if (promoCode === 'FREESHIP') {
        // This doesn't affect total but should it be tracked?
        // No clear requirements, unclear behavior
      }
    }
    
    // Final calculation - what could go wrong?
    let total = subtotal + tax - discount;
    
    // Rounding issues - discovered in production
    return Math.round(total * 100) / 100; // But what about negative totals?
  }
  
  // This method was added after customers complained about confusing receipts
  getOrderSummary(items, customer, promoCode) {
    // Duplicated logic from calculateTotal - violates DRY
    let subtotal = 0;
    let bulkDiscounts = 0;
    let categoryDiscounts = 0;
    
    for (let item of items) {
      let originalPrice = item.price * item.quantity;
      let itemTotal = originalPrice;
      
      if (item.quantity > 10) {
        let bulkDiscount = originalPrice * 0.1;
        bulkDiscounts += bulkDiscount;
        itemTotal -= bulkDiscount;
      }
      
      if (item.category === 'electronics' && itemTotal > 500) {
        let categoryDiscount = itemTotal * 0.05;
        categoryDiscounts += categoryDiscount;
        itemTotal -= categoryDiscount;
      }
      
      subtotal += itemTotal;
    }
    
    // More duplicated tax logic
    let tax = 0;
    if (customer.state === 'CA') {
      tax = subtotal * 0.0875;
    } else if (customer.state === 'NY') {
      tax = subtotal * 0.08;
    } else if (customer.state === 'TX') {
      tax = subtotal * 0.0625;
    }
    
    // More duplicated promo logic
    let promoDiscount = 0;
    if (promoCode) {
      if (promoCode === 'SAVE10' && subtotal > 100) {
        promoDiscount = subtotal * 0.1;
      } else if (promoCode === 'SAVE20' && subtotal > 200 && customer.isPremium) {
        promoDiscount = subtotal * 0.2;
      }
    }
    
    return {
      subtotal: subtotal,
      bulkDiscounts: bulkDiscounts,
      categoryDiscounts: categoryDiscounts,
      tax: tax,
      promoDiscount: promoDiscount,
      total: subtotal + tax - promoDiscount
    };
  }
}

// Example usage - no tests to verify this works correctly
const calculator = new OrderCalculator();

const items = [
  { price: 50, quantity: 12, category: 'electronics' },
  { price: 20, quantity: 5, category: 'books' }
];

const customer = {
  state: 'CA',
  isPremium: true
};

// What happens with edge cases?
// - Empty items array?
// - Negative prices?
// - Zero quantities?
// - Invalid customer data?
// - Expired promo codes?
// - Items with no category?

const total = calculator.calculateTotal(items, customer, 'SAVE20');
console.log(`Total: $${total}`); // Is this correct? Who knows!

/* 
Problems with this approach:
1. ❌ No tests to verify correctness
2. ❌ Complex business logic without validation
3. ❌ Edge cases not handled (null inputs, negative values, etc.)
4. ❌ Duplicated logic between methods
5. ❌ Hard-coded tax rates that will break when rates change
6. ❌ Unclear promo code behavior
7. ❌ No error handling for invalid inputs
8. ❌ Rounding issues not properly addressed
9. ❌ Business rules scattered throughout code
10. ❌ Impossible to test individual discount calculations
11. ❌ No documentation of expected behavior
12. ❌ Changes require full manual testing
13. ❌ Bugs discovered in production, not development
14. ❌ Code is fragile and fear-inducing to modify
15. ❌ No confidence in refactoring or optimization
*/
