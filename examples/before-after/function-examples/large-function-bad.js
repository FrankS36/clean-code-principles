// ❌ BAD EXAMPLE: Large Function with Multiple Responsibilities
// This function tries to do everything in one place

function processUserOrder(orderData, userId) {
    // This function is 80+ lines and handles multiple concerns
    
    // Concern 1: User validation and retrieval (10 lines)
    if (!userId) {
        throw new Error('User ID is required');
    }
    
    const user = database.users.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    
    if (!user.isActive) {
        throw new Error('User account is inactive');
    }
    
    // Concern 2: Order data validation (15 lines)
    if (!orderData || typeof orderData !== 'object') {
        throw new Error('Invalid order data');
    }
    
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error('Order must contain at least one item');
    }
    
    for (let item of orderData.items) {
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
    }
    
    // Concern 3: Price calculations (15 lines)
    let subtotal = 0;
    let totalWeight = 0;
    
    for (let item of orderData.items) {
        const product = database.products.findById(item.productId);
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        totalWeight += product.weight * item.quantity;
    }
    
    // Apply user discount
    let discount = 0;
    if (user.membershipLevel === 'premium') {
        discount = subtotal * 0.10; // 10% discount
    } else if (user.membershipLevel === 'gold') {
        discount = subtotal * 0.05; // 5% discount
    }
    
    // Calculate shipping
    let shipping = 0;
    if (subtotal < 50) {
        shipping = 8.99;
    } else if (totalWeight > 10) {
        shipping = totalWeight * 0.5;
    }
    
    // Calculate tax
    const taxRate = orderData.shippingAddress?.state === 'CA' ? 0.08 : 0.06;
    const tax = (subtotal - discount) * taxRate;
    
    const total = subtotal - discount + shipping + tax;
    
    // Concern 4: Inventory management (10 lines)
    for (let item of orderData.items) {
        const product = database.products.findById(item.productId);
        product.stock -= item.quantity;
        database.products.update(product.id, product);
        
        // Log inventory change
        database.inventoryLogs.create({
            productId: product.id,
            change: -item.quantity,
            reason: 'order',
            timestamp: new Date()
        });
    }
    
    // Concern 5: Order creation and persistence (8 lines)
    const order = {
        id: generateOrderId(),
        userId: userId,
        items: orderData.items.map(item => ({
            ...item,
            price: database.products.findById(item.productId).price
        })),
        subtotal: subtotal,
        discount: discount,
        shipping: shipping,
        tax: tax,
        total: total,
        status: 'pending',
        createdAt: new Date(),
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod
    };
    
    database.orders.create(order);
    
    // Concern 6: Payment processing (12 lines)
    try {
        const paymentResult = paymentGateway.charge({
            amount: total,
            currency: 'USD',
            paymentMethod: orderData.paymentMethod,
            description: `Order ${order.id}`
        });
        
        if (!paymentResult.success) {
            // Rollback inventory changes
            for (let item of orderData.items) {
                const product = database.products.findById(item.productId);
                product.stock += item.quantity;
                database.products.update(product.id, product);
            }
            
            database.orders.delete(order.id);
            throw new Error(`Payment failed: ${paymentResult.error}`);
        }
        
        order.paymentId = paymentResult.transactionId;
        order.status = 'confirmed';
        database.orders.update(order.id, order);
        
    } catch (error) {
        // Rollback everything on payment failure
        for (let item of orderData.items) {
            const product = database.products.findById(item.productId);
            product.stock += item.quantity;
            database.products.update(product.id, product);
        }
        
        database.orders.delete(order.id);
        throw error;
    }
    
    // Concern 7: Notifications and external integrations (15 lines)
    try {
        // Send confirmation email
        const emailTemplate = emailService.getTemplate('order_confirmation');
        const emailContent = emailTemplate
            .replace('{{customerName}}', user.firstName)
            .replace('{{orderId}}', order.id)
            .replace('{{orderTotal}}', formatCurrency(total));
        
        emailService.send({
            to: user.email,
            subject: `Order Confirmation ${order.id}`,
            html: emailContent
        });
        
        // Update customer analytics
        analytics.track('order_completed', {
            userId: userId,
            orderId: order.id,
            total: total,
            itemCount: orderData.items.length
        });
        
        // Trigger fulfillment workflow
        fulfillmentService.createShipment({
            orderId: order.id,
            items: order.items,
            shippingAddress: order.shippingAddress
        });
        
        // Update user statistics
        user.totalOrders += 1;
        user.totalSpent += total;
        user.lastOrderDate = new Date();
        database.users.update(user.id, user);
        
    } catch (error) {
        // Log notification failures but don't fail the order
        logger.error('Failed to send notifications for order', { orderId: order.id, error: error.message });
    }
    
    return {
        orderId: order.id,
        total: total,
        status: order.status,
        estimatedDelivery: calculateDeliveryDate(order.shippingAddress)
    };
}

// Problems with this function:
// 1. It's 80+ lines long - too big to understand at a glance
// 2. It handles 7 different concerns - violates Single Responsibility Principle
// 3. It's hard to test - needs complex setup and mocking
// 4. It's hard to modify - changing one concern might break others
// 5. It's hard to reuse - tightly coupled logic
// 6. It has complex error handling and rollback logic mixed with business logic
// 7. It's difficult to debug - too many things happening in one place
// 8. It violates the "Extract Till You Drop" principle
// 9. The abstraction levels are mixed - high-level workflow mixed with low-level details
// 10. It's impossible to unit test individual concerns in isolation
