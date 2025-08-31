// ❌ BAD: Direct API calls scattered throughout business logic
// Problems: Tight coupling, difficult testing, mixed concerns

import axios from 'axios';

class OrderService {
  async processOrder(order: Order): Promise<void> {
    // Business logic mixed with external API calls
    
    // Validate inventory - direct API call
    const inventoryResponse = await axios.get(
      `https://inventory-api.vendor.com/api/v2/products/${order.productId}/stock`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.INVENTORY_API_KEY}`,
          'X-API-Version': '2.1'
        }
      }
    );
    
    if (inventoryResponse.data.available_quantity < order.quantity) {
      throw new Error('Insufficient inventory');
    }

    // Process payment - direct API call
    const paymentResponse = await axios.post(
      'https://payments.stripe.com/v1/charges',
      {
        amount: order.total * 100, // Stripe expects cents
        currency: 'usd',
        source: order.paymentToken,
        description: `Order ${order.id}`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Stripe-Version': '2023-10-16'
        }
      }
    );

    if (paymentResponse.data.status !== 'succeeded') {
      throw new Error(`Payment failed: ${paymentResponse.data.failure_message}`);
    }

    // Update inventory - another direct API call
    await axios.patch(
      `https://inventory-api.vendor.com/api/v2/products/${order.productId}/stock`,
      {
        decrement_by: order.quantity,
        reason: 'order_fulfillment',
        order_reference: order.id
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.INVENTORY_API_KEY}`,
          'X-API-Version': '2.1',
          'Content-Type': 'application/json'
        }
      }
    );

    // Send notification - yet another direct API call
    await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [{
          to: [{ email: order.customerEmail }],
          subject: `Order Confirmation - ${order.id}`
        }],
        from: { email: 'orders@company.com' },
        content: [{
          type: 'text/html',
          value: `<h1>Thank you for your order!</h1><p>Order ID: ${order.id}</p>`
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Log to external service - more API coupling
    await axios.post(
      'https://api.datadog.com/api/v1/events',
      {
        title: 'Order Processed',
        text: `Order ${order.id} processed successfully`,
        tags: [`customer:${order.customerId}`, `amount:${order.total}`],
        alert_type: 'success'
      },
      {
        headers: {
          'DD-API-KEY': process.env.DATADOG_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // More methods with similar problems...
  async cancelOrder(orderId: string): Promise<void> {
    // Even cancellation is tightly coupled to external APIs
    const orderResponse = await axios.get(`https://orders-db.vendor.com/orders/${orderId}`);
    const order = orderResponse.data;

    // Refund payment - direct Stripe call
    await axios.post(
      `https://payments.stripe.com/v1/charges/${order.chargeId}/refunds`,
      { amount: order.total * 100 },
      { headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` } }
    );

    // Restore inventory - direct inventory API call
    await axios.patch(
      `https://inventory-api.vendor.com/api/v2/products/${order.productId}/stock`,
      { increment_by: order.quantity },
      { headers: { 'Authorization': `Bearer ${process.env.INVENTORY_API_KEY}` } }
    );

    // More scattered API calls...
  }
}

interface Order {
  id: string;
  productId: string;
  quantity: number;
  total: number;
  paymentToken: string;
  customerEmail: string;
  customerId: string;
}

/* 
Problems with this approach:
1. ❌ Business logic mixed with API integration details
2. ❌ Impossible to unit test without hitting real APIs
3. ❌ Vendor lock-in - changing payment providers requires changing business logic
4. ❌ API credentials and URLs scattered throughout code
5. ❌ Different error handling for each external service
6. ❌ No abstraction - business logic knows about HTTP, headers, data formats
7. ❌ Difficult to add retry logic, circuit breakers, or other resilience patterns
8. ❌ Hard to mock or stub for testing
9. ❌ Violates Single Responsibility Principle
10. ❌ Changes to external APIs break business logic
*/
