# Exercise 5: Real-World Refactoring Challenge

Apply all function design principles to refactor complex, realistic legacy code that represents common problems found in production systems.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Apply all function principles to realistic legacy code
- Handle complex refactoring scenarios with multiple intertwined problems
- Prioritize refactoring steps for maximum impact
- Practice incremental improvement techniques
- Demonstrate mastery of function design principles

## 📝 Exercise Format

Each problem presents a realistic piece of legacy code with multiple function design issues. Your job is to systematically refactor the code, applying all the principles you've learned: extraction, parameter design, side effect management, and composition.

---

## Problem 1: Legacy E-commerce Checkout System

### Current Code (JavaScript)
```javascript
// ❌ Real legacy code with multiple function design problems
class CheckoutService {
    
    processCheckout(cartData, customerData, paymentData, shippingData, options) {
        console.log('Starting checkout process...');
        
        // Validation scattered throughout
        if (!cartData || !cartData.items || cartData.items.length === 0) {
            console.error('Cart validation failed');
            throw new Error('Cart is empty');
        }
        
        if (!customerData.email || !this.isValidEmail(customerData.email)) {
            console.error('Customer email validation failed');
            throw new Error('Invalid customer email');
        }
        
        // Mixed business logic and side effects
        let subtotal = 0;
        let totalWeight = 0;
        let hasDigitalItems = false;
        let hasFragileItems = false;
        
        // Item processing with validation and side effects mixed in
        for (let item of cartData.items) {
            // Database call for each item (N+1 problem)
            let product = this.productService.getProduct(item.productId);
            console.log(`Processing item: ${product.name}`);
            
            if (!product) {
                console.error(`Product not found: ${item.productId}`);
                throw new Error(`Product ${item.productId} not found`);
            }
            
            if (product.stock < item.quantity) {
                console.error(`Insufficient stock for ${product.name}`);
                this.notificationService.sendStockAlert(product.id, product.stock, item.quantity);
                throw new Error(`Insufficient stock for ${product.name}`);
            }
            
            // Price calculation with promotional logic
            let itemPrice = product.price;
            
            // Promotion logic scattered and hardcoded
            if (product.category === 'electronics' && item.quantity >= 2) {
                itemPrice = itemPrice * 0.9; // 10% bulk discount
            }
            
            if (customerData.membershipLevel === 'premium' && product.category !== 'sale') {
                itemPrice = itemPrice * 0.95; // 5% membership discount
            }
            
            // Seasonal promotions
            let currentDate = new Date();
            if (currentDate.getMonth() === 11) { // December
                itemPrice = itemPrice * 0.85; // Holiday discount
            }
            
            if (options && options.promoCode) {
                // Promo code logic hardcoded
                if (options.promoCode === 'SAVE10' && subtotal > 50) {
                    itemPrice = itemPrice * 0.9;
                } else if (options.promoCode === 'SAVE20' && subtotal > 100) {
                    itemPrice = itemPrice * 0.8;
                } else if (options.promoCode === 'NEWCUSTOMER' && customerData.isNewCustomer) {
                    itemPrice = itemPrice * 0.85;
                }
            }
            
            let itemTotal = itemPrice * item.quantity;
            subtotal += itemTotal;
            totalWeight += product.weight * item.quantity;
            
            if (product.type === 'digital') {
                hasDigitalItems = true;
            }
            
            if (product.fragile) {
                hasFragileItems = true;
            }
            
            // Update inventory with side effect
            this.inventoryService.reserveStock(item.productId, item.quantity);
            console.log(`Reserved ${item.quantity} units of ${product.name}`);
        }
        
        // Tax calculation with complex rules
        let taxRate = 0.08; // Default
        if (shippingData.state === 'CA') {
            taxRate = 0.0975;
        } else if (shippingData.state === 'NY') {
            taxRate = 0.08375;
        } else if (shippingData.state === 'OR') {
            taxRate = 0; // No sales tax
        } else if (shippingData.state === 'MT') {
            taxRate = 0; // No sales tax
        }
        
        // Digital items tax exemption in certain states
        if (hasDigitalItems && ['MT', 'NH', 'OR', 'DE'].includes(shippingData.state)) {
            // Complex logic to separate digital and physical item taxes
            let digitalSubtotal = 0;
            let physicalSubtotal = 0;
            
            for (let item of cartData.items) {
                let product = this.productService.getProduct(item.productId); // Another DB call!
                let itemPrice = this.calculateItemPrice(product, item, customerData, options); // This method doesn't exist yet
                
                if (product.type === 'digital') {
                    digitalSubtotal += itemPrice * item.quantity;
                } else {
                    physicalSubtotal += itemPrice * item.quantity;
                }
            }
            
            var tax = physicalSubtotal * taxRate; // Using var in modern code
        } else {
            var tax = subtotal * taxRate;
        }
        
        // Shipping calculation with many conditions
        let shippingCost = 0;
        
        if (!hasDigitalItems || totalWeight > 0) { // Physical items need shipping
            if (shippingData.method === 'standard') {
                if (totalWeight <= 1) {
                    shippingCost = 5.99;
                } else if (totalWeight <= 5) {
                    shippingCost = 8.99;
                } else if (totalWeight <= 10) {
                    shippingCost = 12.99;
                } else {
                    shippingCost = 19.99;
                }
                
                // Free shipping promotions
                if (subtotal >= 50 && customerData.membershipLevel === 'premium') {
                    shippingCost = 0;
                } else if (subtotal >= 75) {
                    shippingCost = 0;
                }
                
            } else if (shippingData.method === 'express') {
                shippingCost = totalWeight * 2.5 + 10;
                
                if (shippingData.state !== customerData.billingState) {
                    shippingCost += 5; // Cross-state shipping fee
                }
                
            } else if (shippingData.method === 'overnight') {
                shippingCost = totalWeight * 5 + 25;
                
                if (hasFragileItems) {
                    shippingCost += 15; // Fragile handling fee
                }
            }
            
            // Weekend delivery surcharge
            if (options && options.weekendDelivery) {
                shippingCost += 10;
            }
        }
        
        let total = subtotal + tax + shippingCost;
        
        // Payment processing with error handling
        console.log(`Processing payment of $${total}`);
        
        let paymentResult;
        try {
            paymentResult = this.paymentService.processPayment({
                amount: total,
                currency: 'USD',
                paymentMethod: paymentData.method,
                cardNumber: paymentData.cardNumber,
                expiryMonth: paymentData.expiryMonth,
                expiryYear: paymentData.expiryYear,
                cvv: paymentData.cvv,
                billingAddress: customerData.billingAddress,
                customerEmail: customerData.email
            });
            
        } catch (error) {
            console.error('Payment processing failed:', error);
            
            // Rollback inventory reservations
            for (let item of cartData.items) {
                this.inventoryService.releaseStock(item.productId, item.quantity);
            }
            
            this.analyticsService.trackCheckoutFailure('payment_error', customerData.id, total);
            throw new Error('Payment processing failed: ' + error.message);
        }
        
        if (!paymentResult.success) {
            console.error('Payment declined:', paymentResult.error);
            
            // Rollback inventory reservations
            for (let item of cartData.items) {
                this.inventoryService.releaseStock(item.productId, item.quantity);
            }
            
            this.analyticsService.trackCheckoutFailure('payment_declined', customerData.id, total);
            throw new Error('Payment declined: ' + paymentResult.error);
        }
        
        // Create order record
        let order = {
            id: this.generateOrderId(),
            customerId: customerData.id,
            items: cartData.items.map(item => {
                let product = this.productService.getProduct(item.productId); // Yet another DB call!
                return {
                    productId: item.productId,
                    productName: product.name,
                    quantity: item.quantity,
                    unitPrice: product.price,
                    totalPrice: product.price * item.quantity
                };
            }),
            subtotal: subtotal,
            tax: tax,
            shippingCost: shippingCost,
            total: total,
            status: 'confirmed',
            paymentId: paymentResult.transactionId,
            shippingAddress: shippingData.address,
            billingAddress: customerData.billingAddress,
            createdAt: new Date(),
            estimatedDelivery: this.calculateDeliveryDate(shippingData.method, shippingData.address)
        };
        
        // Save order
        try {
            this.orderService.saveOrder(order);
            console.log(`Order ${order.id} saved successfully`);
        } catch (error) {
            console.error('Failed to save order:', error);
            
            // Attempt to refund payment
            try {
                this.paymentService.refundPayment(paymentResult.transactionId, total);
            } catch (refundError) {
                console.error('Failed to refund payment:', refundError);
                this.alertService.sendCriticalAlert('Failed to refund after order save failure', {
                    orderId: order.id,
                    paymentId: paymentResult.transactionId,
                    amount: total
                });
            }
            
            // Rollback inventory
            for (let item of cartData.items) {
                this.inventoryService.releaseStock(item.productId, item.quantity);
            }
            
            throw new Error('Failed to save order');
        }
        
        // Send confirmation email
        try {
            let emailData = {
                to: customerData.email,
                subject: `Order Confirmation - ${order.id}`,
                template: 'order_confirmation',
                data: {
                    customerName: `${customerData.firstName} ${customerData.lastName}`,
                    orderId: order.id,
                    items: order.items,
                    subtotal: subtotal,
                    tax: tax,
                    shipping: shippingCost,
                    total: total,
                    estimatedDelivery: order.estimatedDelivery,
                    trackingUrl: `https://example.com/track/${order.id}`
                }
            };
            
            this.emailService.sendEmail(emailData);
            console.log(`Confirmation email sent to ${customerData.email}`);
            
        } catch (error) {
            console.error('Failed to send confirmation email:', error);
            // Don't fail the entire checkout for email issues
        }
        
        // Update customer data
        try {
            customerData.lastOrderDate = new Date();
            customerData.totalSpent = (customerData.totalSpent || 0) + total;
            customerData.orderCount = (customerData.orderCount || 0) + 1;
            
            if (customerData.orderCount >= 5 && customerData.membershipLevel === 'standard') {
                customerData.membershipLevel = 'silver';
                console.log(`Customer ${customerData.id} upgraded to silver membership`);
            } else if (customerData.orderCount >= 20 && customerData.membershipLevel === 'silver') {
                customerData.membershipLevel = 'gold';
                console.log(`Customer ${customerData.id} upgraded to gold membership`);
            }
            
            this.customerService.updateCustomer(customerData);
            
        } catch (error) {
            console.error('Failed to update customer data:', error);
            // Don't fail checkout for customer update issues
        }
        
        // Analytics and tracking
        this.analyticsService.trackCheckoutSuccess(customerData.id, total, order.items.length);
        this.analyticsService.trackRevenue(total, order.id);
        
        for (let item of order.items) {
            this.analyticsService.trackProductSale(item.productId, item.quantity, item.totalPrice);
        }
        
        console.log(`Checkout completed successfully for order ${order.id}`);
        
        return {
            success: true,
            orderId: order.id,
            total: total,
            estimatedDelivery: order.estimatedDelivery
        };
    }
    
    isValidEmail(email) {
        // Simplified email validation
        return email && email.includes('@') && email.includes('.');
    }
    
    generateOrderId() {
        return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    calculateDeliveryDate(method, address) {
        let days = method === 'standard' ? 5 : method === 'express' ? 2 : 1;
        let deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + days);
        return deliveryDate;
    }
}
```

### Your Task
This is a comprehensive refactoring challenge. Apply all function design principles systematically.

### Requirements
- [ ] **Extract functions**: Break down the massive method into focused functions
- [ ] **Improve parameters**: Redesign function signatures and parameter objects
- [ ] **Separate side effects**: Isolate pure business logic from I/O operations
- [ ] **Apply composition**: Build the checkout process from composable functions
- [ ] **Handle errors cleanly**: Create consistent error handling throughout
- [ ] **Eliminate duplication**: Remove repeated database calls and logic
- [ ] **Make testable**: Ensure each function can be tested independently

### Refactoring Strategy
1. **Identify concerns**: List all the different responsibilities in the current code
2. **Extract pure functions first**: Start with calculations and validations
3. **Create parameter objects**: Group related parameters together
4. **Separate commands and queries**: Apply command-query separation
5. **Build composition**: Create a pipeline of functions
6. **Add error handling**: Implement consistent error management
7. **Test each step**: Ensure each extracted function is testable

### Focus Areas
- All function design principles in combination
- Real-world complexity management
- Incremental refactoring techniques
- Production-quality error handling

---

## Problem 2: Legacy Report Generation System

### Current Code (Python)
```python
# ❌ Complex legacy reporting system with multiple issues
import csv
import json
import sqlite3
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from email.mime.base import MimeBase
from email import encoders
import os

class ReportGenerator:
    
    def generate_monthly_sales_report(self, month, year, department=None, email_to=None, format='pdf', include_charts=True, compare_previous=True, detailed=True):
        print(f"Generating sales report for {month}/{year}")
        
        # Database connection with hardcoded credentials
        conn = sqlite3.connect('/path/to/database.db')
        cursor = conn.cursor()
        
        # Complex query building based on parameters
        base_query = """
            SELECT s.id, s.sale_date, s.amount, s.quantity, s.customer_id,
                   p.name as product_name, p.category, p.department,
                   c.name as customer_name, c.email, c.city, c.state,
                   e.name as employee_name, e.commission_rate
            FROM sales s
            JOIN products p ON s.product_id = p.id
            JOIN customers c ON s.customer_id = c.id
            JOIN employees e ON s.employee_id = e.id
            WHERE strftime('%m', s.sale_date) = ? AND strftime('%Y', s.sale_date) = ?
        """
        
        params = [str(month).zfill(2), str(year)]
        
        if department:
            base_query += " AND p.department = ?"
            params.append(department)
        
        base_query += " ORDER BY s.sale_date DESC"
        
        try:
            cursor.execute(base_query, params)
            sales_data = cursor.fetchall()
        except Exception as e:
            print(f"Database error: {e}")
            conn.close()
            return None
        
        if not sales_data:
            print("No sales data found for the specified period")
            conn.close()
            return None
        
        # Data processing with mixed concerns
        total_revenue = 0
        total_quantity = 0
        product_sales = {}
        customer_sales = {}
        employee_sales = {}
        daily_sales = {}
        category_sales = {}
        department_sales = {}
        
        # Process each sale record
        for sale in sales_data:
            sale_id, sale_date, amount, quantity, customer_id, product_name, category, dept, customer_name, customer_email, city, state, employee_name, commission_rate = sale
            
            total_revenue += amount
            total_quantity += quantity
            
            # Product aggregation
            if product_name not in product_sales:
                product_sales[product_name] = {'revenue': 0, 'quantity': 0, 'category': category}
            product_sales[product_name]['revenue'] += amount
            product_sales[product_name]['quantity'] += quantity
            
            # Customer aggregation
            if customer_name not in customer_sales:
                customer_sales[customer_name] = {'revenue': 0, 'quantity': 0, 'email': customer_email, 'location': f"{city}, {state}"}
            customer_sales[customer_name]['revenue'] += amount
            customer_sales[customer_name]['quantity'] += quantity
            
            # Employee aggregation with commission calculation
            if employee_name not in employee_sales:
                employee_sales[employee_name] = {'revenue': 0, 'quantity': 0, 'commission': 0}
            employee_sales[employee_name]['revenue'] += amount
            employee_sales[employee_name]['quantity'] += quantity
            employee_sales[employee_name]['commission'] += amount * (commission_rate / 100)
            
            # Daily sales aggregation
            sale_date_key = sale_date[:10]  # Extract YYYY-MM-DD
            if sale_date_key not in daily_sales:
                daily_sales[sale_date_key] = {'revenue': 0, 'quantity': 0, 'transactions': 0}
            daily_sales[sale_date_key]['revenue'] += amount
            daily_sales[sale_date_key]['quantity'] += quantity
            daily_sales[sale_date_key]['transactions'] += 1
            
            # Category aggregation
            if category not in category_sales:
                category_sales[category] = {'revenue': 0, 'quantity': 0}
            category_sales[category]['revenue'] += amount
            category_sales[category]['quantity'] += quantity
            
            # Department aggregation
            if dept not in department_sales:
                department_sales[dept] = {'revenue': 0, 'quantity': 0}
            department_sales[dept]['revenue'] += amount
            department_sales[dept]['quantity'] += quantity
        
        # Previous month comparison if requested
        previous_month_data = None
        if compare_previous:
            prev_month = month - 1 if month > 1 else 12
            prev_year = year if month > 1 else year - 1
            
            prev_query = base_query.replace("strftime('%m', s.sale_date) = ? AND strftime('%Y', s.sale_date) = ?",
                                          "strftime('%m', s.sale_date) = ? AND strftime('%Y', s.sale_date) = ?")
            prev_params = [str(prev_month).zfill(2), str(prev_year)] + params[2:]  # Skip the first two parameters
            
            try:
                cursor.execute(prev_query, prev_params)
                prev_sales_data = cursor.fetchall()
                
                prev_total_revenue = sum(sale[2] for sale in prev_sales_data)
                prev_total_quantity = sum(sale[3] for sale in prev_sales_data)
                
                previous_month_data = {
                    'revenue': prev_total_revenue,
                    'quantity': prev_total_quantity,
                    'transactions': len(prev_sales_data)
                }
                
            except Exception as e:
                print(f"Error fetching previous month data: {e}")
                previous_month_data = None
        
        conn.close()
        
        # Calculate summary statistics
        avg_order_value = total_revenue / len(sales_data) if sales_data else 0
        unique_customers = len(customer_sales)
        unique_products = len(product_sales)
        
        # Top performers
        top_products = sorted(product_sales.items(), key=lambda x: x[1]['revenue'], reverse=True)[:10]
        top_customers = sorted(customer_sales.items(), key=lambda x: x[1]['revenue'], reverse=True)[:10]
        top_employees = sorted(employee_sales.items(), key=lambda x: x[1]['revenue'], reverse=True)[:10]
        
        # Report generation based on format
        report_content = ""
        
        if format == 'text' or format == 'email':
            # Text format generation
            report_content += f"MONTHLY SALES REPORT\n"
            report_content += f"{'='*50}\n"
            report_content += f"Period: {month:02d}/{year}\n"
            if department:
                report_content += f"Department: {department}\n"
            report_content += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            
            # Summary section
            report_content += f"SUMMARY\n"
            report_content += f"{'-'*20}\n"
            report_content += f"Total Revenue: ${total_revenue:,.2f}\n"
            report_content += f"Total Quantity Sold: {total_quantity:,}\n"
            report_content += f"Total Transactions: {len(sales_data):,}\n"
            report_content += f"Average Order Value: ${avg_order_value:.2f}\n"
            report_content += f"Unique Customers: {unique_customers:,}\n"
            report_content += f"Unique Products Sold: {unique_products:,}\n\n"
            
            # Previous month comparison
            if previous_month_data:
                revenue_change = ((total_revenue - previous_month_data['revenue']) / previous_month_data['revenue']) * 100 if previous_month_data['revenue'] > 0 else 0
                quantity_change = ((total_quantity - previous_month_data['quantity']) / previous_month_data['quantity']) * 100 if previous_month_data['quantity'] > 0 else 0
                
                report_content += f"COMPARISON TO PREVIOUS MONTH\n"
                report_content += f"{'-'*30}\n"
                report_content += f"Revenue Change: {revenue_change:+.1f}%\n"
                report_content += f"Quantity Change: {quantity_change:+.1f}%\n\n"
            
            # Top products section
            report_content += f"TOP 10 PRODUCTS BY REVENUE\n"
            report_content += f"{'-'*30}\n"
            for i, (product, data) in enumerate(top_products, 1):
                report_content += f"{i:2d}. {product}: ${data['revenue']:,.2f} ({data['quantity']} units)\n"
            report_content += "\n"
            
            if detailed:
                # Top customers section
                report_content += f"TOP 10 CUSTOMERS BY REVENUE\n"
                report_content += f"{'-'*30}\n"
                for i, (customer, data) in enumerate(top_customers, 1):
                    report_content += f"{i:2d}. {customer}: ${data['revenue']:,.2f} ({data['location']})\n"
                report_content += "\n"
                
                # Top employees section
                report_content += f"TOP 10 EMPLOYEES BY SALES\n"
                report_content += f"{'-'*30}\n"
                for i, (employee, data) in enumerate(top_employees, 1):
                    report_content += f"{i:2d}. {employee}: ${data['revenue']:,.2f} (Commission: ${data['commission']:,.2f})\n"
                report_content += "\n"
                
                # Category breakdown
                report_content += f"SALES BY CATEGORY\n"
                report_content += f"{'-'*20}\n"
                for category, data in sorted(category_sales.items(), key=lambda x: x[1]['revenue'], reverse=True):
                    percentage = (data['revenue'] / total_revenue) * 100
                    report_content += f"{category}: ${data['revenue']:,.2f} ({percentage:.1f}%)\n"
                report_content += "\n"
        
        elif format == 'csv':
            # CSV format generation
            csv_data = []
            csv_data.append(['Product', 'Category', 'Department', 'Revenue', 'Quantity'])
            for product, data in product_sales.items():
                csv_data.append([product, data['category'], '', data['revenue'], data['quantity']])
            
            # Convert to CSV string
            import io
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerows(csv_data)
            report_content = output.getvalue()
            output.close()
        
        elif format == 'json':
            # JSON format generation
            report_data = {
                'period': f"{month:02d}/{year}",
                'department': department,
                'generated_at': datetime.now().isoformat(),
                'summary': {
                    'total_revenue': total_revenue,
                    'total_quantity': total_quantity,
                    'total_transactions': len(sales_data),
                    'average_order_value': avg_order_value,
                    'unique_customers': unique_customers,
                    'unique_products': unique_products
                },
                'previous_month_comparison': previous_month_data,
                'top_products': dict(top_products[:10]),
                'top_customers': dict(top_customers[:10]) if detailed else {},
                'category_breakdown': category_sales,
                'department_breakdown': department_sales if not department else {}
            }
            report_content = json.dumps(report_data, indent=2, default=str)
        
        # Save report to file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"sales_report_{month:02d}_{year}_{timestamp}.{format}"
        
        try:
            with open(filename, 'w') as f:
                f.write(report_content)
            print(f"Report saved as {filename}")
        except Exception as e:
            print(f"Error saving report: {e}")
            return None
        
        # Email the report if requested
        if email_to:
            try:
                self.send_email_report(email_to, report_content, filename, format, month, year, department)
                print(f"Report emailed to {email_to}")
            except Exception as e:
                print(f"Error sending email: {e}")
        
        # Generate charts if requested and format supports it
        if include_charts and format in ['pdf', 'html']:
            try:
                chart_data = {
                    'daily_sales': daily_sales,
                    'category_sales': category_sales,
                    'top_products': dict(top_products[:5])
                }
                self.generate_charts(chart_data, filename.replace(f'.{format}', '_charts.png'))
            except Exception as e:
                print(f"Error generating charts: {e}")
        
        return {
            'filename': filename,
            'total_revenue': total_revenue,
            'total_transactions': len(sales_data),
            'report_content': report_content if format in ['text', 'json'] else None
        }
    
    def send_email_report(self, email_to, content, filename, format, month, year, department):
        # Email configuration hardcoded
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "reports@company.com"
        sender_password = "hardcoded_password"  # Security issue!
        
        msg = MimeMultipart()
        msg['From'] = sender_email
        msg['To'] = email_to
        msg['Subject'] = f"Monthly Sales Report - {month:02d}/{year}" + (f" ({department})" if department else "")
        
        body = f"Please find the attached monthly sales report for {month:02d}/{year}."
        if department:
            body += f" Department: {department}"
        
        msg.attach(MimeText(body, 'plain'))
        
        # Attach report file
        with open(filename, "rb") as attachment:
            part = MimeBase('application', 'octet-stream')
            part.set_payload(attachment.read())
        
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename= {filename}'
        )
        msg.attach(part)
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, email_to, text)
        server.quit()
    
    def generate_charts(self, chart_data, filename):
        # Chart generation logic would go here
        # This is a placeholder
        print(f"Charts would be generated and saved as {filename}")
        pass
```

### Your Task
Refactor this legacy reporting system using all function design principles.

### Requirements
- [ ] **Extract data access**: Separate database operations from business logic
- [ ] **Pure calculations**: Extract all aggregation and calculation logic
- [ ] **Parameter design**: Improve the massive parameter list
- [ ] **Format separation**: Extract different format generators
- [ ] **Error handling**: Implement consistent error management
- [ ] **Remove hardcoded values**: Extract configuration
- [ ] **Composition**: Build report generation as a pipeline

### Focus Areas
- Data access layer separation
- Business logic extraction
- Format strategy pattern
- Configuration management
- Error handling strategies

---

## 🏆 Success Criteria

For these real-world refactoring challenges, your solution should demonstrate:

### Comprehensive Function Design
- **Single Responsibility**: Each function has one clear purpose
- **Small Size**: Functions are easy to understand at a glance
- **Clear Naming**: Function names clearly indicate their purpose
- **Clean Parameters**: Function signatures are intuitive and minimal

### Advanced Patterns Application
- **Pure Functions**: Business logic is separated from side effects
- **Composition**: Complex operations are built from simple functions
- **Error Handling**: Consistent error management throughout
- **Testability**: Each function can be tested independently

### Production Quality
- **Performance**: Eliminated inefficiencies (like N+1 queries)
- **Maintainability**: Code is easy to modify and extend
- **Robustness**: Proper error handling and recovery
- **Security**: No hardcoded credentials or security issues

---

## 💡 Refactoring Strategy

### **1. Incremental Approach**
```
1. Extract pure functions first (calculations, validations)
2. Separate I/O operations (database, file, email)
3. Create parameter objects for complex signatures
4. Apply composition patterns
5. Add comprehensive error handling
6. Create comprehensive tests
```

### **2. Identify Patterns**
- **Data Access**: Database queries and file operations
- **Business Logic**: Calculations, validations, aggregations
- **Formatting**: Different output format generation
- **Configuration**: Settings and environment-specific values
- **Communication**: Email, logging, notifications

### **3. Apply All Principles**
- **Extraction**: Break down large functions
- **Parameters**: Use parameter objects and dependency injection
- **Side Effects**: Separate pure and impure functions
- **Composition**: Build pipelines from small functions

---

## 🎯 Self-Assessment

After completing the refactoring challenges:

### **Function Design Mastery (1-5 scale)**
- [ ] **Extraction**: Can break down complex functions systematically
- [ ] **Parameters**: Can design clean, intuitive function signatures
- [ ] **Side Effects**: Can separate pure logic from side effects
- [ ] **Composition**: Can build complex operations from simple functions

### **Real-World Application (1-5 scale)**
- [ ] **Legacy Code**: Can handle complex, realistic refactoring scenarios
- [ ] **Performance**: Can identify and fix performance issues
- [ ] **Maintainability**: Can create code that's easy to modify
- [ ] **Production Quality**: Can deliver professional-grade solutions

**Target**: All scores should be 4 or 5. This represents mastery of function design principles.

---

## 🚀 Congratulations!

If you've completed these real-world refactoring challenges successfully, you have demonstrated **mastery of function design principles**. You can:

- **Extract functions** systematically from complex code
- **Design clean parameters** that make functions easy to use
- **Separate side effects** to create testable, predictable code
- **Compose functions** to build elegant solutions to complex problems
- **Apply all principles** together in realistic scenarios

### **Next Steps in Your Clean Code Journey:**
1. **Apply these skills** to your real projects
2. **Practice regularly** - function design improves with experience
3. **Teach others** - explaining these concepts reinforces your understanding
4. **Move to [Comments Exercises](../03-comments/README.md)** - Learn when and how to write valuable comments

**You've mastered one of the most important aspects of clean code - congratulations!** 🎉
