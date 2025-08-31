# Exercise 1: Variable Naming Practice

Transform poorly named variables into clear, intention-revealing names that make code self-documenting.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Recognize common variable naming problems
- Apply intention-revealing naming principles
- Understand the impact of good names on code readability
- Practice creating searchable, pronounceable variable names

## 📝 Exercise Format

Each problem presents poorly named variables in a realistic code context. Your job is to rename them following clean code principles.

---

## Problem 1: E-commerce Shopping Cart

### Current Code (JavaScript)
```javascript
// ❌ Poor variable names
let u = getCurrentUser();
let c = getCart(u.id);
let t = 0;
let s = 0.08; // sales tax rate
let d = 50; // free shipping threshold

for (let i of c.items) {
    t += i.p * i.q;
}

let tax = t * s;
let total = t + tax;
let fs = t >= d;

if (fs) {
    displayMessage("Free shipping!");
} else {
    let needed = d - t;
    displayMessage(`Add $${needed} for free shipping`);
}
```

### Your Task
Rename all variables to be clear and meaningful. Focus on:
- What each variable represents
- Eliminating abbreviations
- Making the code self-documenting

### Requirements
- [ ] All single-letter variables should be renamed (except loop counter if appropriate)
- [ ] Abbreviations should be spelled out
- [ ] Variable purposes should be clear without comments
- [ ] Names should be searchable and pronounceable

### Hints
- Think about the business domain (e-commerce)
- Consider what each calculation represents
- Use full words instead of abbreviations
- Make boolean variables clearly yes/no questions

---

## Problem 2: User Authentication System

### Current Code (Python)
```python
# ❌ Poor variable names
def login(creds):
    un = creds['username']
    pw = creds['password']
    
    usr = db.find_user(un)
    if not usr:
        return {'success': False, 'err': 'User not found'}
    
    hashed = hash_password(pw)
    if usr['pw_hash'] != hashed:
        usr['failed_attempts'] += 1
        if usr['failed_attempts'] >= 3:
            usr['locked'] = True
            db.save(usr)
        return {'success': False, 'err': 'Invalid password'}
    
    usr['last_login'] = datetime.now()
    usr['failed_attempts'] = 0
    token = generate_token(usr['id'])
    
    return {'success': True, 'token': token, 'usr': usr}
```

### Your Task
Improve variable names in this authentication function.

### Requirements
- [ ] Parameter names should be descriptive
- [ ] Local variables should reveal their purpose
- [ ] Database field references should be clear
- [ ] Return values should be self-explanatory

### Focus Areas
- Authentication domain vocabulary
- Security-related concepts
- Database field naming
- API response structure

---

## Problem 3: Data Processing Pipeline

### Current Code (Java)
```java
// ❌ Poor variable names
public class DataProcessor {
    private int limit = 100;
    private double threshold = 0.95;
    
    public List<Record> process(List<RawData> input) {
        List<Record> output = new ArrayList<>();
        int count = 0;
        
        for (RawData rd : input) {
            if (count >= limit) break;
            
            double score = calculateScore(rd);
            if (score >= threshold) {
                Record r = new Record();
                r.setId(rd.getId());
                r.setScore(score);
                r.setProcessedAt(new Date());
                output.add(r);
                count++;
            }
        }
        
        return output;
    }
    
    private double calculateScore(RawData data) {
        return data.getValue() * data.getWeight() * data.getMultiplier();
    }
}
```

### Your Task
Rename variables to clarify this data processing workflow.

### Requirements
- [ ] Class-level constants should indicate their purpose
- [ ] Loop variables should be meaningful
- [ ] Processed data should have clear names
- [ ] Method parameters should be descriptive

### Focus Areas
- Data processing terminology
- Filtering and transformation concepts
- Quality thresholds and limits
- Business logic clarity

---

## Problem 4: Financial Calculations

### Current Code (Python)
```python
# ❌ Poor variable names
def calc(amt, rate, years):
    m = rate / 12
    n = years * 12
    
    if m == 0:
        return amt / n
    
    numerator = amt * m * (1 + m) ** n
    denominator = (1 + m) ** n - 1
    payment = numerator / denominator
    
    total = payment * n
    interest = total - amt
    
    return {
        'payment': payment,
        'total': total,
        'interest': interest
    }
```

### Your Task
Transform this financial calculation function with meaningful names.

### Requirements
- [ ] Function name should indicate what it calculates
- [ ] Parameters should use financial terminology
- [ ] Mathematical variables should be clearly named
- [ ] Return values should be self-explanatory

### Focus Areas
- Financial/mortgage terminology
- Mathematical concepts
- Time periods and rates
- Clear API design

---

## Problem 5: Game State Management

### Current Code (JavaScript)
```javascript
// ❌ Poor variable names
class Game {
    constructor() {
        this.p = [];
        this.turn = 0;
        this.board = Array(9).fill(null);
        this.winner = null;
        this.moves = 0;
        this.maxMoves = 9;
    }
    
    makeMove(pos, symbol) {
        if (this.board[pos] || this.winner) return false;
        
        this.board[pos] = symbol;
        this.moves++;
        
        if (this.checkWin(symbol)) {
            this.winner = symbol;
            return true;
        }
        
        if (this.moves === this.maxMoves) {
            this.winner = 'tie';
            return true;
        }
        
        this.turn = (this.turn + 1) % 2;
        return true;
    }
    
    checkWin(sym) {
        const wins = [
            [0,1,2], [3,4,5], [6,7,8], // rows
            [0,3,6], [1,4,7], [2,5,8], // cols
            [0,4,8], [2,4,6] // diagonals
        ];
        
        return wins.some(combo => 
            combo.every(pos => this.board[pos] === sym)
        );
    }
}
```

### Your Task
Rename variables to make this game logic clear and readable.

### Requirements
- [ ] Game state variables should be descriptive
- [ ] Method parameters should indicate their role
- [ ] Game logic should be self-documenting
- [ ] Constants should explain their purpose

### Focus Areas
- Game terminology
- State management concepts
- Player interactions
- Win condition logic

---

## 🏆 Success Criteria

For each problem, your solution should achieve:

### Readability Test
- Someone unfamiliar with the code can understand what each variable represents
- The code reads almost like natural language
- Comments are rarely needed to explain variable purposes

### Searchability Test
- Variables can be easily found when searching the codebase
- Names are specific enough to return relevant results
- No conflicts with common programming terms

### Consistency Test
- Similar concepts use similar naming patterns
- Domain terminology is used consistently
- Naming conventions are applied uniformly

### Maintainability Test
- Variable purposes remain clear as code evolves
- New team members can quickly understand the code
- Refactoring is easier because intent is clear

---

## 💡 Hints and Strategies

### General Approach
1. **Identify the domain** - What business or technical domain does this code serve?
2. **List the concepts** - What real-world things do these variables represent?
3. **Use domain language** - Prefer business terms over technical jargon when appropriate
4. **Be specific** - `userAccount` is better than `account` if the context allows
5. **Test pronunciation** - Can you easily say the name in conversation?

### Common Patterns
- **Counts**: `itemCount`, `userCount`, not just `count`
- **Flags**: `isValid`, `hasPermission`, `canAccess`
- **Collections**: `activeUsers`, `pendingOrders`, `completedTasks`
- **Calculations**: `totalPrice`, `monthlyPayment`, `taxAmount`
- **Thresholds**: `minimumAge`, `maximumRetries`, `freeShippingThreshold`

### Domain-Specific Tips

**E-commerce**: Use terms like `cart`, `checkout`, `shipping`, `discount`
**Authentication**: Use terms like `credentials`, `token`, `session`, `permissions`
**Financial**: Use terms like `principal`, `interest`, `payment`, `balance`
**Gaming**: Use terms like `player`, `turn`, `score`, `level`

---

## 🎯 Self-Assessment

After completing each problem, rate your solution (1-5 scale):

- **Clarity**: How clear are the variable names?
- **Consistency**: How consistent is the naming pattern?
- **Searchability**: How easy would it be to find these variables?
- **Domain Appropriateness**: How well do names fit the business domain?

**Target**: All scores should be 4 or 5. If any score is 3 or below, revise your solution.

---

## 🚀 Next Steps

Once you've completed all problems:

1. **Review the [solutions file](./exercise-1-solutions.md)** to compare approaches
2. **Apply learnings to your current code** - Find similar naming issues in your projects
3. **Move to [Exercise 2: Functions](./exercise-2-functions.md)** to practice function naming
4. **Create your own examples** - Find poorly named variables in open source projects

Remember: Great variable names are the foundation of clean, maintainable code. Take your time and choose names that will make sense to your future self and your teammates!
