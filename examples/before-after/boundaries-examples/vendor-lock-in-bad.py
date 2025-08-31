# ❌ BAD: Tight coupling to vendor services
# Problems: Vendor lock-in, difficult testing, mixed concerns

import boto3
import requests
import json
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from twilio.rest import Client as TwilioClient

class NotificationService:
    def __init__(self):
        # Direct vendor SDK initialization in business logic
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id='your-key',
            aws_secret_access_key='your-secret',
            region_name='us-east-1'
        )
        self.sendgrid = SendGridAPIClient(api_key='your-sendgrid-key')
        self.twilio = TwilioClient('account-sid', 'auth-token')
        
    def send_order_confirmation(self, order_data, customer_email, customer_phone):
        # Business logic tightly coupled to multiple vendor APIs
        
        # Generate PDF receipt using vendor-specific code
        pdf_content = self.generate_pdf_receipt(order_data)
        
        # Upload to S3 - vendor-specific implementation
        bucket_name = 'my-receipts-bucket'
        file_key = f"receipts/{order_data['order_id']}.pdf"
        
        try:
            # Direct AWS S3 API usage in business logic
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=file_key,
                Body=pdf_content,
                ContentType='application/pdf',
                ServerSideEncryption='AES256',
                Metadata={
                    'order-id': order_data['order_id'],
                    'customer-email': customer_email,
                    'generated-at': str(order_data['timestamp'])
                }
            )
            
            # Generate presigned URL for receipt access
            receipt_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket_name, 'Key': file_key},
                ExpiresIn=86400  # 24 hours
            )
            
        except Exception as e:
            print(f"S3 upload failed: {e}")
            receipt_url = None

        # Send email using SendGrid - vendor-specific implementation
        try:
            # SendGrid-specific message construction
            message = Mail(
                from_email='orders@company.com',
                to_emails=customer_email,
                subject=f'Order Confirmation - {order_data["order_id"]}',
                html_content=f'''
                <h1>Thank you for your order!</h1>
                <p>Order ID: {order_data["order_id"]}</p>
                <p>Total: ${order_data["total"]}</p>
                {"<p><a href='" + receipt_url + "'>Download Receipt</a></p>" if receipt_url else ""}
                '''
            )
            
            # SendGrid-specific attachment handling
            if receipt_url:
                # Download from S3 to attach to email (inefficient!)
                response = requests.get(receipt_url)
                if response.status_code == 200:
                    import base64
                    encoded_content = base64.b64encode(response.content).decode()
                    attachment = {
                        'content': encoded_content,
                        'type': 'application/pdf',
                        'filename': f'receipt_{order_data["order_id"]}.pdf',
                        'disposition': 'attachment'
                    }
                    message.attachment = attachment
            
            # Send via SendGrid
            response = self.sendgrid.send(message)
            print(f"Email sent, status: {response.status_code}")
            
        except Exception as e:
            print(f"SendGrid email failed: {e}")

        # Send SMS using Twilio - another vendor-specific implementation
        try:
            # Twilio-specific message format
            sms_body = f"""
Order Confirmed! 
Order #{order_data['order_id']}
Total: ${order_data['total']}
{"Receipt: " + receipt_url if receipt_url else ""}
"""
            
            # Direct Twilio API usage
            message = self.twilio.messages.create(
                body=sms_body,
                from_='+1234567890',  # Twilio phone number
                to=customer_phone
            )
            
            print(f"SMS sent, SID: {message.sid}")
            
        except Exception as e:
            print(f"Twilio SMS failed: {e}")

    def send_shipping_update(self, order_id, tracking_number, customer_email, customer_phone):
        # More vendor-specific code scattered in business methods
        
        # Email via SendGrid
        try:
            message = Mail(
                from_email='shipping@company.com',
                to_emails=customer_email,
                subject=f'Your order {order_id} has shipped!',
                html_content=f'''
                <h1>Your order is on its way!</h1>
                <p>Order ID: {order_id}</p>
                <p>Tracking Number: {tracking_number}</p>
                <p><a href="https://ups.com/track?tracknum={tracking_number}">Track Package</a></p>
                '''
            )
            
            response = self.sendgrid.send(message)
            
        except Exception as e:
            print(f"Shipping email failed: {e}")

        # SMS via Twilio
        try:
            sms_body = f"Order {order_id} shipped! Track: https://ups.com/track?tracknum={tracking_number}"
            
            self.twilio.messages.create(
                body=sms_body,
                from_='+1234567890',
                to=customer_phone
            )
            
        except Exception as e:
            print(f"Shipping SMS failed: {e}")

    def generate_pdf_receipt(self, order_data):
        # Using another vendor library directly
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        import io
        
        # ReportLab-specific PDF generation
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # ReportLab-specific drawing commands
        p.drawString(100, 750, f"Receipt for Order {order_data['order_id']}")
        p.drawString(100, 730, f"Total: ${order_data['total']}")
        p.drawString(100, 710, f"Date: {order_data['timestamp']}")
        
        for i, item in enumerate(order_data['items']):
            y_pos = 680 - (i * 20)
            p.drawString(120, y_pos, f"{item['name']} - Qty: {item['qty']} - ${item['price']}")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return buffer.getvalue()

    def cleanup_old_receipts(self):
        # More S3-specific code in business logic
        try:
            # List objects in S3 bucket
            response = self.s3_client.list_objects_v2(
                Bucket='my-receipts-bucket',
                Prefix='receipts/'
            )
            
            import datetime
            cutoff_date = datetime.datetime.now() - datetime.timedelta(days=90)
            
            for obj in response.get('Contents', []):
                if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                    # Delete old receipts
                    self.s3_client.delete_object(
                        Bucket='my-receipts-bucket',
                        Key=obj['Key']
                    )
                    print(f"Deleted old receipt: {obj['Key']}")
                    
        except Exception as e:
            print(f"Cleanup failed: {e}")

# Usage example showing tight coupling
def process_order_notification(order_data, customer_email, customer_phone):
    # Business logic directly depends on vendor implementations
    notification_service = NotificationService()
    notification_service.send_order_confirmation(order_data, customer_email, customer_phone)

"""
Problems with this approach:
1. ❌ Vendor lock-in - changing providers requires rewriting business logic
2. ❌ Impossible to unit test without real vendor services
3. ❌ Vendor-specific error handling scattered throughout
4. ❌ API keys and configuration mixed with business logic
5. ❌ Different SDKs and patterns for each vendor
6. ❌ Business logic knows about S3 buckets, SendGrid templates, Twilio numbers
7. ❌ Difficult to add retry logic or circuit breakers consistently
8. ❌ Hard to mock or stub for testing
9. ❌ Violates Single Responsibility Principle
10. ❌ Vendor API changes break business logic directly
11. ❌ No consistent error handling across vendors
12. ❌ Performance issues (downloading from S3 to attach to email)
"""
