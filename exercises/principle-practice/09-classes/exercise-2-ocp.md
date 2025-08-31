# Exercise 2: Open/Closed Principle (OCP)

Master the art of designing software that is open for extension but closed for modification by learning to create extensible architectures using abstraction and polymorphism.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Recognize violations of the Open/Closed Principle
- Apply the Strategy pattern to enable extension without modification
- Use polymorphism to create extensible designs
- Design plugin architectures that support new functionality
- Understand the relationship between OCP and maintainability
- Practice creating abstractions that enable extension

## 📝 Exercise Format

Each problem presents code that violates OCP by requiring modification to add new functionality. Your job is to refactor the code to be open for extension but closed for modification.

---

## Problem 1: Payment Processing System

### Current Code (Java)
```java
// ❌ Violates OCP - requires modification to add new payment methods
public class PaymentProcessor {
    
    public PaymentResult processPayment(PaymentRequest request) {
        PaymentMethod method = request.getPaymentMethod();
        
        switch (method) {
            case CREDIT_CARD:
                return processCreditCardPayment(request);
            
            case PAYPAL:
                return processPayPalPayment(request);
            
            case BANK_TRANSFER:
                return processBankTransferPayment(request);
            
            case BITCOIN:
                return processBitcoinPayment(request);
            
            default:
                throw new UnsupportedOperationException("Payment method not supported: " + method);
        }
    }
    
    private PaymentResult processCreditCardPayment(PaymentRequest request) {
        // Validate credit card details
        CreditCardInfo cardInfo = request.getCreditCardInfo();
        
        if (cardInfo.getNumber() == null || cardInfo.getNumber().length() < 13) {
            return PaymentResult.failure("Invalid card number");
        }
        
        if (cardInfo.getExpiryDate().before(new Date())) {
            return PaymentResult.failure("Card expired");
        }
        
        if (cardInfo.getCvv() == null || cardInfo.getCvv().length() != 3) {
            return PaymentResult.failure("Invalid CVV");
        }
        
        // Process through credit card gateway
        try {
            CreditCardGateway gateway = new CreditCardGateway();
            
            CreditCardTransaction transaction = new CreditCardTransaction();
            transaction.setCardNumber(cardInfo.getNumber());
            transaction.setExpiryDate(cardInfo.getExpiryDate());
            transaction.setCvv(cardInfo.getCvv());
            transaction.setAmount(request.getAmount());
            transaction.setCurrency(request.getCurrency());
            transaction.setMerchantId(request.getMerchantId());
            
            GatewayResponse response = gateway.charge(transaction);
            
            if (response.isSuccessful()) {
                return PaymentResult.success(response.getTransactionId(), response.getAuthCode());
            } else {
                return PaymentResult.failure(response.getErrorMessage());
            }
            
        } catch (GatewayException e) {
            return PaymentResult.failure("Credit card processing failed: " + e.getMessage());
        }
    }
    
    private PaymentResult processPayPalPayment(PaymentRequest request) {
        // Validate PayPal details
        PayPalInfo paypalInfo = request.getPayPalInfo();
        
        if (paypalInfo.getEmail() == null || !paypalInfo.getEmail().contains("@")) {
            return PaymentResult.failure("Invalid PayPal email");
        }
        
        if (paypalInfo.getAccessToken() == null || paypalInfo.getAccessToken().isEmpty()) {
            return PaymentResult.failure("PayPal access token required");
        }
        
        // Process through PayPal API
        try {
            PayPalAPI paypalAPI = new PayPalAPI();
            
            PayPalPayment payment = new PayPalPayment();
            payment.setAmount(request.getAmount());
            payment.setCurrency(request.getCurrency());
            payment.setPayerEmail(paypalInfo.getEmail());
            payment.setAccessToken(paypalInfo.getAccessToken());
            payment.setDescription(request.getDescription());
            
            PayPalResponse response = paypalAPI.createPayment(payment);
            
            if (response.getStatus().equals("COMPLETED")) {
                return PaymentResult.success(response.getPaymentId(), response.getApprovalUrl());
            } else {
                return PaymentResult.failure("PayPal payment failed: " + response.getErrorDescription());
            }
            
        } catch (PayPalException e) {
            return PaymentResult.failure("PayPal processing failed: " + e.getMessage());
        }
    }
    
    private PaymentResult processBankTransferPayment(PaymentRequest request) {
        // Validate bank transfer details
        BankTransferInfo bankInfo = request.getBankTransferInfo();
        
        if (bankInfo.getAccountNumber() == null || bankInfo.getAccountNumber().length() < 8) {
            return PaymentResult.failure("Invalid account number");
        }
        
        if (bankInfo.getRoutingNumber() == null || bankInfo.getRoutingNumber().length() != 9) {
            return PaymentResult.failure("Invalid routing number");
        }
        
        if (bankInfo.getAccountHolderName() == null || bankInfo.getAccountHolderName().trim().isEmpty()) {
            return PaymentResult.failure("Account holder name required");
        }
        
        // Process through ACH network
        try {
            ACHProcessor achProcessor = new ACHProcessor();
            
            ACHTransaction transaction = new ACHTransaction();
            transaction.setAccountNumber(bankInfo.getAccountNumber());
            transaction.setRoutingNumber(bankInfo.getRoutingNumber());
            transaction.setAccountHolderName(bankInfo.getAccountHolderName());
            transaction.setAmount(request.getAmount());
            transaction.setTransactionType("DEBIT");
            transaction.setDescription(request.getDescription());
            
            ACHResponse response = achProcessor.processTransaction(transaction);
            
            if (response.isApproved()) {
                return PaymentResult.success(response.getTransactionId(), response.getTraceNumber());
            } else {
                return PaymentResult.failure("Bank transfer failed: " + response.getReasonCode());
            }
            
        } catch (ACHException e) {
            return PaymentResult.failure("Bank transfer processing failed: " + e.getMessage());
        }
    }
    
    private PaymentResult processBitcoinPayment(PaymentRequest request) {
        // Validate Bitcoin details
        BitcoinInfo bitcoinInfo = request.getBitcoinInfo();
        
        if (bitcoinInfo.getWalletAddress() == null || bitcoinInfo.getWalletAddress().length() < 26) {
            return PaymentResult.failure("Invalid Bitcoin wallet address");
        }
        
        if (bitcoinInfo.getPrivateKey() == null || bitcoinInfo.getPrivateKey().isEmpty()) {
            return PaymentResult.failure("Bitcoin private key required");
        }
        
        // Process through Bitcoin network
        try {
            BitcoinWallet wallet = new BitcoinWallet();
            
            BitcoinTransaction transaction = new BitcoinTransaction();
            transaction.setFromAddress(bitcoinInfo.getWalletAddress());
            transaction.setToAddress(request.getMerchantBitcoinAddress());
            transaction.setAmount(convertToBitcoin(request.getAmount(), request.getCurrency()));
            transaction.setPrivateKey(bitcoinInfo.getPrivateKey());
            transaction.setFee(calculateBitcoinFee(request.getAmount()));
            
            BitcoinResponse response = wallet.sendTransaction(transaction);
            
            if (response.isConfirmed()) {
                return PaymentResult.success(response.getTransactionHash(), response.getBlockHash());
            } else {
                return PaymentResult.failure("Bitcoin transaction failed: " + response.getErrorMessage());
            }
            
        } catch (BitcoinException e) {
            return PaymentResult.failure("Bitcoin processing failed: " + e.getMessage());
        }
    }
    
    // Helper methods
    private double convertToBitcoin(double amount, String currency) {
        // Simplified conversion - in real implementation would call exchange rate API
        if ("USD".equals(currency)) {
            return amount / 45000.0; // Assuming 1 BTC = $45,000
        }
        throw new UnsupportedOperationException("Currency conversion not supported: " + currency);
    }
    
    private double calculateBitcoinFee(double amount) {
        // Simplified fee calculation
        return Math.max(0.0001, amount * 0.001); // 0.1% fee, minimum 0.0001 BTC
    }
    
    // Validation methods
    public boolean isPaymentMethodSupported(PaymentMethod method) {
        switch (method) {
            case CREDIT_CARD:
            case PAYPAL:
            case BANK_TRANSFER:
            case BITCOIN:
                return true;
            default:
                return false;
        }
    }
    
    public List<PaymentMethod> getSupportedPaymentMethods() {
        return Arrays.asList(
            PaymentMethod.CREDIT_CARD,
            PaymentMethod.PAYPAL,
            PaymentMethod.BANK_TRANSFER,
            PaymentMethod.BITCOIN
        );
    }
}

// Supporting classes
enum PaymentMethod {
    CREDIT_CARD,
    PAYPAL,
    BANK_TRANSFER,
    BITCOIN
    // Adding new payment methods requires modifying this enum
    // and adding new cases to the switch statement above
}

class PaymentRequest {
    private PaymentMethod paymentMethod;
    private double amount;
    private String currency;
    private String merchantId;
    private String description;
    private CreditCardInfo creditCardInfo;
    private PayPalInfo payPalInfo;
    private BankTransferInfo bankTransferInfo;
    private BitcoinInfo bitcoinInfo;
    private String merchantBitcoinAddress;
    
    // Getters and setters...
}

class PaymentResult {
    private boolean successful;
    private String transactionId;
    private String authCode;
    private String errorMessage;
    
    public static PaymentResult success(String transactionId, String authCode) {
        PaymentResult result = new PaymentResult();
        result.successful = true;
        result.transactionId = transactionId;
        result.authCode = authCode;
        return result;
    }
    
    public static PaymentResult failure(String errorMessage) {
        PaymentResult result = new PaymentResult();
        result.successful = false;
        result.errorMessage = errorMessage;
        return result;
    }
    
    // Getters...
}

// Payment info classes
class CreditCardInfo {
    private String number;
    private Date expiryDate;
    private String cvv;
    private String holderName;
    // Getters and setters...
}

class PayPalInfo {
    private String email;
    private String accessToken;
    // Getters and setters...
}

class BankTransferInfo {
    private String accountNumber;
    private String routingNumber;
    private String accountHolderName;
    // Getters and setters...
}

class BitcoinInfo {
    private String walletAddress;
    private String privateKey;
    // Getters and setters...
}
```

### Your Task
Refactor this payment processor to follow the Open/Closed Principle.

### Requirements
- [ ] **Create payment strategy interface** - abstract payment processing
- [ ] **Implement strategy classes** - one for each payment method
- [ ] **Remove switch statements** - use polymorphism instead
- [ ] **Enable easy extension** - new payment methods shouldn't require modifying existing code
- [ ] **Maintain all functionality** - all payment methods should work exactly the same
- [ ] **Create factory pattern** - for creating payment strategies
- [ ] **Add validation interface** - each strategy validates its own requirements

### Refactoring Strategy
1. **Define Payment Strategy Interface**: Create abstraction for payment processing
2. **Extract Strategy Classes**: Move each payment method to its own class
3. **Create Strategy Factory**: Centralize strategy creation
4. **Refactor Main Processor**: Use strategies instead of switch statements
5. **Test Extension**: Add a new payment method without modifying existing code

### Focus Areas
- Strategy pattern implementation
- Interface design for extensibility
- Factory pattern for object creation
- Polymorphism over conditionals

---

## Problem 2: Discount Calculation System

### Current Code (Python)
```python
# ❌ Violates OCP - requires modification to add new discount types
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict

class DiscountType(Enum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    BUY_ONE_GET_ONE = "buy_one_get_one"
    BULK_DISCOUNT = "bulk_discount"
    SEASONAL = "seasonal"
    LOYALTY_TIER = "loyalty_tier"
    FIRST_TIME_BUYER = "first_time_buyer"

class DiscountCalculator:
    
    def __init__(self):
        self.seasonal_discounts = {
            "BLACK_FRIDAY": {"start": "11-25", "end": "11-27", "rate": 0.30},
            "CHRISTMAS": {"start": "12-20", "end": "12-25", "rate": 0.25},
            "NEW_YEAR": {"start": "12-31", "end": "01-02", "rate": 0.20},
            "SUMMER_SALE": {"start": "06-01", "end": "08-31", "rate": 0.15}
        }
        
        self.loyalty_tiers = {
            "BRONZE": {"min_purchases": 5, "discount_rate": 0.05},
            "SILVER": {"min_purchases": 15, "discount_rate": 0.10},
            "GOLD": {"min_purchases": 30, "discount_rate": 0.15},
            "PLATINUM": {"min_purchases": 50, "discount_rate": 0.20}
        }
    
    def calculate_discount(self, discount_type: DiscountType, order_data: dict, customer_data: dict = None) -> dict:
        """Calculate discount based on type and return discount details"""
        
        if discount_type == DiscountType.PERCENTAGE:
            return self._calculate_percentage_discount(order_data)
        
        elif discount_type == DiscountType.FIXED_AMOUNT:
            return self._calculate_fixed_amount_discount(order_data)
        
        elif discount_type == DiscountType.BUY_ONE_GET_ONE:
            return self._calculate_bogo_discount(order_data)
        
        elif discount_type == DiscountType.BULK_DISCOUNT:
            return self._calculate_bulk_discount(order_data)
        
        elif discount_type == DiscountType.SEASONAL:
            return self._calculate_seasonal_discount(order_data)
        
        elif discount_type == DiscountType.LOYALTY_TIER:
            if customer_data is None:
                return {"discount_amount": 0, "error": "Customer data required for loyalty discount"}
            return self._calculate_loyalty_discount(order_data, customer_data)
        
        elif discount_type == DiscountType.FIRST_TIME_BUYER:
            if customer_data is None:
                return {"discount_amount": 0, "error": "Customer data required for first-time buyer discount"}
            return self._calculate_first_time_buyer_discount(order_data, customer_data)
        
        else:
            return {"discount_amount": 0, "error": f"Unsupported discount type: {discount_type}"}
    
    def _calculate_percentage_discount(self, order_data: dict) -> dict:
        """Calculate percentage-based discount"""
        discount_rate = order_data.get("discount_rate", 0)
        total_amount = order_data.get("total_amount", 0)
        min_amount = order_data.get("min_amount", 0)
        
        if total_amount < min_amount:
            return {
                "discount_amount": 0,
                "applied": False,
                "reason": f"Order amount ${total_amount} below minimum ${min_amount}"
            }
        
        discount_amount = total_amount * discount_rate
        max_discount = order_data.get("max_discount", float('inf'))
        discount_amount = min(discount_amount, max_discount)
        
        return {
            "discount_amount": discount_amount,
            "applied": True,
            "discount_rate": discount_rate,
            "type": "percentage"
        }
    
    def _calculate_fixed_amount_discount(self, order_data: dict) -> dict:
        """Calculate fixed amount discount"""
        discount_amount = order_data.get("discount_amount", 0)
        total_amount = order_data.get("total_amount", 0)
        min_amount = order_data.get("min_amount", 0)
        
        if total_amount < min_amount:
            return {
                "discount_amount": 0,
                "applied": False,
                "reason": f"Order amount ${total_amount} below minimum ${min_amount}"
            }
        
        # Discount cannot exceed total amount
        actual_discount = min(discount_amount, total_amount)
        
        return {
            "discount_amount": actual_discount,
            "applied": True,
            "type": "fixed_amount"
        }
    
    def _calculate_bogo_discount(self, order_data: dict) -> dict:
        """Calculate Buy One Get One discount"""
        items = order_data.get("items", [])
        eligible_category = order_data.get("eligible_category")
        
        eligible_items = []
        for item in items:
            if eligible_category is None or item.get("category") == eligible_category:
                eligible_items.append(item)
        
        if len(eligible_items) < 2:
            return {
                "discount_amount": 0,
                "applied": False,
                "reason": "Need at least 2 eligible items for BOGO discount"
            }
        
        # Sort by price (ascending) to give away cheapest items
        eligible_items.sort(key=lambda x: x.get("price", 0))
        
        discount_amount = 0
        free_items = []
        
        # For every 2 items, the cheaper one is free
        for i in range(0, len(eligible_items) - 1, 2):
            cheaper_item = eligible_items[i]
            quantity = min(cheaper_item.get("quantity", 1), eligible_items[i + 1].get("quantity", 1))
            
            item_discount = cheaper_item.get("price", 0) * quantity
            discount_amount += item_discount
            
            free_items.append({
                "item_id": cheaper_item.get("id"),
                "quantity": quantity,
                "unit_price": cheaper_item.get("price", 0)
            })
        
        return {
            "discount_amount": discount_amount,
            "applied": True,
            "type": "buy_one_get_one",
            "free_items": free_items
        }
    
    def _calculate_bulk_discount(self, order_data: dict) -> dict:
        """Calculate bulk quantity discount"""
        items = order_data.get("items", [])
        bulk_tiers = order_data.get("bulk_tiers", [])
        
        if not bulk_tiers:
            return {"discount_amount": 0, "applied": False, "reason": "No bulk tiers defined"}
        
        total_discount = 0
        applied_discounts = []
        
        for item in items:
            quantity = item.get("quantity", 0)
            price = item.get("price", 0)
            item_total = quantity * price
            
            # Find applicable bulk tier
            applicable_tier = None
            for tier in sorted(bulk_tiers, key=lambda x: x["min_quantity"], reverse=True):
                if quantity >= tier["min_quantity"]:
                    applicable_tier = tier
                    break
            
            if applicable_tier:
                tier_discount_rate = applicable_tier["discount_rate"]
                item_discount = item_total * tier_discount_rate
                total_discount += item_discount
                
                applied_discounts.append({
                    "item_id": item.get("id"),
                    "quantity": quantity,
                    "tier": applicable_tier,
                    "discount_amount": item_discount
                })
        
        return {
            "discount_amount": total_discount,
            "applied": total_discount > 0,
            "type": "bulk_discount",
            "applied_discounts": applied_discounts
        }
    
    def _calculate_seasonal_discount(self, order_data: dict) -> dict:
        """Calculate seasonal discount"""
        current_date = datetime.now()
        current_year = current_date.year
        
        # Check which seasonal discount is currently active
        for season_name, season_data in self.seasonal_discounts.items():
            start_date_str = season_data["start"]
            end_date_str = season_data["end"]
            
            # Handle year-end to year-start periods (like New Year)
            if start_date_str > end_date_str:
                start_date = datetime.strptime(f"{current_year}-{start_date_str}", "%Y-%m-%d")
                end_date = datetime.strptime(f"{current_year + 1}-{end_date_str}", "%Y-%m-%d")
            else:
                start_date = datetime.strptime(f"{current_year}-{start_date_str}", "%Y-%m-%d")
                end_date = datetime.strptime(f"{current_year}-{end_date_str}", "%Y-%m-%d")
            
            if start_date <= current_date <= end_date:
                total_amount = order_data.get("total_amount", 0)
                discount_rate = season_data["rate"]
                discount_amount = total_amount * discount_rate
                
                return {
                    "discount_amount": discount_amount,
                    "applied": True,
                    "type": "seasonal",
                    "season": season_name,
                    "discount_rate": discount_rate
                }
        
        return {
            "discount_amount": 0,
            "applied": False,
            "reason": "No seasonal discount currently active"
        }
    
    def _calculate_loyalty_discount(self, order_data: dict, customer_data: dict) -> dict:
        """Calculate loyalty tier discount"""
        customer_purchases = customer_data.get("total_purchases", 0)
        
        # Determine loyalty tier
        customer_tier = None
        for tier_name, tier_data in sorted(self.loyalty_tiers.items(), 
                                         key=lambda x: x[1]["min_purchases"], reverse=True):
            if customer_purchases >= tier_data["min_purchases"]:
                customer_tier = tier_name
                tier_info = tier_data
                break
        
        if customer_tier is None:
            return {
                "discount_amount": 0,
                "applied": False,
                "reason": f"Customer has {customer_purchases} purchases, minimum 5 required"
            }
        
        total_amount = order_data.get("total_amount", 0)
        discount_rate = tier_info["discount_rate"]
        discount_amount = total_amount * discount_rate
        
        return {
            "discount_amount": discount_amount,
            "applied": True,
            "type": "loyalty_tier",
            "tier": customer_tier,
            "discount_rate": discount_rate
        }
    
    def _calculate_first_time_buyer_discount(self, order_data: dict, customer_data: dict) -> dict:
        """Calculate first-time buyer discount"""
        is_first_time = customer_data.get("is_first_time_buyer", False)
        previous_orders = customer_data.get("order_count", 0)
        
        if not is_first_time or previous_orders > 0:
            return {
                "discount_amount": 0,
                "applied": False,
                "reason": "Customer is not a first-time buyer"
            }
        
        total_amount = order_data.get("total_amount", 0)
        min_amount = order_data.get("first_time_min_amount", 50)
        
        if total_amount < min_amount:
            return {
                "discount_amount": 0,
                "applied": False,
                "reason": f"Order amount ${total_amount} below first-time buyer minimum ${min_amount}"
            }
        
        discount_amount = order_data.get("first_time_discount_amount", 10)
        max_discount = order_data.get("first_time_max_discount", 25)
        
        actual_discount = min(discount_amount, max_discount, total_amount)
        
        return {
            "discount_amount": actual_discount,
            "applied": True,
            "type": "first_time_buyer"
        }
    
    def get_applicable_discounts(self, order_data: dict, customer_data: dict = None) -> List[dict]:
        """Get all applicable discounts for an order"""
        applicable_discounts = []
        
        for discount_type in DiscountType:
            try:
                result = self.calculate_discount(discount_type, order_data, customer_data)
                if result.get("applied", False) and result.get("discount_amount", 0) > 0:
                    applicable_discounts.append({
                        "type": discount_type.value,
                        "discount": result
                    })
            except Exception as e:
                # Log error but continue checking other discounts
                print(f"Error calculating {discount_type.value} discount: {e}")
        
        return applicable_discounts
    
    def find_best_discount(self, order_data: dict, customer_data: dict = None) -> dict:
        """Find the best available discount for an order"""
        applicable_discounts = self.get_applicable_discounts(order_data, customer_data)
        
        if not applicable_discounts:
            return {"discount_amount": 0, "applied": False, "reason": "No applicable discounts"}
        
        # Sort by discount amount (descending) and return the best one
        best_discount = max(applicable_discounts, key=lambda x: x["discount"]["discount_amount"])
        
        return best_discount["discount"]
```

### Your Task
Refactor this discount calculator to follow the Open/Closed Principle.

### Requirements
- [ ] **Create discount strategy interface** - abstract discount calculation
- [ ] **Implement strategy classes** - one for each discount type
- [ ] **Remove enum and switch logic** - use polymorphism and strategy registry
- [ ] **Enable dynamic registration** - new discount types can be added without modification
- [ ] **Maintain all functionality** - all discount calculations should work identically
- [ ] **Create discount factory** - for strategy creation and registration
- [ ] **Add validation interface** - each strategy validates its own requirements

### Suggested Design
Consider these components:
- `DiscountStrategy` interface
- Concrete strategy implementations
- `DiscountStrategyRegistry` for managing strategies
- `DiscountCalculator` that uses strategies
- Factory methods for strategy creation

### Focus Areas
- Strategy pattern with registry
- Plugin architecture design
- Dynamic extension mechanisms
- Interface design for flexibility

---

## Problem 3: File Format Converter

### Current Code (C#)
```csharp
// ❌ Violates OCP - requires modification to add new file formats
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Xml;
using System.Xml.Linq;
using Newtonsoft.Json;
using System.Linq;

public enum FileFormat
{
    JSON,
    XML,
    CSV,
    YAML,
    HTML,
    EXCEL
}

public class FileFormatConverter
{
    public string ConvertFile(string inputFilePath, FileFormat inputFormat, 
                             FileFormat outputFormat, ConversionOptions options = null)
    {
        try
        {
            // Read and parse input file
            var data = ReadFile(inputFilePath, inputFormat);
            
            // Convert to output format
            var outputContent = WriteData(data, outputFormat, options);
            
            // Generate output file path
            var outputPath = GenerateOutputPath(inputFilePath, outputFormat);
            
            // Write output file
            File.WriteAllText(outputPath, outputContent);
            
            return outputPath;
        }
        catch (Exception ex)
        {
            throw new ConversionException($"Failed to convert from {inputFormat} to {outputFormat}", ex);
        }
    }
    
    private List<Dictionary<string, object>> ReadFile(string filePath, FileFormat format)
    {
        switch (format)
        {
            case FileFormat.JSON:
                return ReadJsonFile(filePath);
            
            case FileFormat.XML:
                return ReadXmlFile(filePath);
            
            case FileFormat.CSV:
                return ReadCsvFile(filePath);
            
            case FileFormat.YAML:
                return ReadYamlFile(filePath);
            
            case FileFormat.HTML:
                return ReadHtmlFile(filePath);
            
            case FileFormat.EXCEL:
                return ReadExcelFile(filePath);
            
            default:
                throw new UnsupportedFormatException($"Reading format {format} is not supported");
        }
    }
    
    private string WriteData(List<Dictionary<string, object>> data, FileFormat format, ConversionOptions options)
    {
        switch (format)
        {
            case FileFormat.JSON:
                return WriteJsonData(data, options);
            
            case FileFormat.XML:
                return WriteXmlData(data, options);
            
            case FileFormat.CSV:
                return WriteCsvData(data, options);
            
            case FileFormat.YAML:
                return WriteYamlData(data, options);
            
            case FileFormat.HTML:
                return WriteHtmlData(data, options);
            
            case FileFormat.EXCEL:
                return WriteExcelData(data, options);
            
            default:
                throw new UnsupportedFormatException($"Writing format {format} is not supported");
        }
    }
    
    // JSON implementation
    private List<Dictionary<string, object>> ReadJsonFile(string filePath)
    {
        var jsonContent = File.ReadAllText(filePath);
        
        try
        {
            // Try to parse as array of objects
            var arrayData = JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(jsonContent);
            return arrayData;
        }
        catch
        {
            try
            {
                // Try to parse as single object
                var objectData = JsonConvert.DeserializeObject<Dictionary<string, object>>(jsonContent);
                return new List<Dictionary<string, object>> { objectData };
            }
            catch (Exception ex)
            {
                throw new FormatException($"Invalid JSON format: {ex.Message}");
            }
        }
    }
    
    private string WriteJsonData(List<Dictionary<string, object>> data, ConversionOptions options)
    {
        var formatting = options?.PrettyPrint == true ? Formatting.Indented : Formatting.None;
        return JsonConvert.SerializeObject(data, formatting);
    }
    
    // XML implementation
    private List<Dictionary<string, object>> ReadXmlFile(string filePath)
    {
        var xmlDoc = XDocument.Load(filePath);
        var data = new List<Dictionary<string, object>>();
        
        var rootElements = xmlDoc.Root.Elements();
        
        foreach (var element in rootElements)
        {
            var record = new Dictionary<string, object>();
            
            // Handle attributes
            foreach (var attr in element.Attributes())
            {
                record[attr.Name.LocalName] = attr.Value;
            }
            
            // Handle child elements
            foreach (var child in element.Elements())
            {
                if (child.HasElements)
                {
                    // Nested object - simplified handling
                    record[child.Name.LocalName] = child.Value;
                }
                else
                {
                    record[child.Name.LocalName] = child.Value;
                }
            }
            
            data.Add(record);
        }
        
        return data;
    }
    
    private string WriteXmlData(List<Dictionary<string, object>> data, ConversionOptions options)
    {
        var rootName = options?.RootElementName ?? "Root";
        var itemName = options?.ItemElementName ?? "Item";
        
        var xmlDoc = new XDocument();
        var root = new XElement(rootName);
        
        foreach (var record in data)
        {
            var itemElement = new XElement(itemName);
            
            foreach (var kvp in record)
            {
                if (kvp.Value != null)
                {
                    itemElement.Add(new XElement(kvp.Key, kvp.Value.ToString()));
                }
            }
            
            root.Add(itemElement);
        }
        
        xmlDoc.Add(root);
        
        return xmlDoc.ToString();
    }
    
    // CSV implementation
    private List<Dictionary<string, object>> ReadCsvFile(string filePath)
    {
        var lines = File.ReadAllLines(filePath);
        var data = new List<Dictionary<string, object>>();
        
        if (lines.Length == 0)
            return data;
        
        // Parse header
        var headers = ParseCsvLine(lines[0]);
        
        // Parse data rows
        for (int i = 1; i < lines.Length; i++)
        {
            var values = ParseCsvLine(lines[i]);
            var record = new Dictionary<string, object>();
            
            for (int j = 0; j < Math.Min(headers.Length, values.Length); j++)
            {
                record[headers[j]] = values[j];
            }
            
            data.Add(record);
        }
        
        return data;
    }
    
    private string WriteCsvData(List<Dictionary<string, object>> data, ConversionOptions options)
    {
        if (data.Count == 0)
            return "";
        
        var delimiter = options?.CsvDelimiter ?? ",";
        var sb = new StringBuilder();
        
        // Write headers
        var headers = data[0].Keys.ToArray();
        sb.AppendLine(string.Join(delimiter, headers.Select(EscapeCsvField)));
        
        // Write data rows
        foreach (var record in data)
        {
            var values = headers.Select(h => record.ContainsKey(h) ? 
                EscapeCsvField(record[h]?.ToString() ?? "") : "");
            sb.AppendLine(string.Join(delimiter, values));
        }
        
        return sb.ToString();
    }
    
    // YAML implementation
    private List<Dictionary<string, object>> ReadYamlFile(string filePath)
    {
        // Simplified YAML parser - in real implementation would use YamlDotNet
        var yamlContent = File.ReadAllText(filePath);
        var data = new List<Dictionary<string, object>>();
        
        // Very basic YAML parsing - just key: value pairs
        var lines = yamlContent.Split('\n');
        var currentRecord = new Dictionary<string, object>();
        
        foreach (var line in lines)
        {
            var trimmed = line.Trim();
            
            if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith("#"))
                continue;
            
            if (trimmed.StartsWith("-"))
            {
                // New item
                if (currentRecord.Count > 0)
                {
                    data.Add(currentRecord);
                    currentRecord = new Dictionary<string, object>();
                }
                
                var keyValue = trimmed.Substring(1).Trim();
                if (keyValue.Contains(":"))
                {
                    var parts = keyValue.Split(new[] { ':' }, 2);
                    currentRecord[parts[0].Trim()] = parts[1].Trim();
                }
            }
            else if (trimmed.Contains(":"))
            {
                var parts = trimmed.Split(new[] { ':' }, 2);
                currentRecord[parts[0].Trim()] = parts[1].Trim();
            }
        }
        
        if (currentRecord.Count > 0)
        {
            data.Add(currentRecord);
        }
        
        return data;
    }
    
    private string WriteYamlData(List<Dictionary<string, object>> data, ConversionOptions options)
    {
        var sb = new StringBuilder();
        
        foreach (var record in data)
        {
            sb.AppendLine("-");
            foreach (var kvp in record)
            {
                sb.AppendLine($"  {kvp.Key}: {kvp.Value}");
            }
        }
        
        return sb.ToString();
    }
    
    // HTML implementation
    private List<Dictionary<string, object>> ReadHtmlFile(string filePath)
    {
        // Simplified HTML table parser
        var htmlContent = File.ReadAllText(filePath);
        var data = new List<Dictionary<string, object>>();
        
        // This is a very basic implementation - real implementation would use HtmlAgilityPack
        // For now, assume HTML contains a simple table structure
        
        var lines = htmlContent.Split('\n');
        var headers = new List<string>();
        var inTable = false;
        var inHeader = false;
        
        foreach (var line in lines)
        {
            var trimmed = line.Trim();
            
            if (trimmed.Contains("<table"))
            {
                inTable = true;
                continue;
            }
            
            if (trimmed.Contains("</table>"))
            {
                inTable = false;
                break;
            }
            
            if (!inTable)
                continue;
            
            if (trimmed.Contains("<th"))
            {
                inHeader = true;
                // Extract header text (simplified)
                var headerText = ExtractTextBetweenTags(trimmed, "th");
                if (!string.IsNullOrEmpty(headerText))
                {
                    headers.Add(headerText);
                }
            }
            else if (trimmed.Contains("<td") && headers.Count > 0)
            {
                // Extract cell data (simplified)
                var cellText = ExtractTextBetweenTags(trimmed, "td");
                // For simplicity, assume one cell per line and track position
                // Real implementation would be more sophisticated
            }
        }
        
        return data;
    }
    
    private string WriteHtmlData(List<Dictionary<string, object>> data, ConversionOptions options)
    {
        var title = options?.HtmlTitle ?? "Data Export";
        var sb = new StringBuilder();
        
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html>");
        sb.AppendLine("<head>");
        sb.AppendLine($"<title>{title}</title>");
        sb.AppendLine("<style>table { border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; }</style>");
        sb.AppendLine("</head>");
        sb.AppendLine("<body>");
        sb.AppendLine($"<h1>{title}</h1>");
        
        if (data.Count > 0)
        {
            sb.AppendLine("<table>");
            
            // Headers
            var headers = data[0].Keys.ToArray();
            sb.AppendLine("<tr>");
            foreach (var header in headers)
            {
                sb.AppendLine($"<th>{header}</th>");
            }
            sb.AppendLine("</tr>");
            
            // Data rows
            foreach (var record in data)
            {
                sb.AppendLine("<tr>");
                foreach (var header in headers)
                {
                    var value = record.ContainsKey(header) ? record[header]?.ToString() ?? "" : "";
                    sb.AppendLine($"<td>{value}</td>");
                }
                sb.AppendLine("</tr>");
            }
            
            sb.AppendLine("</table>");
        }
        
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");
        
        return sb.ToString();
    }
    
    // Excel implementation
    private List<Dictionary<string, object>> ReadExcelFile(string filePath)
    {
        // Simplified Excel reader - real implementation would use EPPlus or similar
        throw new NotImplementedException("Excel reading requires additional libraries");
    }
    
    private string WriteExcelData(List<Dictionary<string, object>> data, ConversionOptions options)
    {
        // Simplified Excel writer - real implementation would use EPPlus or similar
        throw new NotImplementedException("Excel writing requires additional libraries");
    }
    
    // Helper methods
    private string[] ParseCsvLine(string line)
    {
        // Simplified CSV parser - real implementation would handle quoted fields properly
        return line.Split(',');
    }
    
    private string EscapeCsvField(string field)
    {
        if (field.Contains(",") || field.Contains("\"") || field.Contains("\n"))
        {
            return "\"" + field.Replace("\"", "\"\"") + "\"";
        }
        return field;
    }
    
    private string ExtractTextBetweenTags(string html, string tag)
    {
        var startTag = $"<{tag}";
        var endTag = $"</{tag}>";
        
        var start = html.IndexOf(startTag);
        if (start == -1) return "";
        
        start = html.IndexOf(">", start) + 1;
        var end = html.IndexOf(endTag, start);
        if (end == -1) return "";
        
        return html.Substring(start, end - start).Trim();
    }
    
    private string GenerateOutputPath(string inputPath, FileFormat outputFormat)
    {
        var directory = Path.GetDirectoryName(inputPath);
        var fileNameWithoutExt = Path.GetFileNameWithoutExtension(inputPath);
        var extension = GetFileExtension(outputFormat);
        
        return Path.Combine(directory, $"{fileNameWithoutExt}_converted.{extension}");
    }
    
    private string GetFileExtension(FileFormat format)
    {
        switch (format)
        {
            case FileFormat.JSON: return "json";
            case FileFormat.XML: return "xml";
            case FileFormat.CSV: return "csv";
            case FileFormat.YAML: return "yaml";
            case FileFormat.HTML: return "html";
            case FileFormat.EXCEL: return "xlsx";
            default: return "txt";
        }
    }
    
    public bool IsFormatSupported(FileFormat format)
    {
        // All formats in enum are "supported" but some may throw NotImplementedException
        return Enum.IsDefined(typeof(FileFormat), format);
    }
    
    public List<FileFormat> GetSupportedFormats()
    {
        return Enum.GetValues(typeof(FileFormat)).Cast<FileFormat>().ToList();
    }
}

// Supporting classes
public class ConversionOptions
{
    public bool PrettyPrint { get; set; } = false;
    public string CsvDelimiter { get; set; } = ",";
    public string RootElementName { get; set; } = "Root";
    public string ItemElementName { get; set; } = "Item";
    public string HtmlTitle { get; set; } = "Data Export";
}

public class ConversionException : Exception
{
    public ConversionException(string message) : base(message) { }
    public ConversionException(string message, Exception innerException) : base(message, innerException) { }
}

public class UnsupportedFormatException : Exception
{
    public UnsupportedFormatException(string message) : base(message) { }
}
```

### Your Task
Refactor this file converter to follow the Open/Closed Principle.

### Requirements
- [ ] **Create reader/writer interfaces** - abstract file format handling
- [ ] **Implement format-specific classes** - one reader and writer for each format
- [ ] **Remove enum and switch statements** - use polymorphism and registration
- [ ] **Enable format plugin system** - new formats can be added without modification
- [ ] **Maintain all functionality** - all conversions should work exactly the same
- [ ] **Create format registry** - for managing available formats
- [ ] **Add format detection** - automatically detect input format when possible

### Suggested Architecture
Consider these components:
- `IFileReader` and `IFileWriter` interfaces
- Concrete reader/writer implementations
- `FormatRegistry` for managing formats
- `FileConverter` that orchestrates the process
- Format detection utilities

### Focus Areas
- Plugin architecture design
- Interface segregation
- Registry pattern implementation
- Format detection strategies

---

## 🏆 Success Criteria

For each OCP exercise, demonstrate:

### Extensibility
- **No Modification Required**: New functionality can be added without changing existing code
- **Plugin Architecture**: New behaviors can be plugged in via interfaces
- **Configuration-Driven**: Extensions can be configured rather than hard-coded
- **Polymorphic Design**: Behavior varies through polymorphism, not conditionals

### Design Quality
- **Clean Abstractions**: Interfaces are well-designed and focused
- **Strategy Pattern**: Different algorithms are implemented as strategies
- **Factory Pattern**: Object creation is centralized and extensible
- **Registry Pattern**: Components can be registered and discovered dynamically

### Code Quality
- **No Switch Statements**: Conditionals are replaced with polymorphism
- **Loose Coupling**: Components depend on abstractions, not concretions
- **High Cohesion**: Each class has a single, focused responsibility
- **Easy Testing**: Each strategy/plugin can be tested independently

---

## 💡 OCP Implementation Patterns

### **Strategy Pattern with Registry**
```java
// ✅ Strategy interface
interface PaymentStrategy {
    PaymentResult processPayment(PaymentRequest request);
    boolean supports(PaymentMethod method);
    void validate(PaymentRequest request);
}

// ✅ Registry for strategies
class PaymentStrategyRegistry {
    private Map<PaymentMethod, PaymentStrategy> strategies = new HashMap<>();
    
    public void register(PaymentMethod method, PaymentStrategy strategy) {
        strategies.put(method, strategy);
    }
    
    public PaymentStrategy getStrategy(PaymentMethod method) {
        PaymentStrategy strategy = strategies.get(method);
        if (strategy == null) {
            throw new UnsupportedPaymentMethodException(method);
        }
        return strategy;
    }
}

// ✅ Open for extension, closed for modification
class PaymentProcessor {
    private final PaymentStrategyRegistry registry;
    
    public PaymentProcessor(PaymentStrategyRegistry registry) {
        this.registry = registry;
    }
    
    public PaymentResult processPayment(PaymentRequest request) {
        PaymentStrategy strategy = registry.getStrategy(request.getPaymentMethod());
        strategy.validate(request);
        return strategy.processPayment(request);
    }
}
```

### **Plugin Architecture**
```java
// ✅ Plugin interface
interface FileFormatPlugin {
    String getFormatName();
    String[] getFileExtensions();
    List<DataRecord> read(String filePath);
    void write(List<DataRecord> data, String filePath, ConversionOptions options);
}

// ✅ Plugin registry
class PluginRegistry {
    private Map<String, FileFormatPlugin> plugins = new HashMap<>();
    
    public void registerPlugin(FileFormatPlugin plugin) {
        plugins.put(plugin.getFormatName().toLowerCase(), plugin);
        
        // Also register by file extensions
        for (String ext : plugin.getFileExtensions()) {
            plugins.put(ext.toLowerCase(), plugin);
        }
    }
    
    public FileFormatPlugin getPlugin(String formatOrExtension) {
        return plugins.get(formatOrExtension.toLowerCase());
    }
}

// ✅ Converter uses plugins
class FileConverter {
    private final PluginRegistry registry;
    
    public void convertFile(String inputPath, String outputFormat) {
        String inputExtension = getFileExtension(inputPath);
        
        FileFormatPlugin inputPlugin = registry.getPlugin(inputExtension);
        FileFormatPlugin outputPlugin = registry.getPlugin(outputFormat);
        
        List<DataRecord> data = inputPlugin.read(inputPath);
        String outputPath = generateOutputPath(inputPath, outputFormat);
        outputPlugin.write(data, outputPath, new ConversionOptions());
    }
}
```

### **Extensible Validation**
```java
// ✅ Composable validation
interface ValidationRule<T> {
    ValidationResult validate(T object);
}

class ValidationEngine<T> {
    private List<ValidationRule<T>> rules = new ArrayList<>();
    
    public void addRule(ValidationRule<T> rule) {
        rules.add(rule);
    }
    
    public ValidationResult validate(T object) {
        List<String> errors = new ArrayList<>();
        
        for (ValidationRule<T> rule : rules) {
            ValidationResult result = rule.validate(object);
            if (!result.isValid()) {
                errors.addAll(result.getErrors());
            }
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
}

// ✅ Usage - new rules can be added without modifying the engine
ValidationEngine<User> userValidator = new ValidationEngine<>();
userValidator.addRule(new RequiredFieldRule("email"));
userValidator.addRule(new EmailFormatRule());
userValidator.addRule(new UniqueEmailRule(userRepository));
userValidator.addRule(new PasswordStrengthRule());
```

---

## 🎯 Self-Assessment

After completing each OCP exercise:

### **Extensibility Achievement (1-5 scale)**
- [ ] **No Modification**: New features can be added without changing existing code
- [ ] **Plugin Support**: New behaviors can be plugged in easily
- [ ] **Polymorphic Design**: Behavior varies through polymorphism, not conditionals
- [ ] **Registry Pattern**: Components can be registered and discovered

### **Design Quality (1-5 scale)**
- [ ] **Interface Design**: Abstractions are well-designed and stable
- [ ] **Strategy Implementation**: Different algorithms are cleanly separated
- [ ] **Factory Usage**: Object creation is centralized and extensible
- [ ] **Loose Coupling**: Components depend on abstractions

**Target**: All scores should be 4 or 5, representing mastery of OCP.

---

## 🚀 Next Steps

Once you've mastered the Open/Closed Principle:

1. **Practice extension scenarios** - Add new features to your refactored code without modification
2. **Design with OCP in mind** - Think about extension points when designing new systems
3. **Move to [Exercise 3: Liskov Substitution Principle](./exercise-3-lsp.md)** - Learn proper inheritance design
4. **Apply to your projects** - Look for switch statements and conditionals that can be replaced with polymorphism

Remember: The Open/Closed Principle is about designing systems that can grow without breaking. When you need to add new functionality, you should be able to do it by adding new code, not by modifying existing code. This leads to more stable, maintainable systems!
