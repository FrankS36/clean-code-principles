# Exercise 4: Function Composition

Master the art of building complex operations from simple, composable functions to create elegant, maintainable, and reusable code.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Build complex operations from simple, focused functions
- Apply functional composition patterns effectively
- Create reusable, modular function chains
- Understand higher-order functions and their applications
- Design pipeline-style data processing

## 📝 Exercise Format

Each problem presents complex operations that would typically be written as large, monolithic functions. Your job is to break them down into small, composable functions that can be combined to achieve the desired result.

---

## Problem 1: Data Processing Pipeline

### Current Code (JavaScript)
```javascript
// ❌ Monolithic data processing
function processUserData(users) {
    const result = [];
    
    for (let user of users) {
        // Skip invalid users
        if (!user.email || !user.name || user.age < 0) {
            continue;
        }
        
        // Normalize data
        const normalizedUser = {
            id: user.id,
            name: user.name.trim().toLowerCase(),
            email: user.email.trim().toLowerCase(),
            age: user.age,
            joinDate: new Date(user.joinDate),
            preferences: user.preferences || []
        };
        
        // Calculate derived fields
        const ageGroup = normalizedUser.age < 18 ? 'minor' : 
                        normalizedUser.age < 65 ? 'adult' : 'senior';
        
        const accountAge = Math.floor((Date.now() - normalizedUser.joinDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const isNewUser = accountAge < 30;
        const isActiveUser = normalizedUser.preferences.includes('notifications');
        
        // Format for output
        const processedUser = {
            userId: normalizedUser.id,
            displayName: normalizedUser.name.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
            contact: normalizedUser.email,
            demographics: {
                age: normalizedUser.age,
                ageGroup: ageGroup,
                accountAge: accountAge
            },
            status: {
                isNew: isNewUser,
                isActive: isActiveUser,
                membershipLevel: isNewUser ? 'trial' : 
                               accountAge > 365 ? 'premium' : 'standard'
            }
        };
        
        result.push(processedUser);
    }
    
    // Sort by membership level and age
    result.sort((a, b) => {
        const levelOrder = { 'premium': 3, 'standard': 2, 'trial': 1 };
        const levelDiff = levelOrder[b.status.membershipLevel] - levelOrder[a.status.membershipLevel];
        return levelDiff !== 0 ? levelDiff : a.demographics.age - b.demographics.age;
    });
    
    return result;
}
```

### Your Task
Break this down into small, composable functions that can be combined.

### Requirements
- [ ] Create pure validation functions
- [ ] Extract normalization functions
- [ ] Create calculation functions for derived fields
- [ ] Build formatting functions
- [ ] Create composable pipeline using these functions
- [ ] Make each function testable in isolation

### Focus Areas
- Pipeline pattern
- Pure function composition
- Functional transformation chains
- Data flow design

---

## Problem 2: Validation Chain Builder

### Current Code (Python)
```python
# ❌ Complex validation logic in one function
def validate_user_registration(data):
    errors = []
    
    # Email validation
    if not data.get('email'):
        errors.append('Email is required')
    else:
        email = data['email'].strip().lower()
        import re
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            errors.append('Invalid email format')
        
        # Check email domain
        domain = email.split('@')[1]
        blocked_domains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com']
        if domain in blocked_domains:
            errors.append('Email domain not allowed')
        
        # Check email length
        if len(email) > 254:
            errors.append('Email too long')
    
    # Password validation
    if not data.get('password'):
        errors.append('Password is required')
    else:
        password = data['password']
        if len(password) < 8:
            errors.append('Password must be at least 8 characters')
        if len(password) > 128:
            errors.append('Password too long')
        if not re.search(r'[A-Z]', password):
            errors.append('Password must contain uppercase letter')
        if not re.search(r'[a-z]', password):
            errors.append('Password must contain lowercase letter')
        if not re.search(r'\d', password):
            errors.append('Password must contain number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append('Password must contain special character')
        
        # Check for common passwords
        common_passwords = ['password', '123456789', 'qwerty', 'abc123']
        if password.lower() in common_passwords:
            errors.append('Password too common')
    
    # Name validation
    if not data.get('first_name'):
        errors.append('First name is required')
    else:
        first_name = data['first_name'].strip()
        if len(first_name) < 2:
            errors.append('First name too short')
        if len(first_name) > 50:
            errors.append('First name too long')
        if not re.match(r'^[a-zA-Z\s\'-]+$', first_name):
            errors.append('First name contains invalid characters')
    
    if not data.get('last_name'):
        errors.append('Last name is required')
    else:
        last_name = data['last_name'].strip()
        if len(last_name) < 2:
            errors.append('Last name too short')
        if len(last_name) > 50:
            errors.append('Last name too long')
        if not re.match(r'^[a-zA-Z\s\'-]+$', last_name):
            errors.append('Last name contains invalid characters')
    
    # Age validation
    if not data.get('age'):
        errors.append('Age is required')
    else:
        try:
            age = int(data['age'])
            if age < 13:
                errors.append('Must be at least 13 years old')
            if age > 120:
                errors.append('Invalid age')
        except ValueError:
            errors.append('Age must be a number')
    
    # Phone validation (optional)
    if data.get('phone'):
        phone = re.sub(r'[^\d]', '', data['phone'])
        if len(phone) != 10:
            errors.append('Phone number must be 10 digits')
        if not phone.startswith(('2', '3', '4', '5', '6', '7', '8', '9')):
            errors.append('Invalid phone number format')
    
    # Terms acceptance
    if not data.get('accept_terms'):
        errors.append('Must accept terms and conditions')
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors,
        'validated_data': {
            'email': data.get('email', '').strip().lower(),
            'first_name': data.get('first_name', '').strip(),
            'last_name': data.get('last_name', '').strip(),
            'age': int(data.get('age', 0)) if data.get('age') and str(data.get('age')).isdigit() else None,
            'phone': re.sub(r'[^\d]', '', data.get('phone', '')) if data.get('phone') else None
        } if len(errors) == 0 else None
    }
```

### Your Task
Create a composable validation system where validators can be combined.

### Requirements
- [ ] Create individual validator functions
- [ ] Build a validator composition system
- [ ] Make validators reusable across different contexts
- [ ] Create validators that can be chained together
- [ ] Support custom error messages
- [ ] Enable conditional validation

### Focus Areas
- Validator composition
- Error handling patterns
- Reusable validation logic
- Functional error accumulation

---

## Problem 3: Report Generation Pipeline

### Current Code (Java)
```java
// ❌ Complex report generation in single method
public class SalesReportGenerator {
    
    public String generateQuarterlyReport(List<Sale> sales, Quarter quarter, int year) {
        // Filter sales for quarter
        List<Sale> quarterSales = new ArrayList<>();
        for (Sale sale : sales) {
            Calendar cal = Calendar.getInstance();
            cal.setTime(sale.getDate());
            int saleYear = cal.get(Calendar.YEAR);
            int saleMonth = cal.get(Calendar.MONTH) + 1;
            
            int quarterStart = (quarter.getNumber() - 1) * 3 + 1;
            int quarterEnd = quarter.getNumber() * 3;
            
            if (saleYear == year && saleMonth >= quarterStart && saleMonth <= quarterEnd) {
                quarterSales.add(sale);
            }
        }
        
        // Group by product category
        Map<String, List<Sale>> categoryGroups = new HashMap<>();
        for (Sale sale : quarterSales) {
            String category = sale.getProduct().getCategory();
            categoryGroups.computeIfAbsent(category, k -> new ArrayList<>()).add(sale);
        }
        
        // Calculate metrics for each category
        Map<String, CategoryMetrics> categoryMetrics = new HashMap<>();
        for (Map.Entry<String, List<Sale>> entry : categoryGroups.entrySet()) {
            String category = entry.getKey();
            List<Sale> categorySales = entry.getValue();
            
            BigDecimal totalRevenue = BigDecimal.ZERO;
            int totalQuantity = 0;
            int uniqueCustomers = 0;
            Set<Integer> customerIds = new HashSet<>();
            
            for (Sale sale : categorySales) {
                totalRevenue = totalRevenue.add(sale.getAmount());
                totalQuantity += sale.getQuantity();
                customerIds.add(sale.getCustomerId());
            }
            uniqueCustomers = customerIds.size();
            
            BigDecimal averageOrderValue = customerIds.isEmpty() ? 
                BigDecimal.ZERO : totalRevenue.divide(BigDecimal.valueOf(customerIds.size()), 2, RoundingMode.HALF_UP);
            
            categoryMetrics.put(category, new CategoryMetrics(
                category, totalRevenue, totalQuantity, uniqueCustomers, averageOrderValue
            ));
        }
        
        // Calculate overall metrics
        BigDecimal overallRevenue = BigDecimal.ZERO;
        int overallQuantity = 0;
        Set<Integer> allCustomers = new HashSet<>();
        
        for (Sale sale : quarterSales) {
            overallRevenue = overallRevenue.add(sale.getAmount());
            overallQuantity += sale.getQuantity();
            allCustomers.add(sale.getCustomerId());
        }
        
        // Sort categories by revenue
        List<CategoryMetrics> sortedCategories = new ArrayList<>(categoryMetrics.values());
        sortedCategories.sort((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()));
        
        // Generate report
        StringBuilder report = new StringBuilder();
        report.append("QUARTERLY SALES REPORT\n");
        report.append("======================\n");
        report.append("Quarter: ").append(quarter).append(" ").append(year).append("\n\n");
        
        report.append("OVERALL SUMMARY\n");
        report.append("---------------\n");
        report.append("Total Revenue: $").append(overallRevenue).append("\n");
        report.append("Total Quantity Sold: ").append(overallQuantity).append("\n");
        report.append("Unique Customers: ").append(allCustomers.size()).append("\n");
        report.append("Average Order Value: $").append(
            allCustomers.isEmpty() ? BigDecimal.ZERO : 
            overallRevenue.divide(BigDecimal.valueOf(allCustomers.size()), 2, RoundingMode.HALF_UP)
        ).append("\n\n");
        
        report.append("CATEGORY BREAKDOWN\n");
        report.append("------------------\n");
        for (CategoryMetrics metrics : sortedCategories) {
            report.append("Category: ").append(metrics.getCategory()).append("\n");
            report.append("  Revenue: $").append(metrics.getTotalRevenue()).append("\n");
            report.append("  Quantity: ").append(metrics.getTotalQuantity()).append("\n");
            report.append("  Customers: ").append(metrics.getUniqueCustomers()).append("\n");
            report.append("  Avg Order Value: $").append(metrics.getAverageOrderValue()).append("\n\n");
        }
        
        // Add growth analysis
        // This would require previous quarter data - simplified for example
        report.append("GROWTH ANALYSIS\n");
        report.append("---------------\n");
        report.append("Note: Growth analysis requires historical data\n");
        
        return report.toString();
    }
}
```

### Your Task
Break this report generation into composable functions.

### Requirements
- [ ] Create data filtering functions
- [ ] Extract grouping and aggregation functions
- [ ] Build calculation functions for metrics
- [ ] Create formatting functions
- [ ] Compose these into a report generation pipeline
- [ ] Make the pipeline configurable for different report types

### Focus Areas
- Data transformation pipelines
- Function composition for complex operations
- Configurable processing chains
- Separation of data processing and formatting

---

## Problem 4: Configuration Builder Pattern

### Current Code (Python)
```python
# ❌ Complex configuration building
def create_database_config(env, database_type, options=None):
    if options is None:
        options = {}
    
    config = {}
    
    # Base configuration
    if env == 'development':
        config['host'] = options.get('host', 'localhost')
        config['port'] = options.get('port', 5432 if database_type == 'postgresql' else 3306)
        config['ssl'] = False
        config['pool_size'] = 5
        config['timeout'] = 30
    elif env == 'staging':
        config['host'] = options.get('host', 'staging-db.company.com')
        config['port'] = options.get('port', 5432 if database_type == 'postgresql' else 3306)
        config['ssl'] = True
        config['pool_size'] = 10
        config['timeout'] = 60
    elif env == 'production':
        if not options.get('host'):
            raise ValueError('Production host is required')
        config['host'] = options['host']
        config['port'] = options.get('port', 5432 if database_type == 'postgresql' else 3306)
        config['ssl'] = True
        config['pool_size'] = options.get('pool_size', 20)
        config['timeout'] = options.get('timeout', 120)
        config['retry_attempts'] = 3
        config['backup_host'] = options.get('backup_host')
    
    # Database-specific settings
    if database_type == 'postgresql':
        config['driver'] = 'postgresql+psycopg2'
        config['charset'] = 'utf8'
        config['client_encoding'] = 'UTF8'
        if env == 'production':
            config['connection_recycle'] = 3600
            config['echo'] = False
        else:
            config['echo'] = options.get('echo', True)
    elif database_type == 'mysql':
        config['driver'] = 'mysql+pymysql'
        config['charset'] = 'utf8mb4'
        config['autocommit'] = True
        if env == 'production':
            config['connection_recycle'] = 7200
            config['echo'] = False
        else:
            config['echo'] = options.get('echo', True)
    elif database_type == 'sqlite':
        if env == 'production':
            raise ValueError('SQLite not supported in production')
        config['driver'] = 'sqlite'
        config['database'] = options.get('database', 'app.db')
        config['echo'] = options.get('echo', True)
    
    # Security settings
    if config.get('ssl'):
        config['ssl_cert'] = options.get('ssl_cert')
        config['ssl_key'] = options.get('ssl_key')
        config['ssl_ca'] = options.get('ssl_ca')
        config['ssl_verify'] = options.get('ssl_verify', True)
    
    # Performance tuning
    if env == 'production':
        config['pool_pre_ping'] = True
        config['pool_recycle'] = 300
        config['max_overflow'] = 0
    
    # Monitoring and logging
    if options.get('enable_monitoring'):
        config['query_logging'] = True
        config['slow_query_threshold'] = options.get('slow_query_threshold', 1.0)
        config['metrics_collection'] = True
    
    # Build connection string
    if database_type != 'sqlite':
        username = options.get('username', 'app_user')
        password = options.get('password', '')
        if not password and env == 'production':
            raise ValueError('Production password is required')
        
        connection_string = f"{config['driver']}://{username}:{password}@{config['host']}:{config['port']}"
        if options.get('database'):
            connection_string += f"/{options['database']}"
    else:
        connection_string = f"sqlite:///{config['database']}"
    
    config['connection_string'] = connection_string
    
    return config
```

### Your Task
Create a composable configuration builder using function composition.

### Requirements
- [ ] Create small configuration functions
- [ ] Build a composition system for combining configurations
- [ ] Support conditional configuration application
- [ ] Make configuration functions reusable
- [ ] Create a fluent interface for building configurations
- [ ] Support configuration validation

### Focus Areas
- Builder pattern with functions
- Configuration composition
- Conditional application of settings
- Validation composition

---

## Problem 5: Mathematical Expression Evaluator

### Current Code (JavaScript)
```javascript
// ❌ Complex expression evaluation in one function
function evaluateExpression(expression, variables = {}) {
    // Tokenize
    const tokens = expression.match(/\d+\.?\d*|\w+|[+\-*/()]/g);
    if (!tokens) {
        throw new Error('Invalid expression');
    }
    
    // Replace variables
    const resolvedTokens = tokens.map(token => {
        if (/^\w+$/.test(token) && variables.hasOwnProperty(token)) {
            return variables[token].toString();
        }
        return token;
    });
    
    // Convert to postfix notation (Shunting Yard algorithm)
    const outputQueue = [];
    const operatorStack = [];
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
    const rightAssociative = {};
    
    for (let token of resolvedTokens) {
        if (/^\d+\.?\d*$/.test(token)) {
            outputQueue.push(parseFloat(token));
        } else if (token in precedence) {
            while (operatorStack.length > 0 && 
                   operatorStack[operatorStack.length - 1] !== '(' &&
                   (precedence[operatorStack[operatorStack.length - 1]] > precedence[token] ||
                    (precedence[operatorStack[operatorStack.length - 1]] === precedence[token] && 
                     !rightAssociative[token]))) {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
        } else if (token === '(') {
            operatorStack.push(token);
        } else if (token === ')') {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                outputQueue.push(operatorStack.pop());
            }
            if (operatorStack.length === 0) {
                throw new Error('Mismatched parentheses');
            }
            operatorStack.pop(); // Remove the '('
        } else {
            throw new Error('Unknown token: ' + token);
        }
    }
    
    while (operatorStack.length > 0) {
        if (operatorStack[operatorStack.length - 1] === '(' || 
            operatorStack[operatorStack.length - 1] === ')') {
            throw new Error('Mismatched parentheses');
        }
        outputQueue.push(operatorStack.pop());
    }
    
    // Evaluate postfix expression
    const stack = [];
    for (let token of outputQueue) {
        if (typeof token === 'number') {
            stack.push(token);
        } else {
            if (stack.length < 2) {
                throw new Error('Invalid expression');
            }
            const b = stack.pop();
            const a = stack.pop();
            
            let result;
            switch (token) {
                case '+':
                    result = a + b;
                    break;
                case '-':
                    result = a - b;
                    break;
                case '*':
                    result = a * b;
                    break;
                case '/':
                    if (b === 0) {
                        throw new Error('Division by zero');
                    }
                    result = a / b;
                    break;
                default:
                    throw new Error('Unknown operator: ' + token);
            }
            stack.push(result);
        }
    }
    
    if (stack.length !== 1) {
        throw new Error('Invalid expression');
    }
    
    return stack[0];
}
```

### Your Task
Break this expression evaluator into composable functions.

### Requirements
- [ ] Create tokenization functions
- [ ] Extract variable resolution functions
- [ ] Build postfix conversion functions
- [ ] Create evaluation functions
- [ ] Compose these into a complete evaluator
- [ ] Make each step independently testable

### Focus Areas
- Pipeline composition for complex algorithms
- Pure function extraction
- Step-by-step processing
- Error handling composition

---

## 🏆 Success Criteria

For each problem, your refactored solution should achieve:

### Composition Quality
- **Small Functions**: Each function has a single, clear responsibility
- **Pure Functions**: Functions don't have side effects where possible
- **Composability**: Functions can be easily combined in different ways
- **Reusability**: Functions can be used in multiple contexts

### Pipeline Design
- **Clear Data Flow**: How data moves through the pipeline is obvious
- **Modular Steps**: Each step can be modified independently
- **Error Handling**: Errors are handled consistently throughout the pipeline
- **Testability**: Each step can be tested in isolation

### Code Organization
- **Logical Grouping**: Related functions are organized together
- **Abstraction Levels**: Different levels of abstraction are clearly separated
- **Configurability**: Pipelines can be configured for different use cases
- **Documentation**: Function purpose and usage is clear

---

## 💡 Function Composition Patterns

### **1. Pipeline Pattern**
```javascript
// Basic pipeline
const pipeline = (...functions) => (input) => 
    functions.reduce((result, fn) => fn(result), input);

// Usage
const processUser = pipeline(
    validateUser,
    normalizeUser,
    calculateDerivedFields,
    formatForOutput
);

const result = processUser(userData);
```

### **2. Higher-Order Functions**
```javascript
// Map/Filter/Reduce composition
const processUsers = (users) => 
    users
        .filter(isValidUser)
        .map(normalizeUser)
        .map(addDerivedFields)
        .sort(byMembershipLevel);

// Custom higher-order functions
const withLogging = (fn) => (...args) => {
    console.log(`Calling ${fn.name} with`, args);
    const result = fn(...args);
    console.log(`Result:`, result);
    return result;
};

const loggedValidator = withLogging(validateEmail);
```

### **3. Currying for Composition**
```javascript
// Curried functions for easier composition
const filterBy = (predicate) => (array) => array.filter(predicate);
const mapWith = (transform) => (array) => array.map(transform);
const sortBy = (compareFn) => (array) => [...array].sort(compareFn);

// Compose with curried functions
const processData = pipeline(
    filterBy(isActive),
    mapWith(normalize),
    sortBy(byDate)
);
```

### **4. Validator Composition**
```javascript
const compose = (...validators) => (value) => {
    const errors = [];
    for (const validator of validators) {
        const result = validator(value);
        if (!result.isValid) {
            errors.push(...result.errors);
        }
    }
    return { isValid: errors.length === 0, errors };
};

const emailValidator = compose(
    required('Email is required'),
    format(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'),
    maxLength(254, 'Email too long')
);
```

### **5. Configuration Builder**
```javascript
const configBuilder = (base = {}) => ({
    with: (key, value) => configBuilder({ ...base, [key]: value }),
    when: (condition, fn) => condition ? fn(configBuilder(base)) : configBuilder(base),
    build: () => base
});

// Usage
const config = configBuilder()
    .with('host', 'localhost')
    .with('port', 5432)
    .when(isProd, builder => builder.with('ssl', true))
    .build();
```

---

## 🔧 Common Composition Challenges & Solutions

### **Challenge: Error Handling in Pipelines**
```javascript
// ❌ Errors break the pipeline
const pipeline = (...fns) => (input) => 
    fns.reduce((result, fn) => fn(result), input);

// ✅ Safe pipeline with error handling
const safePipeline = (...fns) => (input) => {
    try {
        return fns.reduce((result, fn) => {
            if (result.error) return result;
            try {
                return { value: fn(result.value || result), error: null };
            } catch (error) {
                return { value: null, error };
            }
        }, { value: input, error: null });
    } catch (error) {
        return { value: null, error };
    }
};
```

### **Challenge: Conditional Composition**
```javascript
// Conditional function application
const when = (condition) => (fn) => (input) => 
    condition(input) ? fn(input) : input;

const unless = (condition) => (fn) => (input) => 
    !condition(input) ? fn(input) : input;

// Usage
const processUser = pipeline(
    validateUser,
    when(isNewUser)(sendWelcomeEmail),
    unless(isEmailVerified)(requireEmailVerification),
    saveUser
);
```

### **Challenge: Async Function Composition**
```javascript
// Async pipeline
const asyncPipeline = (...fns) => async (input) => {
    let result = input;
    for (const fn of fns) {
        result = await fn(result);
    }
    return result;
};

// Usage
const processOrderAsync = asyncPipeline(
    validateOrder,
    checkInventory,
    processPayment,
    updateInventory,
    sendConfirmation
);
```

---

## 🎯 Self-Assessment

After completing each problem, evaluate your solution:

### **Composition Quality (1-5 scale)**
- [ ] **Function Size**: Are individual functions small and focused?
- [ ] **Pure Functions**: Are functions free of side effects where possible?
- [ ] **Composability**: Can functions be easily combined in different ways?
- [ ] **Reusability**: Can functions be used in multiple contexts?

### **Pipeline Design (1-5 scale)**
- [ ] **Data Flow**: Is the flow of data through the pipeline clear?
- [ ] **Modularity**: Can individual steps be modified independently?
- [ ] **Error Handling**: Are errors handled consistently?
- [ ] **Testability**: Can each step be tested in isolation?

**Target**: All scores should be 4 or 5. If any score is 3 or below, reconsider your composition strategy.

---

## 🚀 Next Steps

Once you've completed all problems:

1. **Review the [solutions file](./exercise-4-solutions.md)** to see different composition approaches
2. **Practice with your code** - Look for opportunities to compose functions in your projects
3. **Explore functional libraries** - Consider libraries like Ramda, Lodash/FP, or RxJS for advanced composition
4. **Move to [Exercise 5: Real-World Refactoring](./exercise-5-refactoring.md)** - Apply all function principles to complex legacy code

Remember: Function composition is about building complex behavior from simple, reliable pieces. Master the art of creating small, focused functions that work together harmoniously!
