# Exercise 3: Mocking and Test Doubles

Master the use of test doubles (mocks, stubs, fakes, spies) to isolate units under test and verify interactions with dependencies.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Understand different types of test doubles and when to use each
- Write effective mocks that verify behavior, not just state
- Create stubs that provide controlled responses to method calls
- Use fakes for more complex testing scenarios
- Apply spy patterns to verify method interactions
- Avoid common mocking pitfalls and anti-patterns

## 📝 Exercise Format

Each problem presents a testing scenario that requires isolating the unit under test from its dependencies. You'll practice using different types of test doubles appropriately.

---

## Problem 1: Email Service Behavior Verification

### System Under Test
```java
// OrderService that needs to send emails
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final EmailService emailService;
    private final AuditLogger auditLogger;
    
    public OrderService(OrderRepository orderRepository, 
                       PaymentService paymentService,
                       EmailService emailService,
                       AuditLogger auditLogger) {
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
        this.emailService = emailService;
        this.auditLogger = auditLogger;
    }
    
    public OrderResult processOrder(Order order) {
        // Validate order
        if (order.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain items");
        }
        
        // Save order
        Order savedOrder = orderRepository.save(order);
        
        // Process payment
        PaymentResult paymentResult = paymentService.processPayment(
            order.getCustomerPaymentInfo(), 
            order.getTotalAmount()
        );
        
        if (!paymentResult.isSuccessful()) {
            auditLogger.logFailedPayment(order.getId(), paymentResult.getErrorMessage());
            throw new PaymentFailedException("Payment failed: " + paymentResult.getErrorMessage());
        }
        
        // Update order status
        savedOrder.setStatus(OrderStatus.PAID);
        savedOrder.setPaymentId(paymentResult.getTransactionId());
        orderRepository.update(savedOrder);
        
        // Send confirmation email
        emailService.sendOrderConfirmation(
            order.getCustomerEmail(),
            savedOrder.getId(),
            order.getTotalAmount()
        );
        
        // Log successful order
        auditLogger.logSuccessfulOrder(savedOrder.getId(), order.getTotalAmount());
        
        return new OrderResult(true, savedOrder.getId(), "Order processed successfully");
    }
    
    public void cancelOrder(String orderId, String reason) {
        Order order = orderRepository.findById(orderId);
        
        if (order == null) {
            throw new OrderNotFoundException("Order not found: " + orderId);
        }
        
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Order already cancelled");
        }
        
        if (order.getStatus() == OrderStatus.SHIPPED) {
            throw new IllegalStateException("Cannot cancel shipped order");
        }
        
        // Process refund if payment was made
        if (order.getStatus() == OrderStatus.PAID) {
            RefundResult refundResult = paymentService.processRefund(
                order.getPaymentId(), 
                order.getTotalAmount()
            );
            
            if (!refundResult.isSuccessful()) {
                auditLogger.logFailedRefund(orderId, refundResult.getErrorMessage());
                throw new RefundFailedException("Refund failed: " + refundResult.getErrorMessage());
            }
        }
        
        // Update order status
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason);
        orderRepository.update(order);
        
        // Send cancellation email
        emailService.sendOrderCancellation(
            order.getCustomerEmail(),
            orderId,
            reason
        );
        
        // Log cancellation
        auditLogger.logOrderCancellation(orderId, reason);
    }
}
```

### Your Task
Write comprehensive tests using mocks to verify behavior and interactions.

### Testing Scenarios

#### Test 1: Successful Order Processing
```java
@Test
void processOrder_SuccessfulFlow_SendsConfirmationEmail() {
    // Given
    Order order = createValidOrder();
    Order savedOrder = createSavedOrder();
    PaymentResult successfulPayment = PaymentResult.success("txn123");
    
    // Setup mocks
    when(orderRepository.save(order)).thenReturn(savedOrder);
    when(paymentService.processPayment(any(), any())).thenReturn(successfulPayment);
    
    // When
    OrderResult result = orderService.processOrder(order);
    
    // Then - verify behavior
    verify(emailService).sendOrderConfirmation(
        order.getCustomerEmail(),
        savedOrder.getId(),
        order.getTotalAmount()
    );
    
    verify(auditLogger).logSuccessfulOrder(savedOrder.getId(), order.getTotalAmount());
    
    // Verify state
    assertThat(result.isSuccessful()).isTrue();
    assertThat(result.getOrderId()).isEqualTo(savedOrder.getId());
}
```

### Requirements
- [ ] **Mock all dependencies** - repository, payment service, email service, audit logger
- [ ] **Verify method calls** - ensure correct methods are called with correct parameters
- [ ] **Test error scenarios** - payment failures, validation errors
- [ ] **Verify interaction order** - some operations must happen in sequence
- [ ] **Test state changes** - verify order status updates
- [ ] **Avoid over-mocking** - don't verify implementation details

### Focus Areas
- Behavior verification vs. state verification
- Proper mock setup and verification
- Testing error handling with mocks
- Avoiding brittle tests

---

## Problem 2: External API Integration Testing

### System Under Test
```python
# Weather service that integrates with external APIs
import requests
from datetime import datetime, timedelta
from typing import Optional, List

class WeatherService:
    def __init__(self, weather_api_client, cache_service, alert_service, config):
        self.weather_api_client = weather_api_client
        self.cache_service = cache_service
        self.alert_service = alert_service
        self.config = config
    
    def get_current_weather(self, city: str) -> dict:
        # Check cache first
        cache_key = f"weather:{city}"
        cached_weather = self.cache_service.get(cache_key)
        
        if cached_weather:
            return cached_weather
        
        # Fetch from API
        try:
            weather_data = self.weather_api_client.get_current_weather(city)
            
            # Cache the result
            cache_ttl = self.config.get('cache_ttl', 300)  # 5 minutes default
            self.cache_service.set(cache_key, weather_data, cache_ttl)
            
            # Check for severe weather alerts
            if self._is_severe_weather(weather_data):
                self.alert_service.send_severe_weather_alert(city, weather_data)
            
            return weather_data
            
        except requests.RequestException as e:
            # Fall back to cached data if available, even if expired
            expired_data = self.cache_service.get_expired(cache_key)
            if expired_data:
                return expired_data
            
            raise WeatherServiceException(f"Unable to fetch weather for {city}: {str(e)}")
    
    def get_weather_forecast(self, city: str, days: int = 7) -> List[dict]:
        if days > 14:
            raise ValueError("Forecast cannot exceed 14 days")
        
        cache_key = f"forecast:{city}:{days}"
        cached_forecast = self.cache_service.get(cache_key)
        
        if cached_forecast:
            return cached_forecast
        
        try:
            forecast_data = self.weather_api_client.get_forecast(city, days)
            
            # Cache forecast for longer period
            cache_ttl = self.config.get('forecast_cache_ttl', 1800)  # 30 minutes
            self.cache_service.set(cache_key, forecast_data, cache_ttl)
            
            # Check for upcoming severe weather
            severe_days = []
            for day_data in forecast_data:
                if self._is_severe_weather(day_data):
                    severe_days.append(day_data['date'])
            
            if severe_days:
                self.alert_service.send_forecast_alert(city, severe_days)
            
            return forecast_data
            
        except requests.RequestException as e:
            raise WeatherServiceException(f"Unable to fetch forecast for {city}: {str(e)}")
    
    def update_weather_alerts(self, cities: List[str]) -> dict:
        results = {
            'updated': [],
            'failed': [],
            'alerts_sent': 0
        }
        
        for city in cities:
            try:
                weather = self.get_current_weather(city)
                results['updated'].append(city)
                
                if self._is_severe_weather(weather):
                    results['alerts_sent'] += 1
                    
            except WeatherServiceException:
                results['failed'].append(city)
        
        # Send summary report if configured
        if self.config.get('send_summary_reports', False):
            self.alert_service.send_update_summary(results)
        
        return results
    
    def _is_severe_weather(self, weather_data: dict) -> bool:
        conditions = weather_data.get('conditions', {})
        wind_speed = conditions.get('wind_speed', 0)
        temperature = conditions.get('temperature', 0)
        alerts = weather_data.get('alerts', [])
        
        # Define severe weather criteria
        is_high_wind = wind_speed > self.config.get('high_wind_threshold', 50)
        is_extreme_temp = (temperature > self.config.get('extreme_hot_threshold', 40) or 
                          temperature < self.config.get('extreme_cold_threshold', -20))
        has_alerts = len(alerts) > 0
        
        return is_high_wind or is_extreme_temp or has_alerts
```

### Your Task
Create comprehensive tests using stubs and mocks for external dependencies.

### Testing Scenarios

#### Test 1: Cache Hit Scenario
```python
def test_get_current_weather_returns_cached_data_when_available():
    # Given
    city = "London"
    cached_weather = {"temperature": 20, "conditions": "sunny"}
    
    # Stub cache to return data
    cache_service_stub = Mock()
    cache_service_stub.get.return_value = cached_weather
    
    weather_service = WeatherService(
        weather_api_client=Mock(),
        cache_service=cache_service_stub,
        alert_service=Mock(),
        config={}
    )
    
    # When
    result = weather_service.get_current_weather(city)
    
    # Then
    assert result == cached_weather
    
    # Verify cache was checked
    cache_service_stub.get.assert_called_once_with("weather:London")
    
    # Verify API was NOT called (since cache hit)
    weather_service.weather_api_client.get_current_weather.assert_not_called()
```

#### Test 2: API Call with Severe Weather Alert
```python
def test_get_current_weather_sends_alert_for_severe_weather():
    # Given
    city = "Miami"
    severe_weather_data = {
        "temperature": 15,
        "conditions": {"wind_speed": 60, "temperature": 15},
        "alerts": ["Hurricane Warning"]
    }
    
    # Setup mocks and stubs
    cache_service_mock = Mock()
    cache_service_mock.get.return_value = None  # Cache miss
    
    api_client_stub = Mock()
    api_client_stub.get_current_weather.return_value = severe_weather_data
    
    alert_service_mock = Mock()
    
    config = {"high_wind_threshold": 50, "cache_ttl": 300}
    
    weather_service = WeatherService(
        weather_api_client=api_client_stub,
        cache_service=cache_service_mock,
        alert_service=alert_service_mock,
        config=config
    )
    
    # When
    result = weather_service.get_current_weather(city)
    
    # Then
    assert result == severe_weather_data
    
    # Verify API was called
    api_client_stub.get_current_weather.assert_called_once_with(city)
    
    # Verify data was cached
    cache_service_mock.set.assert_called_once_with(
        "weather:Miami", severe_weather_data, 300
    )
    
    # Verify severe weather alert was sent
    alert_service_mock.send_severe_weather_alert.assert_called_once_with(
        city, severe_weather_data
    )
```

### Requirements
- [ ] **Use stubs for data** - provide controlled responses from dependencies
- [ ] **Use mocks for verification** - verify correct method calls
- [ ] **Test cache behavior** - cache hits, misses, and TTL
- [ ] **Test error handling** - API failures, network issues
- [ ] **Test alert conditions** - when alerts should and shouldn't be sent
- [ ] **Avoid implementation coupling** - test behavior, not implementation

### Focus Areas
- Stub vs. mock usage patterns
- Testing caching behavior
- External service failure handling
- Conditional behavior testing

---

## Problem 3: Complex Workflow Testing

### System Under Test
```csharp
// Document processing workflow with multiple dependencies
public class DocumentProcessor
{
    private readonly IDocumentRepository documentRepository;
    private readonly IVirusScanner virusScanner;
    private readonly ITextExtractor textExtractor;
    private readonly IContentAnalyzer contentAnalyzer;
    private readonly INotificationService notificationService;
    private readonly IStorageService storageService;
    private readonly IWorkflowLogger logger;
    
    public DocumentProcessor(
        IDocumentRepository documentRepository,
        IVirusScanner virusScanner,
        ITextExtractor textExtractor,
        IContentAnalyzer contentAnalyzer,
        INotificationService notificationService,
        IStorageService storageService,
        IWorkflowLogger logger)
    {
        this.documentRepository = documentRepository;
        this.virusScanner = virusScanner;
        this.textExtractor = textExtractor;
        this.contentAnalyzer = contentAnalyzer;
        this.notificationService = notificationService;
        this.storageService = storageService;
        this.logger = logger;
    }
    
    public async Task<ProcessingResult> ProcessDocumentAsync(string documentId)
    {
        var document = await documentRepository.GetByIdAsync(documentId);
        if (document == null)
        {
            throw new DocumentNotFoundException($"Document {documentId} not found");
        }
        
        logger.LogProcessingStarted(documentId);
        
        try
        {
            // Step 1: Virus scan
            var scanResult = await virusScanner.ScanDocumentAsync(document.FilePath);
            if (!scanResult.IsSafe)
            {
                document.Status = DocumentStatus.Quarantined;
                document.StatusReason = $"Virus detected: {scanResult.ThreatName}";
                await documentRepository.UpdateAsync(document);
                
                await notificationService.SendSecurityAlertAsync(
                    document.OwnerId, 
                    $"Document {documentId} quarantined due to security threat"
                );
                
                logger.LogVirusDetected(documentId, scanResult.ThreatName);
                return ProcessingResult.Failed("Document quarantined due to security threat");
            }
            
            // Step 2: Extract text content
            var extractionResult = await textExtractor.ExtractTextAsync(document.FilePath);
            if (!extractionResult.IsSuccessful)
            {
                document.Status = DocumentStatus.Failed;
                document.StatusReason = "Text extraction failed";
                await documentRepository.UpdateAsync(document);
                
                logger.LogExtractionFailed(documentId, extractionResult.ErrorMessage);
                return ProcessingResult.Failed("Text extraction failed");
            }
            
            // Step 3: Content analysis
            var analysisResult = await contentAnalyzer.AnalyzeContentAsync(extractionResult.Text);
            
            // Update document with analysis results
            document.ContentType = analysisResult.ContentType;
            document.Language = analysisResult.Language;
            document.KeyTopics = analysisResult.Topics;
            document.SentimentScore = analysisResult.SentimentScore;
            document.ExtractedText = extractionResult.Text;
            
            // Step 4: Store processed content
            var storageKey = await storageService.StoreProcessedContentAsync(
                documentId, 
                extractionResult.Text, 
                analysisResult
            );
            
            document.ProcessedContentKey = storageKey;
            document.Status = DocumentStatus.Processed;
            document.ProcessedAt = DateTime.UtcNow;
            
            await documentRepository.UpdateAsync(document);
            
            // Step 5: Send completion notification
            await notificationService.SendProcessingCompleteAsync(
                document.OwnerId,
                documentId,
                analysisResult.ContentType
            );
            
            logger.LogProcessingCompleted(documentId);
            
            return ProcessingResult.Success(documentId, analysisResult);
        }
        catch (Exception ex)
        {
            document.Status = DocumentStatus.Failed;
            document.StatusReason = ex.Message;
            await documentRepository.UpdateAsync(document);
            
            logger.LogProcessingError(documentId, ex);
            throw;
        }
    }
}
```

### Your Task
Create tests that verify the complex workflow using appropriate test doubles.

### Testing Scenarios

#### Test 1: Successful Complete Workflow
```csharp
[Test]
public async Task ProcessDocumentAsync_SuccessfulWorkflow_CompletesAllSteps()
{
    // Arrange
    var documentId = "doc123";
    var document = CreateTestDocument(documentId);
    var scanResult = ScanResult.Safe();
    var extractionResult = ExtractionResult.Success("Extracted text content");
    var analysisResult = new AnalysisResult
    {
        ContentType = "legal_document",
        Language = "en",
        Topics = new[] { "contract", "legal" },
        SentimentScore = 0.2
    };
    var storageKey = "storage/processed/doc123";
    
    // Setup mocks and stubs
    documentRepository.Setup(r => r.GetByIdAsync(documentId))
                    .ReturnsAsync(document);
    
    virusScanner.Setup(s => s.ScanDocumentAsync(document.FilePath))
              .ReturnsAsync(scanResult);
    
    textExtractor.Setup(e => e.ExtractTextAsync(document.FilePath))
               .ReturnsAsync(extractionResult);
    
    contentAnalyzer.Setup(a => a.AnalyzeContentAsync(extractionResult.Text))
                  .ReturnsAsync(analysisResult);
    
    storageService.Setup(s => s.StoreProcessedContentAsync(documentId, extractionResult.Text, analysisResult))
                 .ReturnsAsync(storageKey);
    
    // Act
    var result = await documentProcessor.ProcessDocumentAsync(documentId);
    
    // Assert
    Assert.That(result.IsSuccessful, Is.True);
    Assert.That(result.DocumentId, Is.EqualTo(documentId));
    
    // Verify workflow steps executed in order
    Received.InOrder(() =>
    {
        virusScanner.ScanDocumentAsync(document.FilePath);
        textExtractor.ExtractTextAsync(document.FilePath);
        contentAnalyzer.AnalyzeContentAsync(extractionResult.Text);
        storageService.StoreProcessedContentAsync(documentId, extractionResult.Text, analysisResult);
    });
    
    // Verify document was updated correctly
    documentRepository.Verify(r => r.UpdateAsync(It.Is<Document>(d => 
        d.Status == DocumentStatus.Processed &&
        d.ContentType == analysisResult.ContentType &&
        d.ProcessedContentKey == storageKey
    )), Times.Once);
    
    // Verify notification was sent
    notificationService.Verify(n => n.SendProcessingCompleteAsync(
        document.OwnerId,
        documentId,
        analysisResult.ContentType
    ), Times.Once);
    
    // Verify logging
    logger.Verify(l => l.LogProcessingStarted(documentId), Times.Once);
    logger.Verify(l => l.LogProcessingCompleted(documentId), Times.Once);
}
```

#### Test 2: Virus Detection Scenario
```csharp
[Test]
public async Task ProcessDocumentAsync_VirusDetected_QuarantinesDocument()
{
    // Arrange
    var documentId = "infected_doc";
    var document = CreateTestDocument(documentId);
    var scanResult = ScanResult.ThreatDetected("Trojan.Generic");
    
    documentRepository.Setup(r => r.GetByIdAsync(documentId))
                    .ReturnsAsync(document);
    
    virusScanner.Setup(s => s.ScanDocumentAsync(document.FilePath))
              .ReturnsAsync(scanResult);
    
    // Act
    var result = await documentProcessor.ProcessDocumentAsync(documentId);
    
    // Assert
    Assert.That(result.IsSuccessful, Is.False);
    Assert.That(result.ErrorMessage, Contains.Substring("quarantined"));
    
    // Verify document was quarantined
    documentRepository.Verify(r => r.UpdateAsync(It.Is<Document>(d => 
        d.Status == DocumentStatus.Quarantined &&
        d.StatusReason.Contains("Trojan.Generic")
    )), Times.Once);
    
    // Verify security alert was sent
    notificationService.Verify(n => n.SendSecurityAlertAsync(
        document.OwnerId,
        It.Is<string>(msg => msg.Contains("quarantined"))
    ), Times.Once);
    
    // Verify subsequent steps were NOT executed
    textExtractor.Verify(e => e.ExtractTextAsync(It.IsAny<string>()), Times.Never);
    contentAnalyzer.Verify(a => a.AnalyzeContentAsync(It.IsAny<string>()), Times.Never);
    storageService.Verify(s => s.StoreProcessedContentAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<AnalysisResult>()), Times.Never);
}
```

### Requirements
- [ ] **Test complete workflow** - verify all steps execute in order
- [ ] **Test early exit scenarios** - virus detection, extraction failure
- [ ] **Verify state changes** - document status updates at each step
- [ ] **Test exception handling** - verify cleanup and error states
- [ ] **Use interaction verification** - ensure services called correctly
- [ ] **Test notification scenarios** - success and failure notifications

### Focus Areas
- Workflow orchestration testing
- State management verification
- Exception handling in workflows
- Service interaction patterns

---

## Problem 4: Spy Pattern for Method Monitoring

### System Under Test
```javascript
// Analytics service that tracks user behavior
class UserAnalyticsService {
    constructor(eventStore, metricsCollector, segmentationService, notificationService) {
        this.eventStore = eventStore;
        this.metricsCollector = metricsCollector;
        this.segmentationService = segmentationService;
        this.notificationService = notificationService;
        this.sessionData = new Map();
    }
    
    async trackUserAction(userId, action, metadata = {}) {
        const timestamp = Date.now();
        const sessionId = this.getOrCreateSession(userId);
        
        const event = {
            userId,
            sessionId,
            action,
            metadata,
            timestamp
        };
        
        // Store the event
        await this.eventStore.saveEvent(event);
        
        // Update metrics
        this.metricsCollector.incrementCounter(`user_action.${action}`);
        this.metricsCollector.recordTiming(`user_action.${action}.timing`, Date.now() - timestamp);
        
        // Update user segmentation data
        const segmentUpdate = await this.segmentationService.updateUserSegment(userId, action, metadata);
        
        // Check for milestone achievements
        if (this.isMilestoneAction(action)) {
            const milestones = await this.checkUserMilestones(userId);
            
            for (const milestone of milestones) {
                this.metricsCollector.incrementCounter(`milestone.${milestone.type}`);
                
                // Send achievement notification
                await this.notificationService.sendAchievementNotification(
                    userId, 
                    milestone.type, 
                    milestone.level
                );
            }
        }
        
        // Update session activity
        this.updateSessionActivity(sessionId, action);
        
        return event;
    }
    
    async generateUserReport(userId, timeRange) {
        const events = await this.eventStore.getEventsForUser(userId, timeRange);
        
        if (events.length === 0) {
            return { userId, message: "No activity in specified time range" };
        }
        
        // Analyze user behavior patterns
        const behaviorAnalysis = this.analyzeBehaviorPatterns(events);
        
        // Get current user segment
        const userSegment = await this.segmentationService.getUserSegment(userId);
        
        // Generate recommendations
        const recommendations = this.generateRecommendations(behaviorAnalysis, userSegment);
        
        // Record metrics for report generation
        this.metricsCollector.incrementCounter('report.generated');
        this.metricsCollector.recordValue('report.events_analyzed', events.length);
        
        const report = {
            userId,
            timeRange,
            totalEvents: events.length,
            behaviorAnalysis,
            userSegment,
            recommendations,
            generatedAt: new Date().toISOString()
        };
        
        // Store report for future reference
        await this.eventStore.saveReport(userId, report);
        
        return report;
    }
    
    getOrCreateSession(userId) {
        const existingSession = this.sessionData.get(userId);
        
        if (existingSession && this.isSessionActive(existingSession)) {
            return existingSession.sessionId;
        }
        
        const newSessionId = `session_${userId}_${Date.now()}`;
        this.sessionData.set(userId, {
            sessionId: newSessionId,
            startTime: Date.now(),
            lastActivity: Date.now(),
            actionCount: 0
        });
        
        this.metricsCollector.incrementCounter('session.created');
        return newSessionId;
    }
    
    isSessionActive(session) {
        const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        return (Date.now() - session.lastActivity) < SESSION_TIMEOUT;
    }
    
    updateSessionActivity(sessionId, action) {
        for (const [userId, session] of this.sessionData.entries()) {
            if (session.sessionId === sessionId) {
                session.lastActivity = Date.now();
                session.actionCount++;
                
                // Track session metrics
                this.metricsCollector.recordValue('session.action_count', session.actionCount);
                break;
            }
        }
    }
    
    isMilestoneAction(action) {
        const milestoneActions = ['first_purchase', 'profile_complete', 'friend_invite', 'review_submitted'];
        return milestoneActions.includes(action);
    }
    
    async checkUserMilestones(userId) {
        // This would typically query a database for user achievements
        // Simplified for example
        const userStats = await this.eventStore.getUserStats(userId);
        const milestones = [];
        
        if (userStats.totalPurchases === 1) {
            milestones.push({ type: 'first_purchase', level: 1 });
        }
        
        if (userStats.totalPurchases === 10) {
            milestones.push({ type: 'loyal_customer', level: 1 });
        }
        
        return milestones;
    }
    
    analyzeBehaviorPatterns(events) {
        const actionCounts = {};
        const hourlyActivity = new Array(24).fill(0);
        
        events.forEach(event => {
            actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
            
            const hour = new Date(event.timestamp).getHours();
            hourlyActivity[hour]++;
        });
        
        return {
            actionCounts,
            hourlyActivity,
            mostActiveHour: hourlyActivity.indexOf(Math.max(...hourlyActivity)),
            primaryAction: Object.keys(actionCounts).reduce((a, b) => 
                actionCounts[a] > actionCounts[b] ? a : b
            )
        };
    }
    
    generateRecommendations(behaviorAnalysis, userSegment) {
        const recommendations = [];
        
        if (behaviorAnalysis.actionCounts.page_view > behaviorAnalysis.actionCounts.purchase * 10) {
            recommendations.push("Consider offering targeted promotions to convert browsing to purchases");
        }
        
        if (userSegment.engagementLevel === 'low') {
            recommendations.push("Send re-engagement email campaign");
        }
        
        return recommendations;
    }
}
```

### Your Task
Use spy patterns to monitor and verify method calls and their interactions.

### Testing with Spies

#### Test 1: Method Call Verification with Spies
```javascript
describe('UserAnalyticsService', () => {
    let service;
    let eventStore, metricsCollector, segmentationService, notificationService;
    
    beforeEach(() => {
        eventStore = {
            saveEvent: jest.fn(),
            getEventsForUser: jest.fn(),
            getUserStats: jest.fn(),
            saveReport: jest.fn()
        };
        
        metricsCollector = {
            incrementCounter: jest.fn(),
            recordTiming: jest.fn(),
            recordValue: jest.fn()
        };
        
        segmentationService = {
            updateUserSegment: jest.fn(),
            getUserSegment: jest.fn()
        };
        
        notificationService = {
            sendAchievementNotification: jest.fn()
        };
        
        service = new UserAnalyticsService(
            eventStore, 
            metricsCollector, 
            segmentationService, 
            notificationService
        );
    });
    
    test('trackUserAction calls all required services', async () => {
        // Given
        const userId = 'user123';
        const action = 'page_view';
        const metadata = { page: '/home' };
        
        segmentationService.updateUserSegment.mockResolvedValue({ segment: 'active' });
        
        // When
        await service.trackUserAction(userId, action, metadata);
        
        // Then - verify all services were called
        expect(eventStore.saveEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                userId,
                action,
                metadata
            })
        );
        
        expect(metricsCollector.incrementCounter).toHaveBeenCalledWith('user_action.page_view');
        expect(metricsCollector.recordTiming).toHaveBeenCalledWith(
            'user_action.page_view.timing',
            expect.any(Number)
        );
        
        expect(segmentationService.updateUserSegment).toHaveBeenCalledWith(userId, action, metadata);
    });
    
    test('trackUserAction sends milestone notifications for milestone actions', async () => {
        // Given
        const userId = 'user123';
        const action = 'first_purchase';
        
        segmentationService.updateUserSegment.mockResolvedValue({ segment: 'buyer' });
        eventStore.getUserStats.mockResolvedValue({ totalPurchases: 1 });
        
        // Spy on internal methods
        const checkMilestonesSpy = jest.spyOn(service, 'checkUserMilestones');
        const isMilestoneActionSpy = jest.spyOn(service, 'isMilestoneAction');
        
        // When
        await service.trackUserAction(userId, action);
        
        // Then - verify milestone checking flow
        expect(isMilestoneActionSpy).toHaveBeenCalledWith(action);
        expect(checkMilestonesSpy).toHaveBeenCalledWith(userId);
        
        expect(notificationService.sendAchievementNotification).toHaveBeenCalledWith(
            userId,
            'first_purchase',
            1
        );
        
        expect(metricsCollector.incrementCounter).toHaveBeenCalledWith('milestone.first_purchase');
        
        // Cleanup spies
        checkMilestonesSpy.mockRestore();
        isMilestoneActionSpy.mockRestore();
    });
});
```

### Requirements
- [ ] **Spy on internal methods** - verify internal method calls and their order
- [ ] **Mock external dependencies** - provide controlled responses
- [ ] **Verify interaction patterns** - ensure correct service orchestration
- [ ] **Test conditional flows** - milestone actions vs. regular actions
- [ ] **Monitor call counts** - verify methods called correct number of times
- [ ] **Verify call arguments** - ensure correct data passed between methods

### Focus Areas
- Spy vs. mock distinction
- Internal method monitoring
- Interaction verification patterns
- Test cleanup and isolation

---

## 🏆 Success Criteria

Demonstrate mastery of test doubles:

### Test Double Usage
- **Mocks for Behavior**: Use mocks to verify interactions and method calls
- **Stubs for Data**: Use stubs to provide controlled responses
- **Spies for Monitoring**: Use spies to monitor method calls and interactions
- **Fakes for Complex Logic**: Use fakes when stubs become too complex

### Testing Quality
- **Isolated Tests**: Each test focuses on the unit under test
- **Fast Execution**: Tests run quickly without external dependencies
- **Reliable Results**: Tests produce consistent results regardless of environment
- **Clear Intent**: Test names and structure clearly express what's being tested

### Avoiding Pitfalls
- **Don't Over-Mock**: Avoid verifying implementation details
- **Mock at Boundaries**: Mock external dependencies, not internal collaborators
- **Verify Behavior**: Focus on what the code does, not how it does it
- **Keep Tests Simple**: Complex test setups often indicate design problems

---

## 💡 Test Double Patterns

### **Mock vs. Stub Distinction**
```java
// ✅ Stub - provides data
UserRepository userRepositoryStub = mock(UserRepository.class);
when(userRepositoryStub.findById("123")).thenReturn(user);

// ✅ Mock - verifies behavior
EmailService emailServiceMock = mock(EmailService.class);
service.processOrder(order);
verify(emailServiceMock).sendConfirmation(order.getCustomerEmail());
```

### **Spy for Partial Mocking**
```javascript
// ✅ Spy on real object to monitor calls
const service = new UserService();
const spy = jest.spyOn(service, 'validateUser');

service.createUser(userData);

expect(spy).toHaveBeenCalledWith(userData);
spy.mockRestore();
```

### **Fake for Complex Logic**
```python
# ✅ Fake implementation for testing
class FakeEmailService:
    def __init__(self):
        self.sent_emails = []
    
    def send_email(self, to, subject, body):
        self.sent_emails.append({
            'to': to,
            'subject': subject,
            'body': body
        })
    
    def get_sent_emails(self):
        return self.sent_emails
```

---

## 🎯 Self-Assessment

After completing all mocking exercises:

### **Test Double Mastery (1-5 scale)**
- [ ] **Mock Usage**: Can effectively use mocks to verify behavior
- [ ] **Stub Creation**: Can create stubs that provide controlled data
- [ ] **Spy Application**: Can use spies to monitor method interactions
- [ ] **Fake Implementation**: Can create fakes for complex testing scenarios

### **Testing Design (1-5 scale)**
- [ ] **Isolation**: Tests are properly isolated from external dependencies
- [ ] **Clarity**: Test intent is clear and easy to understand
- [ ] **Reliability**: Tests produce consistent, predictable results
- [ ] **Maintainability**: Tests are easy to modify as code evolves

**Target**: All scores should be 4 or 5, representing mastery of test double techniques.

---

## 🚀 Next Steps

Once you've mastered mocking and test doubles:

1. **Apply to real projects** - Identify areas where test doubles can improve your test suite
2. **Practice different scenarios** - External APIs, databases, file systems, time dependencies
3. **Move to [Exercise 4: Testing Complex Logic](./exercise-4-complex-logic.md)** - Learn to test intricate business rules
4. **Explore advanced patterns** - Test containers, property-based testing, contract testing

Remember: Test doubles are tools for isolation, not goals in themselves. Use them to create fast, reliable, focused tests that verify the behavior of your units under test!
