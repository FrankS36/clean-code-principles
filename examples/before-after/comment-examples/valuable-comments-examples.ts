// ✅ GOOD EXAMPLE: When Comments Add Genuine Value
// These examples show situations where comments actually improve understanding

// =============================================================================
// 1. BUSINESS RULE EXPLANATIONS
// =============================================================================

class PayrollCalculator {
    calculateOvertimePay(employee: Employee, hoursWorked: number): number {
        const regularHours = Math.min(hoursWorked, 40);
        const overtimeHours = Math.max(0, hoursWorked - 40);
        
        // California labor law requires overtime calculation:
        // - Hours 1-40: Regular rate
        // - Hours 41-50: 1.5x regular rate  
        // - Hours 51+: 2x regular rate (double time)
        const moderateOvertime = Math.min(overtimeHours, 10);
        const doubleOvertime = Math.max(0, overtimeHours - 10);
        
        const regularPay = regularHours * employee.hourlyRate;
        const moderateOvertimePay = moderateOvertime * employee.hourlyRate * 1.5;
        const doubleOvertimePay = doubleOvertime * employee.hourlyRate * 2.0;
        
        return regularPay + moderateOvertimePay + doubleOvertimePay;
    }

    calculateTaxWithholding(grossPay: number, filingStatus: string): number {
        // Tax brackets for 2023 tax year (single filer):
        // $0 - $11,000: 10%
        // $11,001 - $44,725: 12%
        // $44,726 - $95,375: 22%
        // Brackets updated annually by IRS - see Publication 15
        
        const brackets = [
            { min: 0, max: 11000, rate: 0.10 },
            { min: 11001, max: 44725, rate: 0.12 },
            { min: 44726, max: 95375, rate: 0.22 }
        ];
        
        return this.applyTaxBrackets(grossPay, brackets);
    }
}

// =============================================================================
// 2. ALGORITHM EXPLANATIONS AND PERFORMANCE WARNINGS
// =============================================================================

class DataProcessor {
    // Using QuickSort for in-place sorting - O(n log n) average case
    // Falls back to HeapSort for O(n log n) worst case if recursion depth exceeds log(n)
    quickSort(array: number[], low: number = 0, high: number = array.length - 1): void {
        if (low < high) {
            const pivotIndex = this.partition(array, low, high);
            this.quickSort(array, low, pivotIndex - 1);
            this.quickSort(array, pivotIndex + 1, high);
        }
    }

    // WARNING: This function loads the entire dataset into memory
    // Use processLargeDatasetStreaming() for files larger than 1GB
    // Memory usage: ~8x the file size due to object overhead
    processLargeDataset(filePath: string): ProcessedData[] {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(rawData);
        return parsedData.map(item => this.transformItem(item));
    }

    // Cache results for 1 hour because external API rate limit is 1000 calls/hour
    // Cache key includes all parameters to avoid stale data
    async fetchExternalData(userId: string, dataType: string): Promise<ExternalData> {
        const cacheKey = `external_${userId}_${dataType}`;
        const cached = await this.cache.get(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        const data = await this.externalApi.fetch(userId, dataType);
        await this.cache.set(cacheKey, data, { ttl: 3600 }); // 1 hour
        return data;
    }
}

// =============================================================================
// 3. EXTERNAL CONSTRAINTS AND WORKAROUNDS
// =============================================================================

class PaymentProcessor {
    processPayment(amount: number, cardToken: string): Promise<PaymentResult> {
        // Stripe requires amounts in cents, not dollars
        // $1.00 must be sent as 100, not 1.00
        const amountInCents = Math.round(amount * 100);
        
        return this.stripeClient.charges.create({
            amount: amountInCents,
            currency: 'usd',
            source: cardToken
        });
    }

    retryFailedPayment(paymentId: string): Promise<PaymentResult> {
        // Payment gateway allows maximum 3 retry attempts per 24-hour period
        // Exceeding this limit results in temporary account suspension
        const MAX_RETRIES = 3;
        const retryCount = this.getRetryCount(paymentId);
        
        if (retryCount >= MAX_RETRIES) {
            throw new Error('Maximum retry attempts exceeded');
        }
        
        return this.attemptPayment(paymentId);
    }

    formatPhoneForPaymentGateway(phoneNumber: string): string {
        // Legacy payment API requires exact format: +1-123-456-7890
        // Modern APIs accept various formats, but this one is inflexible
        // TODO: Remove this formatting when we migrate to v2 API (Q2 2024)
        
        const digitsOnly = phoneNumber.replace(/\D/g, '');
        
        if (digitsOnly.length === 10) {
            return `+1-${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
        }
        
        throw new Error('Phone number must have exactly 10 digits');
    }
}

// =============================================================================
// 4. SECURITY AND COMPLIANCE REQUIREMENTS
// =============================================================================

class UserDataHandler {
    hashPassword(password: string): string {
        // OWASP recommends bcrypt with minimum 12 rounds for password hashing
        // Cost factor of 12 provides ~300ms computation time (as of 2023)
        // Increase cost factor annually to maintain security against hardware improvements
        const BCRYPT_ROUNDS = 12;
        return bcrypt.hashSync(password, BCRYPT_ROUNDS);
    }

    sanitizeUserInput(userInput: string): string {
        // XSS prevention: escape HTML entities before database storage
        // Required by security audit SOC-2023-001
        return he.encode(userInput, { useNamedReferences: true });
    }

    logSecurityEvent(event: SecurityEvent): void {
        // PCI DSS requirement: log all authentication attempts
        // Logs must be retained for minimum 1 year per compliance standards
        // Format must include: timestamp, user ID, event type, IP address, result
        const logEntry = {
            timestamp: new Date().toISOString(),
            userId: event.userId,
            eventType: event.type,
            ipAddress: event.ipAddress,
            result: event.success ? 'SUCCESS' : 'FAILURE',
            details: event.details
        };
        
        this.securityLogger.log(logEntry);
    }
}

// =============================================================================
// 5. COMPLEX MATHEMATICAL OR SCIENTIFIC CALCULATIONS
// =============================================================================

class GeospatialCalculator {
    calculateDistanceBetweenPoints(lat1: number, lon1: number, lat2: number, lon2: number): number {
        // Haversine formula for calculating great-circle distance between two points
        // Accounts for Earth's spherical shape - accurate for most applications
        // For higher precision over short distances, consider Vincenty's formula
        
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    calculateCompoundInterest(principal: number, rate: number, years: number): number {
        // Compound interest formula: A = P(1 + r)^t
        // Where: A = final amount, P = principal, r = annual rate, t = time in years
        // Assumes annual compounding - use different formula for monthly/daily compounding
        return principal * Math.pow(1 + rate, years);
    }
}

// =============================================================================
// 6. HELPFUL TODO COMMENTS
// =============================================================================

class InventoryManager {
    checkStockLevels(): StockReport {
        const lowStockItems = this.findLowStockItems();
        
        // TODO: Implement automatic reordering for critical items (ticket #789)
        // Business rule: Auto-reorder when stock < 10% of average monthly sales
        // Waiting for vendor API integration to be completed
        
        // TODO: Add email alerts for out-of-stock items (ticket #790)
        // Should notify: warehouse manager, purchasing team, sales team
        // Template designs completed, need approval from marketing team
        
        return {
            lowStockItems,
            outOfStockItems: this.findOutOfStockItems(),
            overstockItems: this.findOverstockItems()
        };
    }

    processInventoryAdjustment(adjustment: InventoryAdjustment): void {
        this.validateAdjustment(adjustment);
        this.applyAdjustment(adjustment);
        this.logAdjustment(adjustment);
        
        // TODO: Integrate with accounting system for automatic journal entries
        // Requirements gathering in progress with finance team
        // Target completion: Q1 2024 (depends on ERP system upgrade)
    }
}

// =============================================================================
// 7. PERFORMANCE AND OPTIMIZATION NOTES
// =============================================================================

class CacheManager {
    invalidateUserCache(userId: string): void {
        // Invalidate all cache entries for this user
        // This operation takes 50-100ms for users with large amounts of cached data
        // Consider running during off-peak hours for VIP users
        
        const userCacheKeys = this.findUserCacheKeys(userId);
        userCacheKeys.forEach(key => this.cache.delete(key));
        
        // Force garbage collection hint - cache entries may hold large objects
        if (global.gc) {
            global.gc();
        }
    }

    batchUpdateCache(updates: CacheUpdate[]): void {
        // Process updates in batches of 100 to avoid overwhelming Redis
        // Large batch sizes can cause Redis to block other operations
        const BATCH_SIZE = 100;
        
        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = updates.slice(i, i + BATCH_SIZE);
            this.processCacheBatch(batch);
        }
    }
}

// =============================================================================
// 8. COPYRIGHT AND LEGAL REQUIREMENTS
// =============================================================================

/*
 * Patent-pending algorithm for dynamic pricing optimization
 * Patent application #US20230123456A1 filed March 15, 2023
 * 
 * This implementation is proprietary and confidential
 * Unauthorized reproduction or distribution is strictly prohibited
 * 
 * Based on research published in:
 * "Advanced Pricing Algorithms" by Smith et al., Journal of E-Commerce, 2023
 * Used under license agreement #LIC-2023-0456
 */
class DynamicPricingEngine {
    calculateOptimalPrice(product: Product, marketConditions: MarketData): number {
        // Implementation details...
        return 0; // Placeholder
    }
}

// Key principles demonstrated:
// 1. Comments explain WHY, not WHAT
// 2. Business rules and legal requirements are documented
// 3. Performance implications are clearly stated
// 4. External constraints and workarounds are explained
// 5. TODOs include context and timelines
// 6. Security and compliance requirements are noted
// 7. Complex algorithms include source references
// 8. Warnings prevent misuse and performance issues
