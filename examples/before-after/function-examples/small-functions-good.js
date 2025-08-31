// ✅ GOOD EXAMPLE: Small, Focused Functions
// The same functionality broken down into single-responsibility functions

// =============================================================================
// 1. USER VALIDATION FUNCTIONS
// =============================================================================

function validateUserId(userId) {
    if (!userId) {
        throw new Error('User ID is required');
    }
}

function findActiveUser(userId, database) {
    const user = database.users.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    
    if (!user.isActive) {
        throw new Error('User account is inactive');
    }
    
    return user;
}

// =============================================================================
// 2. ORDER VALIDATION FUNCTIONS
// =============================================================================

function validateOrderData(orderData) {
    if (!orderData || typeof orderData !== 'object') {
        throw new Error('Invalid order data');
    }
    
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error('Order must contain at least one item');
    }
}

function validateOrderItem(item, database) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new Error('Invalid item data');
    }
    
    const product = database.products.findById(item.productId);
    if (!product) {
        throw new Error(`Product ${item.productId} not found`);
    }
    
    if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
    }
    
    return product;
}

function validateAllOrderItems(items, database) {
    return items.map(item => validateOrderItem(item, database));
}

// =============================================================================
// 3. PRICE CALCULATION FUNCTIONS
// =============================================================================

function calculateOrderSubtotal(items, database) {
    return items.reduce((total, item) => {
        const product = database.products.findById(item.productId);
        return total + (product.price * item.quantity);
    }, 0);
}

function calculateOrderWeight(items, database) {
    return items.reduce((weight, item) => {
        const product = database.products.findById(item.productId);
        return weight + (product.weight * item.quantity);
    }, 0);
}

function calculateUserDiscount(user, subtotal) {
    if (user.membershipLevel === 'premium') {
        return subtotal * 0.10; // 10% discount
    } else if (user.membershipLevel === 'gold') {
        return subtotal * 0.05; // 5% discount
    }
    return 0;
}

function calculateShippingCost(subtotal, totalWeight) {
    if (subtotal < 50) {
        return 8.99;
    } else if (totalWeight > 10) {
        return totalWeight * 0.5;
    }
    return 0;
}

function calculateTax(subtotal, discount, shippingAddress) {
    const taxRate = shippingAddress?.state === 'CA' ? 0.08 : 0.06;
    return (subtotal - discount) * taxRate;
}

function calculateOrderTotals(orderData, user, database) {
    const subtotal = calculateOrderSubtotal(orderData.items, database);
    const totalWeight = calculateOrderWeight(orderData.items, database);
    const discount = calculateUserDiscount(user, subtotal);
    const shipping = calculateShippingCost(subtotal, totalWeight);
    const tax = calculateTax(subtotal, discount, orderData.shippingAddress);
    const total = subtotal - discount + shipping + tax;
    
    return { subtotal, discount, shipping, tax, total };
}

// =============================================================================
// 4. INVENTORY MANAGEMENT FUNCTIONS
// =============================================================================

function reserveProductStock(productId, quantity, database) {
    const product = database.products.findById(productId);
    product.stock -= quantity;
    database.products.update(product.id, product);
}

function logInventoryChange(productId, quantity, reason, database) {
    database.inventoryLogs.create({
        productId: productId,
        change: -quantity,
        reason: reason,
        timestamp: new Date()
    });
}

function reserveOrderInventory(items, database) {
    for (let item of items) {
        reserveProductStock(item.productId, item.quantity, database);
        logInventoryChange(item.productId, item.quantity, 'order', database);
    }
}

function rollbackInventoryReservation(items, database) {
    for (let item of items) {
        const product = database.products.findById(item.productId);
        product.stock += item.quantity;
        database.products.update(product.id, product);
    }
}

// =============================================================================
// 5. ORDER CREATION FUNCTIONS
// =============================================================================

function enrichOrderItemsWithPrices(items, database) {
    return items.map(item => ({
        ...item,
        price: database.products.findById(item.productId).price
    }));
}

function createOrderObject(orderData, userId, totals) {
    return {
        id: generateOrderId(),
        userId: userId,
        items: enrichOrderItemsWithPrices(orderData.items, database),
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.total,
        status: 'pending',
        createdAt: new Date(),
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod
    };
}

function saveOrderToDatabase(order, database) {
    database.orders.create(order);
    return order;
}

// =============================================================================
// 6. PAYMENT PROCESSING FUNCTIONS
// =============================================================================

function processOrderPayment(order, paymentGateway) {
    const paymentResult = paymentGateway.charge({
        amount: order.total,
        currency: 'USD',
        paymentMethod: order.paymentMethod,
        description: `Order ${order.id}`
    });
    
    if (!paymentResult.success) {
        throw new Error(`Payment failed: ${paymentResult.error}`);
    }
    
    return paymentResult;
}

function confirmOrderWithPayment(order, paymentResult, database) {
    order.paymentId = paymentResult.transactionId;
    order.status = 'confirmed';
    database.orders.update(order.id, order);
    return order;
}

function handlePaymentFailure(order, items, database) {
    rollbackInventoryReservation(items, database);
    database.orders.delete(order.id);
}

// =============================================================================
// 7. NOTIFICATION AND INTEGRATION FUNCTIONS
// =============================================================================

function sendOrderConfirmationEmail(order, user, emailService) {
    const emailTemplate = emailService.getTemplate('order_confirmation');
    const emailContent = emailTemplate
        .replace('{{customerName}}', user.firstName)
        .replace('{{orderId}}', order.id)
        .replace('{{orderTotal}}', formatCurrency(order.total));
    
    emailService.send({
        to: user.email,
        subject: `Order Confirmation ${order.id}`,
        html: emailContent
    });
}

function trackOrderAnalytics(order, analytics) {
    analytics.track('order_completed', {
        userId: order.userId,
        orderId: order.id,
        total: order.total,
        itemCount: order.items.length
    });
}

function triggerOrderFulfillment(order, fulfillmentService) {
    fulfillmentService.createShipment({
        orderId: order.id,
        items: order.items,
        shippingAddress: order.shippingAddress
    });
}

function updateUserOrderStatistics(user, orderTotal, database) {
    user.totalOrders += 1;
    user.totalSpent += orderTotal;
    user.lastOrderDate = new Date();
    database.users.update(user.id, user);
}

function processOrderNotifications(order, user, services) {
    const { emailService, analytics, fulfillmentService, database, logger } = services;
    
    try {
        sendOrderConfirmationEmail(order, user, emailService);
        trackOrderAnalytics(order, analytics);
        triggerOrderFulfillment(order, fulfillmentService);
        updateUserOrderStatistics(user, order.total, database);
    } catch (error) {
        // Log notification failures but don't fail the order
        logger.error('Failed to send notifications for order', { 
            orderId: order.id, 
            error: error.message 
        });
    }
}

// =============================================================================
// 8. MAIN ORCHESTRATION FUNCTION
// =============================================================================

function processUserOrder(orderData, userId, dependencies) {
    const { database, paymentGateway, services } = dependencies;
    
    // Step 1: Validate user and order data
    validateUserId(userId);
    const user = findActiveUser(userId, database);
    validateOrderData(orderData);
    validateAllOrderItems(orderData.items, database);
    
    // Step 2: Calculate pricing
    const totals = calculateOrderTotals(orderData, user, database);
    
    // Step 3: Reserve inventory
    reserveOrderInventory(orderData.items, database);
    
    try {
        // Step 4: Create and save order
        const order = createOrderObject(orderData, userId, totals);
        saveOrderToDatabase(order, database);
        
        try {
            // Step 5: Process payment
            const paymentResult = processOrderPayment(order, paymentGateway);
            const confirmedOrder = confirmOrderWithPayment(order, paymentResult, database);
            
            // Step 6: Handle notifications and integrations
            processOrderNotifications(confirmedOrder, user, services);
            
            // Step 7: Return success response
            return {
                orderId: confirmedOrder.id,
                total: confirmedOrder.total,
                status: confirmedOrder.status,
                estimatedDelivery: calculateDeliveryDate(confirmedOrder.shippingAddress)
            };
            
        } catch (paymentError) {
            handlePaymentFailure(order, orderData.items, database);
            throw paymentError;
        }
        
    } catch (error) {
        rollbackInventoryReservation(orderData.items, database);
        throw error;
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function calculateDeliveryDate(shippingAddress) {
    // Simple logic - could be more sophisticated
    const businessDays = shippingAddress.state === 'CA' ? 2 : 5;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + businessDays);
    return deliveryDate;
}

// Benefits of this refactored version:
// 1. Each function has a single responsibility
// 2. Functions are small and focused (5-15 lines each)
// 3. Easy to test individual functions in isolation
// 4. Easy to modify one concern without affecting others
// 5. Functions can be reused in other contexts
// 6. Clear separation of concerns by grouping related functions
// 7. Main orchestration function tells a clear story
// 8. Error handling is localized and appropriate
// 9. Dependencies are explicit and injectable
// 10. Code is self-documenting through good function names
