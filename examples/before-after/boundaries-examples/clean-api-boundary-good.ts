// ✅ GOOD: Clean boundaries with adapter pattern
// Benefits: Testable, flexible, maintainable, clear separation of concerns

// Domain-focused interfaces (no external API details)
interface InventoryService {
  checkAvailability(productId: string, quantity: number): Promise<boolean>;
  reserveStock(productId: string, quantity: number, orderReference: string): Promise<void>;
  releaseStock(productId: string, quantity: number, orderReference: string): Promise<void>;
}

interface PaymentService {
  processPayment(amount: number, paymentToken: string, description: string): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount: number): Promise<void>;
}

interface NotificationService {
  sendOrderConfirmation(email: string, orderDetails: OrderDetails): Promise<void>;
}

interface AuditService {
  logOrderEvent(event: OrderEvent): Promise<void>;
}

// Clean business logic - no external API knowledge
class OrderService {
  constructor(
    private inventoryService: InventoryService,
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private auditService: AuditService
  ) {}

  async processOrder(order: Order): Promise<void> {
    // Pure business logic - easy to understand and test
    
    // Check inventory availability
    const isAvailable = await this.inventoryService.checkAvailability(
      order.productId, 
      order.quantity
    );
    
    if (!isAvailable) {
      throw new OrderError('Insufficient inventory', 'INVENTORY_SHORTAGE');
    }

    // Process payment
    const paymentResult = await this.paymentService.processPayment(
      order.total,
      order.paymentToken,
      `Order ${order.id}`
    );

    try {
      // Reserve inventory
      await this.inventoryService.reserveStock(
        order.productId,
        order.quantity,
        order.id
      );

      // Send confirmation
      await this.notificationService.sendOrderConfirmation(
        order.customerEmail,
        { orderId: order.id, total: order.total }
      );

      // Log success
      await this.auditService.logOrderEvent({
        type: 'ORDER_PROCESSED',
        orderId: order.id,
        customerId: order.customerId,
        amount: order.total
      });

    } catch (error) {
      // If anything fails after payment, we need to refund
      await this.paymentService.refundPayment(paymentResult.paymentId, order.total);
      throw new OrderError('Order processing failed', 'PROCESSING_ERROR', error);
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    // Simple, focused business logic
    const order = await this.getOrder(orderId);
    
    await this.paymentService.refundPayment(order.paymentId, order.total);
    await this.inventoryService.releaseStock(order.productId, order.quantity, orderId);
    
    await this.auditService.logOrderEvent({
      type: 'ORDER_CANCELLED',
      orderId,
      customerId: order.customerId
    });
  }

  private async getOrder(orderId: string): Promise<Order> {
    // This would use a repository pattern for data access
    throw new Error('Implementation depends on data layer');
  }
}

// Adapter implementations handle external API details
class ExternalInventoryAdapter implements InventoryService {
  constructor(
    private apiClient: HttpClient,
    private config: InventoryConfig
  ) {}

  async checkAvailability(productId: string, quantity: number): Promise<boolean> {
    try {
      const response = await this.apiClient.get(
        `${this.config.baseUrl}/products/${productId}/stock`,
        {
          headers: this.getAuthHeaders()
        }
      );
      
      return response.data.available_quantity >= quantity;
    } catch (error) {
      throw new IntegrationError('Inventory check failed', 'INVENTORY_SERVICE', error);
    }
  }

  async reserveStock(productId: string, quantity: number, orderReference: string): Promise<void> {
    try {
      await this.apiClient.patch(
        `${this.config.baseUrl}/products/${productId}/stock`,
        {
          decrement_by: quantity,
          reason: 'order_fulfillment',
          order_reference: orderReference
        },
        {
          headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      throw new IntegrationError('Stock reservation failed', 'INVENTORY_SERVICE', error);
    }
  }

  async releaseStock(productId: string, quantity: number, orderReference: string): Promise<void> {
    try {
      await this.apiClient.patch(
        `${this.config.baseUrl}/products/${productId}/stock`,
        {
          increment_by: quantity,
          reason: 'order_cancellation',
          order_reference: orderReference
        },
        {
          headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      throw new IntegrationError('Stock release failed', 'INVENTORY_SERVICE', error);
    }
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-API-Version': this.config.apiVersion
    };
  }
}

class StripePaymentAdapter implements PaymentService {
  constructor(
    private stripeClient: StripeClient,
    private config: PaymentConfig
  ) {}

  async processPayment(amount: number, paymentToken: string, description: string): Promise<PaymentResult> {
    try {
      const charge = await this.stripeClient.charges.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        source: paymentToken,
        description
      });

      return {
        paymentId: charge.id,
        status: charge.status === 'succeeded' ? 'SUCCESS' : 'FAILED',
        transactionId: charge.balance_transaction as string
      };
    } catch (error) {
      throw new IntegrationError('Payment processing failed', 'PAYMENT_SERVICE', error);
    }
  }

  async refundPayment(paymentId: string, amount: number): Promise<void> {
    try {
      await this.stripeClient.refunds.create({
        charge: paymentId,
        amount: Math.round(amount * 100)
      });
    } catch (error) {
      throw new IntegrationError('Refund failed', 'PAYMENT_SERVICE', error);
    }
  }
}

// Domain types
interface Order {
  id: string;
  productId: string;
  quantity: number;
  total: number;
  paymentToken: string;
  paymentId?: string;
  customerEmail: string;
  customerId: string;
}

interface PaymentResult {
  paymentId: string;
  status: 'SUCCESS' | 'FAILED';
  transactionId: string;
}

interface OrderDetails {
  orderId: string;
  total: number;
}

interface OrderEvent {
  type: 'ORDER_PROCESSED' | 'ORDER_CANCELLED';
  orderId: string;
  customerId: string;
  amount?: number;
}

// Configuration types
interface InventoryConfig {
  baseUrl: string;
  apiKey: string;
  apiVersion: string;
}

interface PaymentConfig {
  secretKey: string;
}

// Error types
class OrderError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'OrderError';
  }
}

class IntegrationError extends Error {
  constructor(
    message: string,
    public service: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

// Mock HTTP client interface
interface HttpClient {
  get(url: string, config?: any): Promise<any>;
  post(url: string, data?: any, config?: any): Promise<any>;
  patch(url: string, data?: any, config?: any): Promise<any>;
}

// Mock Stripe client interface
interface StripeClient {
  charges: {
    create(params: any): Promise<any>;
  };
  refunds: {
    create(params: any): Promise<any>;
  };
}

/* 
Benefits of this approach:
1. ✅ Business logic is pure and focused
2. ✅ Easy to unit test with mocks/stubs
3. ✅ Can swap external services without changing business logic
4. ✅ Configuration centralized in adapters
5. ✅ Consistent error handling through custom exceptions
6. ✅ Single Responsibility Principle maintained
7. ✅ External API changes only affect adapters
8. ✅ Easy to add resilience patterns (retry, circuit breaker)
9. ✅ Clear interface contracts
10. ✅ Dependency injection enables flexibility
*/
