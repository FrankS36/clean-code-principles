# Formatting Quick Reference Checklist

Use this checklist to ensure your code follows professional formatting standards and is easy to read and maintain.

## 📝 Pre-Commit Formatting Checklist

Before committing code, check these formatting criteria:

### ✅ **Vertical Formatting**
- [ ] **File length is reasonable** - Ideal: 200-500 lines, max: 800 lines
- [ ] **Logical organization** - Imports at top, constants next, functions in logical order
- [ ] **Conceptual grouping** - Related functions and variables are near each other
- [ ] **Blank line separation** - Different concerns separated by blank lines
- [ ] **Newspaper structure** - Most important/high-level information at the top

### ✅ **Horizontal Formatting**
- [ ] **Line length** - Lines under 100-120 characters (team standard)
- [ ] **Proper line breaking** - Long lines broken at logical points
- [ ] **Consistent spacing** - Uniform spacing around operators and punctuation
- [ ] **No trailing whitespace** - Clean line endings
- [ ] **Readable parameter lists** - Multi-parameter functions formatted clearly

### ✅ **Indentation and Structure**
- [ ] **Consistent indentation** - Same indentation style throughout (2 or 4 spaces)
- [ ] **Proper nesting** - Avoid deep nesting (max 4-5 levels)
- [ ] **Clear hierarchy** - Indentation clearly shows code structure
- [ ] **Language conventions** - Follows established standards for the language
- [ ] **No mixed tabs/spaces** - Consistent use of spaces OR tabs, not both

### ✅ **Team Consistency**
- [ ] **Follows team standards** - Matches established team formatting guidelines
- [ ] **Consistent with codebase** - New code matches existing code style
- [ ] **Automated formatting** - Uses team's formatting tools (Prettier, Black, etc.)
- [ ] **No personal style variations** - Follows team decisions over personal preferences

## 🔧 Language-Specific Standards

### JavaScript/TypeScript
```javascript
// ✅ Good formatting standards
const userPreferences = {
    theme: 'dark',
    notifications: true,
    language: 'en'
};

function calculateOrderTotal(
    items,
    taxRate,
    discountCode = null
) {
    const subtotal = items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    const discount = discountCode ? 
        calculateDiscount(subtotal, discountCode) : 
        0;
    
    const tax = (subtotal - discount) * taxRate;
    return subtotal - discount + tax;
}

// Import organization
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';

import Header from './components/Header';
import { formatCurrency } from './utils';
```

**Standards**:
- [ ] 2 or 4 space indentation (team choice)
- [ ] Line length: 80-100 characters
- [ ] Semicolons: consistent usage
- [ ] Single or double quotes: consistent choice
- [ ] Trailing commas in objects/arrays
- [ ] Space after keywords: `if (`, `for (`, `while (`

### Python
```python
# ✅ Good formatting standards (PEP 8)
import os
import sys
from typing import List, Optional

import requests
import numpy as np

from myapp.models import User
from myapp.utils import validate_email


class UserService:
    """Manages user operations and authentication."""
    
    def __init__(self, database, email_service):
        self.database = database
        self.email_service = email_service
    
    def create_user(
        self, 
        email: str, 
        password: str, 
        first_name: str,
        last_name: str
    ) -> User:
        """Create a new user account."""
        if not validate_email(email):
            raise ValueError("Invalid email format")
        
        user = User(
            email=email,
            password=self._hash_password(password),
            first_name=first_name,
            last_name=last_name
        )
        
        self.database.save(user)
        self.email_service.send_welcome_email(user)
        
        return user
```

**Standards**:
- [ ] 4 space indentation (PEP 8)
- [ ] Line length: 79-88 characters
- [ ] Import organization: standard library, third-party, local
- [ ] Two blank lines before class definitions
- [ ] One blank line before method definitions
- [ ] Space around operators: `x = y + z`

### Java
```java
// ✅ Good formatting standards
package com.example.service;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.model.User;
import com.example.repository.UserRepository;

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
    
    public User createUser(String email, String firstName, 
                          String lastName) {
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

**Standards**:
- [ ] 4 space indentation
- [ ] Line length: 80-120 characters
- [ ] Braces on same line: `if (condition) {`
- [ ] Space after keywords: `if (`, `for (`, `while (`
- [ ] Import organization: java.*, javax.*, org.*, com.*
- [ ] One blank line between methods

## 🚨 Common Formatting Problems

### Poor Vertical Organization
```javascript
// ❌ Bad - No organization
const express = require('express');
function helper() {}
const app = express();
app.get('/api/users', handler);
const PORT = 3000;
function anotherHelper() {}

// ✅ Good - Logical organization
const express = require('express');

const app = express();
const PORT = 3000;

function helper() {}
function anotherHelper() {}

app.get('/api/users', handler);
```

### Inconsistent Horizontal Spacing
```python
# ❌ Bad - Inconsistent spacing
def calculate(base,rate, discount):
    result=base*rate-discount
    return result

# ✅ Good - Consistent spacing
def calculate(base, rate, discount):
    result = base * rate - discount
    return result
```

### Poor Indentation
```java
// ❌ Bad - Inconsistent indentation
public class Example {
public void method() {
if (condition) {
  doSomething();
    doSomethingElse();
}
}
}

// ✅ Good - Consistent indentation
public class Example {
    public void method() {
        if (condition) {
            doSomething();
            doSomethingElse();
        }
    }
}
```

### Long Lines
```javascript
// ❌ Bad - Lines too long
function processUserOrderWithMultipleItemsAndDiscountsAndTaxCalculationAndShippingCalculationAndPaymentProcessing(user, order, discounts, taxes, shipping, payment) {
    return calculateTotalWithAllDiscountsAndTaxesAndShippingAndProcessPaymentAndSendConfirmationEmailAndUpdateInventory(user, order, discounts, taxes, shipping, payment);
}

// ✅ Good - Readable line breaks
function processCompleteUserOrder(
    user, order, discounts, 
    taxes, shipping, payment
) {
    const total = calculateOrderTotal(order, discounts, taxes, shipping);
    const paymentResult = processPayment(payment, total);
    
    sendConfirmationEmail(user, order);
    updateInventory(order.items);
    
    return paymentResult;
}
```

## 🛠️ Automated Formatting Tools

### Setup Checklist
- [ ] **Prettier** (JavaScript/TypeScript) - Configured and enabled
- [ ] **Black** (Python) - Integrated with editor and CI/CD
- [ ] **Google Java Format** (Java) - IDE plugin installed
- [ ] **EditorConfig** - Cross-language consistency
- [ ] **ESLint/TSLint** - Style rules enforced
- [ ] **Pre-commit hooks** - Automatic formatting before commits

### Tool Configuration Examples

**Prettier (.prettierrc):**
```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

**Black (pyproject.toml):**
```toml
[tool.black]
line-length = 100
target-version = ['py38']
include = '\.pyi?$'
```

**EditorConfig (.editorconfig):**
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{js,ts}]
indent_style = space
indent_size = 2

[*.py]
indent_style = space
indent_size = 4

[*.java]
indent_style = space
indent_size = 4
```

## 🎯 Code Review Formatting Checklist

When reviewing code, check for:

### **Visual Consistency**
- [ ] Code looks professional and polished
- [ ] Consistent indentation throughout the file
- [ ] Appropriate use of blank lines for separation
- [ ] No mixed formatting styles within the same file

### **Readability**
- [ ] Code can be read without horizontal scrolling
- [ ] Related concepts are grouped together
- [ ] Important information is easy to find
- [ ] Structure is immediately clear from indentation

### **Team Standards**
- [ ] Follows established team guidelines
- [ ] Uses configured automated formatting tools
- [ ] Consistent with existing codebase style
- [ ] No unnecessary formatting variations

### **Language Conventions**
- [ ] Follows language-specific style guides
- [ ] Uses recommended import organization
- [ ] Applies standard spacing and punctuation rules
- [ ] Follows naming convention capitalization

## 📊 Self-Assessment Questions

Rate your codebase formatting (1-5 scale):

- [ ] **Consistency**: Formatting is consistent across all files (1=very inconsistent, 5=perfectly consistent)
- [ ] **Readability**: Code is easy to scan and read quickly (1=hard to read, 5=very readable)
- [ ] **Organization**: Files are well-organized with clear structure (1=chaotic, 5=well-organized)
- [ ] **Professionalism**: Code looks polished and professional (1=sloppy, 5=professional)
- [ ] **Tool Usage**: Automated formatting tools are configured and used (1=no tools, 5=fully automated)

**Target**: All scores should be 4 or 5. If any score is 3 or below, focus on improving that aspect.

## 💡 Pro Tips

### **Newspaper Metaphor**
Structure your files like newspaper articles:
- Headline (file purpose) at the top
- Lead paragraph (most important functions)
- Supporting details below
- Background information at the bottom

### **The Squint Test**
Squint at your code - does it have a pleasing visual structure? Can you see the organization even when you can't read the details?

### **Consistency Over Preference**
Always choose team consistency over personal formatting preferences. The goal is readable, maintainable code that everyone can work with.

### **Automate Everything**
Configure formatting tools so you don't have to think about it. Let the tools handle the mechanics while you focus on the logic.

---

*Remember: Good formatting is about communication and professionalism. Consistent, readable formatting makes your code a pleasure to work with and reflects well on your technical craftsmanship.*
