# ✅ GOOD: Clean service abstraction with adapter pattern
# Benefits: Vendor independence, testable, maintainable, consistent

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

# Domain-focused interfaces (no vendor details)
class DocumentStorage(ABC):
    @abstractmethod
    async def store_document(self, document: Document) -> StorageResult:
        pass
    
    @abstractmethod
    async def get_document_url(self, document_id: str, expires_in_hours: int = 24) -> Optional[str]:
        pass
    
    @abstractmethod
    async def cleanup_expired_documents(self, retention_days: int) -> int:
        pass

class EmailService(ABC):
    @abstractmethod
    async def send_email(self, email: Email) -> DeliveryResult:
        pass

class SMSService(ABC):
    @abstractmethod
    async def send_sms(self, message: SMSMessage) -> DeliveryResult:
        pass

class DocumentGenerator(ABC):
    @abstractmethod
    async def generate_receipt(self, order_data: OrderData) -> Document:
        pass

# Domain models
@dataclass
class Document:
    content: bytes
    filename: str
    content_type: str
    metadata: Dict[str, str]

@dataclass
class StorageResult:
    document_id: str
    success: bool
    error_message: Optional[str] = None

@dataclass
class Email:
    to_address: str
    subject: str
    html_content: str
    from_address: str = "orders@company.com"
    attachments: List[Document] = None

@dataclass
class SMSMessage:
    to_phone: str
    content: str
    from_phone: str = "+1234567890"

@dataclass
class DeliveryResult:
    success: bool
    message_id: Optional[str] = None
    error_message: Optional[str] = None

@dataclass
class OrderData:
    order_id: str
    total: float
    timestamp: datetime
    items: List[Dict[str, Any]]
    customer_email: str
    customer_phone: str

# Clean business logic - no vendor knowledge
class NotificationService:
    def __init__(self, 
                 document_storage: DocumentStorage,
                 email_service: EmailService,
                 sms_service: SMSService,
                 document_generator: DocumentGenerator):
        self.document_storage = document_storage
        self.email_service = email_service
        self.sms_service = sms_service
        self.document_generator = document_generator
        self.logger = logging.getLogger(__name__)

    async def send_order_confirmation(self, order_data: OrderData) -> NotificationResult:
        """Send order confirmation via email and SMS with receipt."""
        try:
            # Generate receipt document
            receipt = await self.document_generator.generate_receipt(order_data)
            
            # Store receipt
            storage_result = await self.document_storage.store_document(receipt)
            if not storage_result.success:
                self.logger.warning(f"Receipt storage failed: {storage_result.error_message}")
            
            # Get receipt URL for sharing
            receipt_url = None
            if storage_result.success:
                receipt_url = await self.document_storage.get_document_url(
                    storage_result.document_id, 
                    expires_in_hours=24
                )

            # Send email notification
            email = Email(
                to_address=order_data.customer_email,
                subject=f"Order Confirmation - {order_data.order_id}",
                html_content=self._create_order_email_content(order_data, receipt_url),
                attachments=[receipt] if receipt else None
            )
            
            email_result = await self.email_service.send_email(email)
            
            # Send SMS notification
            sms = SMSMessage(
                to_phone=order_data.customer_phone,
                content=self._create_order_sms_content(order_data, receipt_url)
            )
            
            sms_result = await self.sms_service.send_sms(sms)
            
            # Return consolidated result
            return NotificationResult(
                email_sent=email_result.success,
                sms_sent=sms_result.success,
                receipt_generated=storage_result.success,
                receipt_url=receipt_url,
                errors=self._collect_errors(email_result, sms_result, storage_result)
            )
            
        except Exception as e:
            self.logger.error(f"Order confirmation failed: {e}")
            return NotificationResult(
                email_sent=False,
                sms_sent=False,
                receipt_generated=False,
                errors=[f"Unexpected error: {str(e)}"]
            )

    async def send_shipping_update(self, order_id: str, tracking_number: str, 
                                 customer_email: str, customer_phone: str) -> NotificationResult:
        """Send shipping notification via email and SMS."""
        try:
            # Send email
            email = Email(
                to_address=customer_email,
                subject=f"Your order {order_id} has shipped!",
                html_content=self._create_shipping_email_content(order_id, tracking_number)
            )
            
            email_result = await self.email_service.send_email(email)
            
            # Send SMS
            sms = SMSMessage(
                to_phone=customer_phone,
                content=self._create_shipping_sms_content(order_id, tracking_number)
            )
            
            sms_result = await self.sms_service.send_sms(sms)
            
            return NotificationResult(
                email_sent=email_result.success,
                sms_sent=sms_result.success,
                errors=self._collect_errors(email_result, sms_result)
            )
            
        except Exception as e:
            self.logger.error(f"Shipping notification failed: {e}")
            return NotificationResult(
                email_sent=False,
                sms_sent=False,
                errors=[f"Unexpected error: {str(e)}"]
            )

    async def cleanup_old_receipts(self, retention_days: int = 90) -> int:
        """Clean up old receipt documents."""
        try:
            return await self.document_storage.cleanup_expired_documents(retention_days)
        except Exception as e:
            self.logger.error(f"Receipt cleanup failed: {e}")
            return 0

    # Private helper methods for content creation
    def _create_order_email_content(self, order_data: OrderData, receipt_url: Optional[str]) -> str:
        receipt_link = f'<p><a href="{receipt_url}">Download Receipt</a></p>' if receipt_url else ""
        return f"""
        <h1>Thank you for your order!</h1>
        <p>Order ID: {order_data.order_id}</p>
        <p>Total: ${order_data.total:.2f}</p>
        {receipt_link}
        """

    def _create_order_sms_content(self, order_data: OrderData, receipt_url: Optional[str]) -> str:
        receipt_text = f"\nReceipt: {receipt_url}" if receipt_url else ""
        return f"Order Confirmed! Order #{order_data.order_id}, Total: ${order_data.total:.2f}{receipt_text}"

    def _create_shipping_email_content(self, order_id: str, tracking_number: str) -> str:
        return f"""
        <h1>Your order is on its way!</h1>
        <p>Order ID: {order_id}</p>
        <p>Tracking Number: {tracking_number}</p>
        <p><a href="https://ups.com/track?tracknum={tracking_number}">Track Package</a></p>
        """

    def _create_shipping_sms_content(self, order_id: str, tracking_number: str) -> str:
        return f"Order {order_id} shipped! Track: https://ups.com/track?tracknum={tracking_number}"

    def _collect_errors(self, *results) -> List[str]:
        errors = []
        for result in results:
            if hasattr(result, 'error_message') and result.error_message:
                errors.append(result.error_message)
        return errors

# Result type for notifications
@dataclass
class NotificationResult:
    email_sent: bool
    sms_sent: bool
    receipt_generated: bool = False
    receipt_url: Optional[str] = None
    errors: List[str] = None

# Adapter implementations handle vendor-specific details
class S3DocumentStorageAdapter(DocumentStorage):
    def __init__(self, bucket_name: str, aws_client):
        self.bucket_name = bucket_name
        self.aws_client = aws_client
        self.logger = logging.getLogger(__name__)

    async def store_document(self, document: Document) -> StorageResult:
        try:
            document_id = f"receipts/{document.metadata.get('order_id', 'unknown')}_{datetime.now().isoformat()}.pdf"
            
            self.aws_client.put_object(
                Bucket=self.bucket_name,
                Key=document_id,
                Body=document.content,
                ContentType=document.content_type,
                ServerSideEncryption='AES256',
                Metadata=document.metadata
            )
            
            return StorageResult(document_id=document_id, success=True)
            
        except Exception as e:
            self.logger.error(f"S3 storage failed: {e}")
            return StorageResult(document_id="", success=False, error_message=str(e))

    async def get_document_url(self, document_id: str, expires_in_hours: int = 24) -> Optional[str]:
        try:
            return self.aws_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': document_id},
                ExpiresIn=expires_in_hours * 3600
            )
        except Exception as e:
            self.logger.error(f"URL generation failed: {e}")
            return None

    async def cleanup_expired_documents(self, retention_days: int) -> int:
        try:
            cutoff_date = datetime.now() - timedelta(days=retention_days)
            response = self.aws_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix='receipts/'
            )
            
            deleted_count = 0
            for obj in response.get('Contents', []):
                if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                    self.aws_client.delete_object(
                        Bucket=self.bucket_name,
                        Key=obj['Key']
                    )
                    deleted_count += 1
            
            return deleted_count
            
        except Exception as e:
            self.logger.error(f"Cleanup failed: {e}")
            return 0

class SendGridEmailAdapter(EmailService):
    def __init__(self, api_key: str, sendgrid_client):
        self.api_key = api_key
        self.sendgrid_client = sendgrid_client
        self.logger = logging.getLogger(__name__)

    async def send_email(self, email: Email) -> DeliveryResult:
        try:
            # Transform domain object to SendGrid format
            message = self._create_sendgrid_message(email)
            response = self.sendgrid_client.send(message)
            
            return DeliveryResult(
                success=200 <= response.status_code < 300,
                message_id=getattr(response, 'message_id', None)
            )
            
        except Exception as e:
            self.logger.error(f"SendGrid email failed: {e}")
            return DeliveryResult(success=False, error_message=str(e))

    def _create_sendgrid_message(self, email: Email):
        # SendGrid-specific message creation logic
        # This isolates vendor-specific code
        pass

class TwilioSMSAdapter(SMSService):
    def __init__(self, account_sid: str, auth_token: str, twilio_client):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.twilio_client = twilio_client
        self.logger = logging.getLogger(__name__)

    async def send_sms(self, message: SMSMessage) -> DeliveryResult:
        try:
            response = self.twilio_client.messages.create(
                body=message.content,
                from_=message.from_phone,
                to=message.to_phone
            )
            
            return DeliveryResult(
                success=True,
                message_id=response.sid
            )
            
        except Exception as e:
            self.logger.error(f"Twilio SMS failed: {e}")
            return DeliveryResult(success=False, error_message=str(e))

class PDFDocumentGenerator(DocumentGenerator):
    def __init__(self, pdf_library):
        self.pdf_library = pdf_library

    async def generate_receipt(self, order_data: OrderData) -> Document:
        # PDF generation logic isolated from business logic
        content = self._generate_pdf_content(order_data)
        
        return Document(
            content=content,
            filename=f"receipt_{order_data.order_id}.pdf",
            content_type="application/pdf",
            metadata={
                "order_id": order_data.order_id,
                "generated_at": datetime.now().isoformat(),
                "customer_email": order_data.customer_email
            }
        )

    def _generate_pdf_content(self, order_data: OrderData) -> bytes:
        # Vendor-specific PDF generation
        pass

# Dependency injection setup
def create_notification_service():
    # Configuration and dependency injection
    # All vendor-specific setup happens here
    
    # AWS setup
    aws_client = None  # boto3.client('s3', ...)
    document_storage = S3DocumentStorageAdapter("receipts-bucket", aws_client)
    
    # SendGrid setup
    sendgrid_client = None  # SendGridAPIClient(...)
    email_service = SendGridEmailAdapter("api-key", sendgrid_client)
    
    # Twilio setup
    twilio_client = None  # TwilioClient(...)
    sms_service = TwilioSMSAdapter("sid", "token", twilio_client)
    
    # PDF generation setup
    pdf_library = None  # reportlab or similar
    document_generator = PDFDocumentGenerator(pdf_library)
    
    return NotificationService(
        document_storage=document_storage,
        email_service=email_service,
        sms_service=sms_service,
        document_generator=document_generator
    )

"""
Benefits of this approach:
1. ✅ Business logic pure and vendor-independent
2. ✅ Easy to unit test with mocks
3. ✅ Can swap vendors without changing business logic
4. ✅ Consistent error handling across all services
5. ✅ Configuration isolated in adapters
6. ✅ Single responsibility maintained
7. ✅ Vendor API changes only affect adapters
8. ✅ Easy to add retry logic, circuit breakers
9. ✅ Clear interface contracts
10. ✅ Dependency injection enables flexibility
11. ✅ Consistent logging and monitoring
12. ✅ Performance optimizations isolated in adapters
"""
