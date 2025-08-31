// ✅ GOOD: Test-driven development with comprehensive coverage
// Benefits: Clear requirements, edge cases handled, confident refactoring, maintainable

/**
 * Order Calculator built with Test-Driven Development
 * Every behavior is tested, requirements are clear, edge cases are handled
 */

class OrderCalculator {
  constructor(taxRateProvider = new TaxRateProvider(), promoService = new PromoService()) {
    this.taxRateProvider = taxRateProvider;
    this.promoService = promoService;
  }

  calculateTotal(items, customer, promoCode = null) {
    this._validateInputs(items, customer);
    
    const subtotal = this._calculateSubtotal(items);
    const tax = this._calculateTax(subtotal, customer);
    const promoDiscount = this._calculatePromoDiscount(subtotal, customer, promoCode);
    
    const total = subtotal + tax - promoDiscount;
    return this._roundToNearestCent(Math.max(0, total)); // Never negative
  }

  getOrderSummary(items, customer, promoCode = null) {
    this._validateInputs(items, customer);
    
    const itemBreakdown = this._calculateItemBreakdown(items);
    const subtotal = itemBreakdown.subtotal;
    const tax = this._calculateTax(subtotal, customer);
    const promoDiscount = this._calculatePromoDiscount(subtotal, customer, promoCode);
    
    return {
      subtotal: this._roundToNearestCent(subtotal),
      bulkDiscounts: this._roundToNearestCent(itemBreakdown.bulkDiscounts),
      categoryDiscounts: this._roundToNearestCent(itemBreakdown.categoryDiscounts),
      tax: this._roundToNearestCent(tax),
      promoDiscount: this._roundToNearestCent(promoDiscount),
      total: this._roundToNearestCent(Math.max(0, subtotal + tax - promoDiscount))
    };
  }

  // Private methods - each with focused responsibility and easy to test

  _validateInputs(items, customer) {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }
    
    if (!customer || typeof customer !== 'object') {
      throw new Error('Customer is required');
    }
    
    if (!customer.state || typeof customer.state !== 'string') {
      throw new Error('Customer state is required');
    }

    items.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Item at index ${index} is invalid`);
      }
      
      if (typeof item.price !== 'number' || item.price < 0) {
        throw new Error(`Item at index ${index} has invalid price`);
      }
      
      if (typeof item.quantity !== 'number' || item.quantity < 0 || !Number.isInteger(item.quantity)) {
        throw new Error(`Item at index ${index} has invalid quantity`);
      }
    });
  }

  _calculateSubtotal(items) {
    return items.reduce((total, item) => {
      return total + this._calculateItemTotal(item);
    }, 0);
  }

  _calculateItemTotal(item) {
    let itemTotal = item.price * item.quantity;
    
    itemTotal -= this._calculateBulkDiscount(item);
    itemTotal -= this._calculateCategoryDiscount(item, itemTotal);
    
    return Math.max(0, itemTotal);
  }

  _calculateBulkDiscount(item) {
    const BULK_DISCOUNT_THRESHOLD = 10;
    const BULK_DISCOUNT_RATE = 0.1;
    
    if (item.quantity > BULK_DISCOUNT_THRESHOLD) {
      return (item.price * item.quantity) * BULK_DISCOUNT_RATE;
    }
    
    return 0;
  }

  _calculateCategoryDiscount(item, itemTotal) {
    const ELECTRONICS_DISCOUNT_THRESHOLD = 500;
    const ELECTRONICS_DISCOUNT_RATE = 0.05;
    
    if (item.category === 'electronics' && itemTotal > ELECTRONICS_DISCOUNT_THRESHOLD) {
      return itemTotal * ELECTRONICS_DISCOUNT_RATE;
    }
    
    return 0;
  }

  _calculateItemBreakdown(items) {
    let subtotal = 0;
    let bulkDiscounts = 0;
    let categoryDiscounts = 0;
    
    items.forEach(item => {
      const originalPrice = item.price * item.quantity;
      const bulkDiscount = this._calculateBulkDiscount(item);
      
      let itemTotal = originalPrice - bulkDiscount;
      const categoryDiscount = this._calculateCategoryDiscount(item, itemTotal);
      
      itemTotal -= categoryDiscount;
      
      subtotal += Math.max(0, itemTotal);
      bulkDiscounts += bulkDiscount;
      categoryDiscounts += categoryDiscount;
    });
    
    return { subtotal, bulkDiscounts, categoryDiscounts };
  }

  _calculateTax(subtotal, customer) {
    const taxRate = this.taxRateProvider.getTaxRate(customer.state);
    return subtotal * taxRate;
  }

  _calculatePromoDiscount(subtotal, customer, promoCode) {
    if (!promoCode) {
      return 0;
    }
    
    return this.promoService.calculateDiscount(promoCode, subtotal, customer);
  }

  _roundToNearestCent(amount) {
    return Math.round(amount * 100) / 100;
  }
}

// Dependency services with clear interfaces
class TaxRateProvider {
  getTaxRate(state) {
    const TAX_RATES = {
      'CA': 0.0875,
      'NY': 0.08,
      'TX': 0.0625,
      'FL': 0.06,
      'WA': 0.065
    };
    
    return TAX_RATES[state] || 0; // Default to 0 for unknown states
  }
}

class PromoService {
  calculateDiscount(promoCode, subtotal, customer) {
    const PROMO_RULES = {
      'SAVE10': { minAmount: 100, discountRate: 0.1, premiumOnly: false },
      'SAVE20': { minAmount: 200, discountRate: 0.2, premiumOnly: true },
      'FREESHIP': { minAmount: 0, discountRate: 0, premiumOnly: false } // No discount on total
    };
    
    const rule = PROMO_RULES[promoCode];
    if (!rule) {
      return 0; // Unknown promo code
    }
    
    if (subtotal < rule.minAmount) {
      return 0; // Doesn't meet minimum
    }
    
    if (rule.premiumOnly && !customer.isPremium) {
      return 0; // Premium required
    }
    
    return subtotal * rule.discountRate;
  }
}

// ===== COMPREHENSIVE TEST SUITE =====

describe('OrderCalculator', () => {
  let calculator;
  let mockTaxProvider;
  let mockPromoService;

  beforeEach(() => {
    mockTaxProvider = {
      getTaxRate: jest.fn()
    };
    mockPromoService = {
      calculateDiscount: jest.fn()
    };
    calculator = new OrderCalculator(mockTaxProvider, mockPromoService);
  });

  describe('calculateTotal', () => {
    it('should calculate basic total with single item', () => {
      const items = [{ price: 10, quantity: 2, category: 'books' }];
      const customer = { state: 'CA', isPremium: false };
      
      mockTaxProvider.getTaxRate.mockReturnValue(0.08);
      mockPromoService.calculateDiscount.mockReturnValue(0);
      
      const result = calculator.calculateTotal(items, customer);
      
      expect(result).toBe(21.6); // (10 * 2) + (20 * 0.08) = 20 + 1.6
    });

    it('should apply bulk discount for quantities over 10', () => {
      const items = [{ price: 10, quantity: 15, category: 'books' }];
      const customer = { state: 'CA', isPremium: false };
      
      mockTaxProvider.getTaxRate.mockReturnValue(0);
      mockPromoService.calculateDiscount.mockReturnValue(0);
      
      const result = calculator.calculateTotal(items, customer);
      
      expect(result).toBe(135); // 150 - 15 (10% bulk discount)
    });

    it('should apply category discount for electronics over $500', () => {
      const items = [{ price: 600, quantity: 1, category: 'electronics' }];
      const customer = { state: 'CA', isPremium: false };
      
      mockTaxProvider.getTaxRate.mockReturnValue(0);
      mockPromoService.calculateDiscount.mockReturnValue(0);
      
      const result = calculator.calculateTotal(items, customer);
      
      expect(result).toBe(570); // 600 - 30 (5% electronics discount)
    });

    it('should handle empty items array', () => {
      const items = [];
      const customer = { state: 'CA', isPremium: false };
      
      mockTaxProvider.getTaxRate.mockReturnValue(0.08);
      mockPromoService.calculateDiscount.mockReturnValue(0);
      
      const result = calculator.calculateTotal(items, customer);
      
      expect(result).toBe(0);
    });

    it('should never return negative total', () => {
      const items = [{ price: 10, quantity: 1, category: 'books' }];
      const customer = { state: 'CA', isPremium: true };
      
      mockTaxProvider.getTaxRate.mockReturnValue(0);
      mockPromoService.calculateDiscount.mockReturnValue(20); // Huge discount
      
      const result = calculator.calculateTotal(items, customer);
      
      expect(result).toBe(0); // Never negative
    });

    it('should round to nearest cent', () => {
      const items = [{ price: 10.33, quantity: 1, category: 'books' }];
      const customer = { state: 'CA', isPremium: false };
      
      mockTaxProvider.getTaxRate.mockReturnValue(0.08375); // Creates fractional cents
      mockPromoService.calculateDiscount.mockReturnValue(0);
      
      const result = calculator.calculateTotal(items, customer);
      
      expect(result).toBe(11.19); // Properly rounded
    });
  });

  describe('input validation', () => {
    it('should throw error for non-array items', () => {
      expect(() => {
        calculator.calculateTotal('not-array', { state: 'CA' });
      }).toThrow('Items must be an array');
    });

    it('should throw error for missing customer', () => {
      expect(() => {
        calculator.calculateTotal([], null);
      }).toThrow('Customer is required');
    });

    it('should throw error for missing customer state', () => {
      expect(() => {
        calculator.calculateTotal([], { isPremium: true });
      }).toThrow('Customer state is required');
    });

    it('should throw error for negative price', () => {
      const items = [{ price: -10, quantity: 1, category: 'books' }];
      
      expect(() => {
        calculator.calculateTotal(items, { state: 'CA' });
      }).toThrow('Item at index 0 has invalid price');
    });

    it('should throw error for negative quantity', () => {
      const items = [{ price: 10, quantity: -1, category: 'books' }];
      
      expect(() => {
        calculator.calculateTotal(items, { state: 'CA' });
      }).toThrow('Item at index 0 has invalid quantity');
    });

    it('should throw error for fractional quantity', () => {
      const items = [{ price: 10, quantity: 1.5, category: 'books' }];
      
      expect(() => {
        calculator.calculateTotal(items, { state: 'CA' });
      }).toThrow('Item at index 0 has invalid quantity');
    });
  });

  describe('getOrderSummary', () => {
    it('should provide detailed breakdown of order', () => {
      const items = [
        { price: 10, quantity: 15, category: 'books' },    // Bulk discount
        { price: 600, quantity: 1, category: 'electronics' } // Category discount
      ];
      const customer = { state: 'CA', isPremium: true };
      
      mockTaxProvider.getTaxRate.mockReturnValue(0.08);
      mockPromoService.calculateDiscount.mockReturnValue(50);
      
      const result = calculator.getOrderSummary(items, customer, 'SAVE20');
      
      expect(result.subtotal).toBe(705); // 135 + 570
      expect(result.bulkDiscounts).toBe(15); // 10% of 150
      expect(result.categoryDiscounts).toBe(30); // 5% of 600
      expect(result.tax).toBe(56.4); // 8% of 705
      expect(result.promoDiscount).toBe(50);
      expect(result.total).toBe(711.4); // 705 + 56.4 - 50
    });
  });
});

describe('TaxRateProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new TaxRateProvider();
  });

  it('should return correct tax rate for California', () => {
    expect(provider.getTaxRate('CA')).toBe(0.0875);
  });

  it('should return correct tax rate for New York', () => {
    expect(provider.getTaxRate('NY')).toBe(0.08);
  });

  it('should return zero for unknown state', () => {
    expect(provider.getTaxRate('UNKNOWN')).toBe(0);
  });
});

describe('PromoService', () => {
  let service;

  beforeEach(() => {
    service = new PromoService();
  });

  it('should apply SAVE10 for orders over $100', () => {
    const customer = { isPremium: false };
    const discount = service.calculateDiscount('SAVE10', 150, customer);
    
    expect(discount).toBe(15); // 10% of 150
  });

  it('should not apply SAVE10 for orders under $100', () => {
    const customer = { isPremium: false };
    const discount = service.calculateDiscount('SAVE10', 50, customer);
    
    expect(discount).toBe(0);
  });

  it('should apply SAVE20 for premium customers over $200', () => {
    const customer = { isPremium: true };
    const discount = service.calculateDiscount('SAVE20', 250, customer);
    
    expect(discount).toBe(50); // 20% of 250
  });

  it('should not apply SAVE20 for non-premium customers', () => {
    const customer = { isPremium: false };
    const discount = service.calculateDiscount('SAVE20', 250, customer);
    
    expect(discount).toBe(0);
  });

  it('should return zero for unknown promo code', () => {
    const customer = { isPremium: true };
    const discount = service.calculateDiscount('INVALID', 250, customer);
    
    expect(discount).toBe(0);
  });
});

/* 
Benefits of this approach:
1. ✅ Comprehensive test coverage ensures correctness
2. ✅ Clear requirements documented through tests
3. ✅ Edge cases explicitly handled and tested
4. ✅ Input validation prevents runtime errors
5. ✅ Small, focused methods easy to test and debug
6. ✅ Dependency injection enables unit testing
7. ✅ Business rules clearly separated and configurable
8. ✅ Confident refactoring with test safety net
9. ✅ Fast test execution (no external dependencies)
10. ✅ Self-documenting code through descriptive tests
11. ✅ Bugs caught during development, not production
12. ✅ Easy to add new features with TDD approach
13. ✅ Code is maintainable and fear-free to modify
14. ✅ Rounding and edge cases properly handled
15. ✅ Clear separation of concerns and responsibilities
*/
