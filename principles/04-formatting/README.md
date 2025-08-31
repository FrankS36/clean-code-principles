# Principle 4: Formatting

> *"Code formatting is about communication, and communication is the professional developer's first order of business."* - Robert C. Martin

## 🧭 **Navigation**
← **[Previous: Comments](../03-comments/README.md)** | **[Learning Path](../../LEARNING_PATH.md)** | **[Next: Objects →](../05-objects-and-data/README.md)**

**This Principle:** [Examples](../../examples/before-after/formatting-examples/README.md) | [Exercises](../../exercises/principle-practice/04-formatting/README.md) | [Checklist](./checklist.md)

## 🎯 Learning Objectives

By the end of this section, you will:
- Understand how consistent formatting improves code readability and team collaboration
- Apply vertical formatting principles to organize code logically
- Use horizontal formatting to make code scannable and readable
- Establish and maintain consistent formatting standards across a codebase
- Configure and use automated formatting tools effectively
- Write code that looks professional and is easy to navigate

## 💡 Why Formatting Matters

**The Reality**: Developers spend far more time reading code than writing it.

**The Impact**: Well-formatted code reduces cognitive load, speeds up comprehension, and prevents bugs caused by misunderstanding.

**The Benefits**:
- ✅ Faster code comprehension and navigation
- ✅ Easier debugging and troubleshooting
- ✅ Better team collaboration and code reviews
- ✅ More professional appearance and maintainability
- ✅ Reduced cognitive overhead when reading code

**The Cost of Poor Formatting**:
- ❌ Slower code reading and understanding
- ❌ Higher chance of missing important details
- ❌ Inconsistent team standards and confusion
- ❌ Unprofessional appearance
- ❌ Harder maintenance and modification

---

## 📚 Core Guidelines

### 1. Vertical Formatting - The Newspaper Metaphor

Code should read like a well-written newspaper article: headline at the top, important details first, supporting details below.

**File Length Guidelines**:
- **Ideal**: 200-500 lines
- **Acceptable**: Up to 800 lines
- **Avoid**: Files over 1000 lines (consider splitting)

**❌ Bad - No Vertical Organization:**
```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { validateEmail, validatePassword } = require('./utils/validation');
const rateLimit = require('express-rate-limit');
const app = express();
app.use(express.json());
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}
async function authenticateUser(email, password) {
  const user = await User.findByEmail(email);
  if (!user) return null;
  const isValid = await bcrypt.compare(password, user.hashedPassword);
  return isValid ? user : null;
}
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password too weak' });
    }
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email,
      hashedPassword,
      firstName,
      lastName
    });
    const token = generateToken(user);
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**✅ Good - Clear Vertical Organization:**
```javascript
// =============================================================================
// DEPENDENCIES AND CONFIGURATION
// =============================================================================
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const User = require('./models/User');
const { validateEmail, validatePassword } = require('./utils/validation');

const app = express();
app.use(express.json());

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later'
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function authenticateUser(email, password) {
  const user = await User.findByEmail(email);
  if (!user) {
    return null;
  }
  
  const isValid = await bcrypt.compare(password, user.hashedPassword);
  return isValid ? user : null;
}

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate input
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password too weak' });
    }
    
    // Check for existing user
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Create new user
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email,
      hashedPassword,
      firstName,
      lastName
    });
    
    // Generate response
    const token = generateToken(user);
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2. Blank Lines for Conceptual Separation

Use blank lines to separate related concepts, like paragraphs in prose.

**✅ Good Use of Blank Lines:**
```python
class OrderProcessor:
    def __init__(self, payment_gateway, inventory_service, email_service):
        self.payment_gateway = payment_gateway
        self.inventory_service = inventory_service
        self.email_service = email_service
    
    def process_order(self, order):
        # Validation phase
        self.validate_order_data(order)
        self.validate_inventory_availability(order)
        
        # Processing phase
        self.reserve_inventory(order)
        payment_result = self.process_payment(order)
        
        # Completion phase
        self.confirm_order(order, payment_result)
        self.send_confirmation_email(order)
        
        return order
    
    def validate_order_data(self, order):
        if not order.items:
            raise ValueError("Order must contain at least one item")
        
        if order.total <= 0:
            raise ValueError("Order total must be positive")
        
        if not order.customer_email:
            raise ValueError("Customer email is required")
    
    def validate_inventory_availability(self, order):
        for item in order.items:
            available_quantity = self.inventory_service.get_available_quantity(item.product_id)
            
            if available_quantity < item.quantity:
                raise ValueError(f"Insufficient stock for {item.product_name}")
```

### 3. Vertical Density and Proximity

Keep related concepts close together. Don't separate related code with unnecessary blank lines.

**❌ Bad - Unnecessary Separation:**
```java
public class UserService {

    private UserRepository userRepository;

    private EmailService emailService;

    private PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, 

                      EmailService emailService, 

                      PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;

        this.emailService = emailService;

        this.passwordEncoder = passwordEncoder;

    }

    public User createUser(String email, 

                          String password, 

                          String firstName, 

                          String lastName) {

        String encodedPassword = passwordEncoder.encode(password);

        User user = new User(email, encodedPassword, firstName, lastName);

        User savedUser = userRepository.save(user);

        emailService.sendWelcomeEmail(savedUser);

        return savedUser;

    }
}
```

**✅ Good - Appropriate Density:**
```java
public class UserService {
    private UserRepository userRepository;
    private EmailService emailService;
    private PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, EmailService emailService, 
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(String email, String password, 
                          String firstName, String lastName) {
        String encodedPassword = passwordEncoder.encode(password);
        User user = new User(email, encodedPassword, firstName, lastName);
        
        User savedUser = userRepository.save(user);
        emailService.sendWelcomeEmail(savedUser);
        
        return savedUser;
    }
}
```

### 4. Horizontal Formatting - Line Length

Keep lines readable without horizontal scrolling.

**Guidelines**:
- **Ideal**: 80-100 characters
- **Acceptable**: Up to 120 characters
- **Avoid**: Lines over 120 characters

**❌ Bad - Lines Too Long:**
```javascript
function calculateComprehensiveOrderSummaryWithDiscountsAndTaxesAndShippingForPremiumCustomersInSpecificRegions(order, customer, shippingAddress, discountCodes, taxRates, shippingRates) {
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const applicableDiscounts = discountCodes.filter(code => code.isValidForCustomer(customer) && code.isValidForOrder(order) && code.isValidForRegion(shippingAddress.region));
    return { subtotal, discounts: applicableDiscounts, total: calculateFinalTotal(subtotal, applicableDiscounts, taxRates, shippingRates) };
}
```

**✅ Good - Readable Line Length:**
```javascript
function calculateOrderSummary(order, customer, shippingAddress, 
                              discountCodes, taxRates, shippingRates) {
    const subtotal = calculateSubtotal(order.items);
    const applicableDiscounts = findApplicableDiscounts(
        discountCodes, 
        customer, 
        order, 
        shippingAddress.region
    );
    
    const finalTotal = calculateFinalTotal(
        subtotal, 
        applicableDiscounts, 
        taxRates, 
        shippingRates
    );
    
    return {
        subtotal,
        discounts: applicableDiscounts,
        total: finalTotal
    };
}
```

### 5. Indentation and Nesting

Use consistent indentation to show code hierarchy and avoid deep nesting.

**Indentation Standards**:
- **JavaScript/TypeScript**: 2 or 4 spaces
- **Python**: 4 spaces (PEP 8)
- **Java/C#**: 4 spaces
- **HTML/CSS**: 2 spaces

**❌ Bad - Deep Nesting and Inconsistent Indentation:**
```python
def process_user_order(user_id, order_data):
  user = get_user(user_id)
  if user:
    if user.is_active:
      if order_data:
        if order_data.get('items'):
          for item in order_data['items']:
            if item.get('product_id'):
              product = get_product(item['product_id'])
              if product:
                if product.is_available:
                  if product.stock >= item.get('quantity', 0):
                    # Process the item
                    pass
                  else:
                    raise Exception('Insufficient stock')
                else:
                  raise Exception('Product not available')
              else:
                raise Exception('Product not found')
            else:
              raise Exception('Product ID required')
        else:
          raise Exception('No items in order')
      else:
        raise Exception('Order data required')
    else:
      raise Exception('User account inactive')
  else:
    raise Exception('User not found')
```

**✅ Good - Guard Clauses and Consistent Indentation:**
```python
def process_user_order(user_id, order_data):
    user = get_user(user_id)
    if not user:
        raise Exception('User not found')
    
    if not user.is_active:
        raise Exception('User account inactive')
    
    if not order_data:
        raise Exception('Order data required')
    
    if not order_data.get('items'):
        raise Exception('No items in order')
    
    for item in order_data['items']:
        process_order_item(item)

def process_order_item(item):
    if not item.get('product_id'):
        raise Exception('Product ID required')
    
    product = get_product(item['product_id'])
    if not product:
        raise Exception('Product not found')
    
    if not product.is_available:
        raise Exception('Product not available')
    
    requested_quantity = item.get('quantity', 0)
    if product.stock < requested_quantity:
        raise Exception('Insufficient stock')
    
    # Process the item
    reserve_product_stock(product, requested_quantity)
```

### 6. Alignment and Spacing

Use consistent spacing around operators and punctuation to improve readability.

**❌ Bad - Inconsistent Spacing:**
```javascript
function calculatePrice(basePrice,discountPercent,taxRate,shippingCost){
  let discountAmount=basePrice*discountPercent;
  let discountedPrice = basePrice-discountAmount;
  let taxAmount= discountedPrice * taxRate;
  let totalPrice=discountedPrice+taxAmount+shippingCost;
  return{
    basePrice:basePrice,
    discount:discountAmount,
    tax :taxAmount,
    shipping: shippingCost,
    total :totalPrice
  };
}
```

**✅ Good - Consistent Spacing:**
```javascript
function calculatePrice(basePrice, discountPercent, taxRate, shippingCost) {
    const discountAmount = basePrice * discountPercent;
    const discountedPrice = basePrice - discountAmount;
    const taxAmount = discountedPrice * taxRate;
    const totalPrice = discountedPrice + taxAmount + shippingCost;
    
    return {
        basePrice: basePrice,
        discount: discountAmount,
        tax: taxAmount,
        shipping: shippingCost,
        total: totalPrice
    };
}
```

### 7. Team Consistency

Establish and enforce consistent formatting standards across the entire team and codebase.

**Essential Team Standards**:
- **Indentation**: Spaces vs. tabs, how many spaces
- **Line length**: Maximum character count
- **Braces**: Same line vs. new line
- **Spacing**: Around operators, after commas
- **File organization**: Import order, section separation

**✅ Example Team Standard Document:**
```markdown
# Team Coding Standards

## Indentation
- Use 2 spaces for JavaScript/TypeScript
- Use 4 spaces for Python
- Never mix spaces and tabs

## Line Length
- Maximum 100 characters per line
- Break long lines at logical points

## Spacing
- Space after commas: `function(a, b, c)`
- Space around operators: `x = y + z`
- No trailing whitespace

## Braces (JavaScript/Java)
- Opening brace on same line
- Always use braces, even for single statements

## File Organization
- Imports at top, grouped by type
- Constants after imports
- Functions in logical order
- Main execution at bottom
```

---

## 🛠️ Automated Formatting Tools

### 1. JavaScript/TypeScript - Prettier

**Configuration Example (.prettierrc):**
```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "trailingComma": "es5",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid"
}
```

**Benefits**:
- Eliminates formatting debates
- Consistent code across team
- Automatic formatting on save
- Integration with editors and CI/CD

### 2. Python - Black

**Configuration Example (pyproject.toml):**
```toml
[tool.black]
line-length = 100
target-version = ['py38']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.mypy_cache
  | \.venv
  | build
  | dist
)/
'''
```

### 3. Java - Google Java Format

**Integration with build tools:**
```xml
<!-- Maven -->
<plugin>
  <groupId>com.coveo</groupId>
  <artifactId>fmt-maven-plugin</artifactId>
  <version>2.9</version>
  <executions>
    <execution>
      <goals>
        <goal>format</goal>
      </goals>
    </execution>
  </executions>
</plugin>
```

### 4. Multi-Language - EditorConfig

**Example .editorconfig:**
```ini
# EditorConfig is awesome: https://EditorConfig.org

root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{js,jsx,ts,tsx}]
indent_style = space
indent_size = 2
max_line_length = 100

[*.{py}]
indent_style = space
indent_size = 4
max_line_length = 100

[*.{java,kt}]
indent_style = space
indent_size = 4
max_line_length = 120

[*.{md,yml,yaml}]
indent_style = space
indent_size = 2
trim_trailing_whitespace = false
```

---

## 📐 Language-Specific Conventions

### JavaScript/TypeScript
```javascript
// Object formatting
const user = {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    preferences: {
        theme: 'dark',
        notifications: true
    }
};

// Array formatting
const colors = [
    'red',
    'green', 
    'blue'
];

// Function formatting
function calculateTotal(
    items,
    taxRate,
    discountCode = null
) {
    // Implementation
}

// Import formatting
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import { formatCurrency, validateInput } from './utils';
```

### Python
```python
# PEP 8 formatting standards

# Import formatting
import os
import sys
from collections import defaultdict

import requests
import numpy as np

from myproject.utils import helper_function
from myproject.models import User, Order

# Function formatting
def calculate_order_total(
    items: List[OrderItem],
    tax_rate: float,
    discount_code: Optional[str] = None
) -> Decimal:
    """Calculate total order amount including tax and discounts."""
    # Implementation
    pass

# Class formatting
class OrderProcessor:
    """Handles order processing workflow."""
    
    def __init__(self, payment_gateway: PaymentGateway, 
                 inventory_service: InventoryService):
        self.payment_gateway = payment_gateway
        self.inventory_service = inventory_service
    
    def process_order(self, order: Order) -> ProcessResult:
        """Process a customer order through the complete workflow."""
        # Implementation
        pass

# Dictionary formatting
user_data = {
    'id': 123,
    'name': 'John Doe',
    'email': 'john@example.com',
    'preferences': {
        'theme': 'dark',
        'notifications': True,
    },
}
```

### Java
```java
// Java formatting conventions

// Import formatting
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.model.User;
import com.example.repository.UserRepository;

// Class formatting
@Service
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    @Autowired
    public UserService(UserRepository userRepository, 
                      EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
    
    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public User createUser(String email, String firstName, String lastName) {
        User user = User.builder()
            .email(email)
            .firstName(firstName)
            .lastName(lastName)
            .createdAt(LocalDateTime.now())
            .build();
            
        User savedUser = userRepository.save(user);
        emailService.sendWelcomeEmail(savedUser);
        
        return savedUser;
    }
}
```

---

## 🔍 Code Review Formatting Checklist

### Vertical Formatting
- [ ] File length is reasonable (< 500 lines ideal)
- [ ] Related concepts are grouped together
- [ ] Blank lines separate different concerns
- [ ] Functions are ordered logically (high-level first)
- [ ] Imports/dependencies are at the top

### Horizontal Formatting
- [ ] Lines are under 120 characters
- [ ] Long lines are broken at logical points
- [ ] Consistent spacing around operators
- [ ] Proper alignment of related elements
- [ ] No trailing whitespace

### Indentation and Structure
- [ ] Consistent indentation throughout
- [ ] Logical nesting levels (avoid deep nesting)
- [ ] Clear visual hierarchy
- [ ] Proper bracket/brace alignment
- [ ] Consistent use of spaces vs. tabs

### Team Consistency
- [ ] Follows established team standards
- [ ] Consistent with existing codebase
- [ ] Automated formatting tools configured
- [ ] No personal style variations
- [ ] Documentation of standards exists

---

## 🚀 **Next Steps**

**You've completed Principle 4: Formatting! 🎉**

**🏆 Congratulations! You've finished the Foundation Phase!** You now have solid skills in names, functions, comments, and formatting - the core building blocks of clean code.

### **Immediate Next Actions:**
1. **[📝 Practice with Exercises →](../../exercises/principle-practice/04-formatting/README.md)** - Master formatting techniques
2. **[📋 Use the Daily Checklist](./checklist.md)** - Apply formatting standards in daily coding
3. **[👀 Study the Examples](../../examples/before-after/formatting-examples/README.md)** - See formatting transformations
4. **[⚙️ Set Up Automation](./checklist.md)** - Configure Prettier, Black, or other formatters

### **Continue Your Learning Journey:**
- **[📖 Next: Principle 5 - Objects →](../05-objects-and-data/README.md)** - Learn proper abstraction and encapsulation
- **[📚 Back to Learning Path](../../LEARNING_PATH.md)** - Start the Robustness Phase (Week 5)
- **[🎯 Apply to Your Code](../../LEARNING_PATH.md#progress-tracking-and-assessment)** - Format your existing projects

**Ready for the robustness phase?** Objects and Data Structures! **[Start Principle 5 →](../05-objects-and-data/README.md)**

---

*Remember: Code formatting is about communication. Consistent, readable formatting reduces cognitive load and makes your code a pleasure to work with. When in doubt, favor readability and team consistency over personal preferences.*
