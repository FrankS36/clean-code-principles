# Exercise 3: Liskov Substitution Principle (LSP)

Master the Liskov Substitution Principle by learning to design inheritance hierarchies where derived classes can be used interchangeably with their base classes without breaking functionality.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Recognize violations of the Liskov Substitution Principle
- Understand the difference between "is-a" relationships and proper substitutability
- Design inheritance hierarchies that honor behavioral contracts
- Apply composition over inheritance where appropriate
- Create robust polymorphic designs that don't break when extended
- Practice contract-driven design with preconditions and postconditions

## 📝 Exercise Format

Each problem presents an inheritance hierarchy that violates LSP. Your job is to identify the violations and refactor the design to ensure proper substitutability while maintaining functionality.

---

## Problem 1: Shape Hierarchy

### Current Code (Java)
```java
// ❌ Violates LSP - rectangles and squares have different behavioral contracts
public class Rectangle {
    protected double width;
    protected double height;
    
    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }
    
    public double getWidth() {
        return width;
    }
    
    public void setWidth(double width) {
        this.width = width;
    }
    
    public double getHeight() {
        return height;
    }
    
    public void setHeight(double height) {
        this.height = height;
    }
    
    public double getArea() {
        return width * height;
    }
    
    public double getPerimeter() {
        return 2 * (width + height);
    }
    
    public boolean isSquare() {
        return width == height;
    }
    
    @Override
    public String toString() {
        return String.format("Rectangle(%.2f x %.2f)", width, height);
    }
}

public class Square extends Rectangle {
    
    public Square(double side) {
        super(side, side);
    }
    
    // ❌ LSP Violation: Changes behavior of base class methods
    @Override
    public void setWidth(double width) {
        this.width = width;
        this.height = width; // Force height to match width
    }
    
    @Override
    public void setHeight(double height) {
        this.width = height; // Force width to match height
        this.height = height;
    }
    
    public void setSide(double side) {
        setWidth(side);
    }
    
    public double getSide() {
        return width; // Assuming width == height
    }
    
    @Override
    public String toString() {
        return String.format("Square(%.2f)", width);
    }
}

// Client code that breaks when using Square as Rectangle
public class GeometryCalculator {
    
    public double calculateRectangleArea(Rectangle rectangle) {
        // This method expects Rectangle behavior
        double originalWidth = rectangle.getWidth();
        double originalHeight = rectangle.getHeight();
        
        // This fails for Square because setting width also changes height
        rectangle.setWidth(10);
        rectangle.setHeight(5);
        
        double area = rectangle.getArea();
        
        // Try to restore original dimensions - doesn't work for Square
        rectangle.setWidth(originalWidth);
        rectangle.setHeight(originalHeight);
        
        return area;
    }
    
    public void demonstrateLSPViolation() {
        Rectangle rect = new Rectangle(3, 4);
        System.out.println("Rectangle test:");
        System.out.println("Original: " + rect);
        double rectArea = calculateRectangleArea(rect);
        System.out.println("Calculated area: " + rectArea + " (expected: 50)");
        System.out.println("After calculation: " + rect);
        
        System.out.println("\nSquare test:");
        Rectangle square = new Square(3); // Using Square as Rectangle
        System.out.println("Original: " + square);
        double squareArea = calculateRectangleArea(square);
        System.out.println("Calculated area: " + squareArea + " (expected: 50, actual: 25)");
        System.out.println("After calculation: " + square);
    }
    
    public double scaleRectangle(Rectangle rectangle, double scaleFactor) {
        // Another method that expects Rectangle behavior
        double newWidth = rectangle.getWidth() * scaleFactor;
        double newHeight = rectangle.getHeight() * scaleFactor;
        
        rectangle.setWidth(newWidth);
        rectangle.setHeight(newHeight);
        
        return rectangle.getArea();
    }
    
    public boolean isProportional(Rectangle rect1, Rectangle rect2) {
        // Check if two rectangles have the same width/height ratio
        double ratio1 = rect1.getWidth() / rect1.getHeight();
        double ratio2 = rect2.getWidth() / rect2.getHeight();
        
        return Math.abs(ratio1 - ratio2) < 0.001;
    }
}

// Another problematic client
public class RectangleManipulator {
    
    public void adjustDimensions(Rectangle rectangle, double targetWidth, double targetHeight) {
        // This method assumes independent width and height
        rectangle.setWidth(targetWidth);
        rectangle.setHeight(targetHeight);
        
        // Postcondition violated for Square
        assert rectangle.getWidth() == targetWidth : "Width not set correctly";
        assert rectangle.getHeight() == targetHeight : "Height not set correctly";
    }
    
    public Rectangle createSimilarRectangle(Rectangle original, double scaleFactor) {
        // Create a new rectangle with scaled dimensions
        double newWidth = original.getWidth() * scaleFactor;
        double newHeight = original.getHeight() * scaleFactor;
        
        Rectangle similar = new Rectangle(newWidth, newHeight);
        
        // This assumption fails for Square
        boolean maintainsShape = isProportional(original, similar);
        assert maintainsShape : "Shape proportions not maintained";
        
        return similar;
    }
    
    private boolean isProportional(Rectangle rect1, Rectangle rect2) {
        if (rect1.getWidth() == 0 || rect1.getHeight() == 0 || 
            rect2.getWidth() == 0 || rect2.getHeight() == 0) {
            return false;
        }
        
        double ratio1 = rect1.getWidth() / rect1.getHeight();
        double ratio2 = rect2.getWidth() / rect2.getHeight();
        
        return Math.abs(ratio1 - ratio2) < 0.001;
    }
    
    public void demonstrateMoreViolations() {
        System.out.println("=== Rectangle Manipulation Tests ===");
        
        Rectangle rect = new Rectangle(4, 6);
        System.out.println("Rectangle: " + rect);
        adjustDimensions(rect, 8, 3);
        System.out.println("After adjustment: " + rect + " (expected: 8x3)");
        
        System.out.println("\nSquare test (should fail):");
        Rectangle square = new Square(5);
        System.out.println("Square: " + square);
        
        try {
            adjustDimensions(square, 8, 3); // This will violate assertions
            System.out.println("After adjustment: " + square + " (expected: 8x3, actual: 3x3)");
        } catch (AssertionError e) {
            System.out.println("Assertion failed: " + e.getMessage());
        }
    }
}

// Usage demonstration
public class LSPDemo {
    public static void main(String[] args) {
        GeometryCalculator calculator = new GeometryCalculator();
        calculator.demonstrateLSPViolation();
        
        RectangleManipulator manipulator = new RectangleManipulator();
        manipulator.demonstrateMoreViolations();
        
        // More subtle violations
        demonstrateSubtleViolations();
    }
    
    public static void demonstrateSubtleViolations() {
        System.out.println("\n=== Subtle LSP Violations ===");
        
        // Test 1: Method contracts
        Rectangle rect = new Rectangle(3, 4);
        Rectangle square = new Square(3);
        
        System.out.println("Rectangle before setWidth(5): " + rect);
        rect.setWidth(5);
        System.out.println("Rectangle after setWidth(5): " + rect + " (height unchanged: " + (rect.getHeight() == 4) + ")");
        
        System.out.println("Square before setWidth(5): " + square);
        square.setWidth(5);
        System.out.println("Square after setWidth(5): " + square + " (height changed: " + (square.getHeight() == 5) + ")");
        
        // Test 2: Invariant violations
        Rectangle rect2 = new Rectangle(2, 8);
        Rectangle square2 = new Square(4);
        
        double rectRatio = rect2.getWidth() / rect2.getHeight();
        double squareRatio = square2.getWidth() / square2.getHeight();
        
        System.out.println("\nRectangle ratio: " + rectRatio);
        System.out.println("Square ratio: " + squareRatio + " (always 1.0)");
        
        rect2.setWidth(6);
        square2.setWidth(6);
        
        double newRectRatio = rect2.getWidth() / rect2.getHeight();
        double newSquareRatio = square2.getWidth() / square2.getHeight();
        
        System.out.println("Rectangle ratio after setWidth(6): " + newRectRatio + " (changed)");
        System.out.println("Square ratio after setWidth(6): " + newSquareRatio + " (always 1.0)");
    }
}
```

### Your Task
Fix the LSP violations in this shape hierarchy.

### Requirements
- [ ] **Identify LSP violations** - where does Square break Rectangle's contract?
- [ ] **Analyze behavioral contracts** - what promises does Rectangle make that Square breaks?
- [ ] **Design proper hierarchy** - create a design where substitution works correctly
- [ ] **Consider composition** - evaluate if inheritance is the right approach
- [ ] **Maintain functionality** - all geometric calculations should still work
- [ ] **Test substitutability** - demonstrate that any shape can be used polymorphically

### LSP Violations to Address
1. **Precondition strengthening**: Square requires width == height
2. **Postcondition weakening**: Setting width also changes height in Square
3. **Invariant changes**: Square maintains width == height, Rectangle doesn't
4. **Behavioral differences**: Same method calls produce different side effects

### Focus Areas
- Contract design and documentation
- Inheritance vs. composition decisions
- Interface segregation
- Behavioral substitutability

---

## Problem 2: Bird Hierarchy

### Current Code (Python)
```python
# ❌ Violates LSP - not all birds can fly
from abc import ABC, abstractmethod
import math

class Bird(ABC):
    def __init__(self, name, species, weight, wingspan=None):
        self.name = name
        self.species = species
        self.weight = weight  # in grams
        self.wingspan = wingspan  # in cm
        self.energy = 100  # energy level 0-100
        self.altitude = 0  # current altitude in meters
        self.position = [0, 0]  # x, y coordinates
    
    def eat(self, food_amount):
        """All birds can eat"""
        self.energy = min(100, self.energy + food_amount * 10)
        return f"{self.name} is eating."
    
    def sleep(self):
        """All birds can sleep"""
        self.energy = 100
        return f"{self.name} is sleeping."
    
    def make_sound(self):
        """All birds can make sounds"""
        return f"{self.name} makes a sound."
    
    # ❌ Not all birds can perform these actions
    def fly(self, distance, altitude):
        """All birds should be able to fly"""
        if self.energy < 20:
            raise ValueError(f"{self.name} is too tired to fly")
        
        if self.wingspan is None:
            raise ValueError(f"{self.name} has no wingspan data")
        
        # Calculate energy cost based on distance and weight
        energy_cost = (distance * self.weight) / (self.wingspan * 10)
        
        if energy_cost > self.energy:
            raise ValueError(f"{self.name} doesn't have enough energy")
        
        self.energy -= energy_cost
        self.altitude = altitude
        self.position[0] += distance * 0.7  # Simplified movement
        self.position[1] += distance * 0.3
        
        return f"{self.name} flies {distance}m to altitude {altitude}m"
    
    def take_off(self):
        """All birds should be able to take off"""
        if self.altitude > 0:
            return f"{self.name} is already airborne"
        
        if self.energy < 30:
            raise ValueError(f"{self.name} is too tired to take off")
        
        self.energy -= 15
        self.altitude = 10
        return f"{self.name} takes off and reaches 10m altitude"
    
    def land(self):
        """All birds should be able to land"""
        if self.altitude == 0:
            return f"{self.name} is already on the ground"
        
        self.altitude = 0
        return f"{self.name} lands safely"
    
    def migrate(self, destination, distance):
        """All birds should be able to migrate"""
        if distance > 1000:
            # Long distance migration
            if self.energy < 80:
                raise ValueError(f"{self.name} needs more energy for long migration")
            
            # Multiple flight segments
            segments = math.ceil(distance / 500)
            for i in range(segments):
                segment_distance = min(500, distance - i * 500)
                self.fly(segment_distance, 1000)
                if i < segments - 1:  # Rest between segments
                    self.land()
                    self.energy += 20  # Partial rest
        else:
            self.fly(distance, 500)
        
        return f"{self.name} migrates to {destination}"
    
    def get_flight_status(self):
        """Get current flight information"""
        status = "grounded" if self.altitude == 0 else "flying"
        return {
            "status": status,
            "altitude": self.altitude,
            "position": self.position.copy(),
            "energy": self.energy
        }

class Eagle(Bird):
    def __init__(self, name):
        super().__init__(name, "Bald Eagle", 4500, 220)  # 4.5kg, 2.2m wingspan
    
    def make_sound(self):
        return f"{self.name} screeches loudly!"
    
    def hunt(self, prey):
        """Eagles can hunt"""
        if self.altitude < 100:
            return f"{self.name} needs to be higher to hunt effectively"
        
        self.energy -= 25
        return f"{self.name} swoops down and catches {prey}"
    
    def soar(self, duration):
        """Eagles can soar using thermals"""
        if self.altitude < 50:
            return f"{self.name} needs to gain altitude first"
        
        # Soaring uses less energy than active flight
        energy_cost = duration * 0.5
        self.energy -= energy_cost
        return f"{self.name} soars for {duration} minutes"

class Sparrow(Bird):
    def __init__(self, name):
        super().__init__(name, "House Sparrow", 30, 24)  # 30g, 24cm wingspan
    
    def make_sound(self):
        return f"{self.name} chirps sweetly!"
    
    def hop(self, distance):
        """Sparrows often hop on the ground"""
        self.position[0] += distance * 0.8
        self.position[1] += distance * 0.2
        self.energy -= 2
        return f"{self.name} hops {distance}cm"

class Penguin(Bird):
    def __init__(self, name):
        # ❌ LSP Violation: Penguins can't fly but inherit flying methods
        super().__init__(name, "Emperor Penguin", 22000, None)  # 22kg, no functional wingspan
        self.swimming_speed = 8  # km/h
        self.diving_depth = 0
    
    def make_sound(self):
        return f"{self.name} trumpets loudly!"
    
    # ❌ LSP Violation: Must override flying methods to prevent usage
    def fly(self, distance, altitude):
        raise NotImplementedError("Penguins cannot fly!")
    
    def take_off(self):
        raise NotImplementedError("Penguins cannot take off!")
    
    def migrate(self, destination, distance):
        # Penguins migrate by walking/swimming, not flying
        return self.swim_migrate(destination, distance)
    
    def swim(self, distance):
        """Penguins are excellent swimmers"""
        energy_cost = distance * 0.1  # Swimming is efficient for penguins
        if energy_cost > self.energy:
            raise ValueError(f"{self.name} is too tired to swim")
        
        self.energy -= energy_cost
        self.position[0] += distance * 0.9
        self.position[1] += distance * 0.1
        return f"{self.name} swims {distance}m"
    
    def dive(self, depth):
        """Penguins can dive deep"""
        if depth > 500:
            raise ValueError(f"Too deep! {self.name} can't dive below 500m")
        
        self.diving_depth = depth
        self.energy -= depth * 0.1
        return f"{self.name} dives to {depth}m depth"
    
    def swim_migrate(self, destination, distance):
        """Penguins migrate by swimming"""
        if distance > 2000:
            # Long distance swimming migration
            segments = math.ceil(distance / 1000)
            for i in range(segments):
                segment_distance = min(1000, distance - i * 1000)
                self.swim(segment_distance)
                if i < segments - 1:
                    self.energy += 30  # Rest on ice floe
        else:
            self.swim(distance)
        
        return f"{self.name} swims to {destination}"

class Ostrich(Bird):
    def __init__(self, name):
        # ❌ LSP Violation: Ostriches can't fly but inherit flying methods
        super().__init__(name, "Ostrich", 120000, 200)  # 120kg, wings present but non-functional
        self.running_speed = 70  # km/h
    
    def make_sound(self):
        return f"{self.name} booms loudly!"
    
    # ❌ LSP Violation: Must override flying methods
    def fly(self, distance, altitude):
        raise NotImplementedError("Ostriches cannot fly!")
    
    def take_off(self):
        raise NotImplementedError("Ostriches cannot take off!")
    
    def migrate(self, destination, distance):
        # Ostriches migrate by running
        return self.run_migrate(destination, distance)
    
    def run(self, distance):
        """Ostriches are fast runners"""
        energy_cost = distance * 0.3
        if energy_cost > self.energy:
            raise ValueError(f"{self.name} is too tired to run")
        
        self.energy -= energy_cost
        self.position[0] += distance * 0.95
        self.position[1] += distance * 0.05
        return f"{self.name} runs {distance}m at high speed"
    
    def kick(self, threat):
        """Ostriches have powerful kicks"""
        self.energy -= 10
        return f"{self.name} kicks at {threat} with powerful legs!"
    
    def run_migrate(self, destination, distance):
        """Ostriches migrate by running"""
        if distance > 500:
            # Long distance running
            segments = math.ceil(distance / 200)
            for i in range(segments):
                segment_distance = min(200, distance - i * 200)
                self.run(segment_distance)
                if i < segments - 1:
                    self.energy += 25  # Rest
        else:
            self.run(distance)
        
        return f"{self.name} runs to {destination}"

# Client code that demonstrates LSP violations
class BirdWatcher:
    def __init__(self):
        self.birds = []
    
    def add_bird(self, bird):
        self.birds.append(bird)
    
    def observe_flight_patterns(self):
        """This method breaks when called with non-flying birds"""
        print("=== Observing Flight Patterns ===")
        
        for bird in self.birds:
            try:
                print(f"\nObserving {bird.name}:")
                print(bird.take_off())
                print(bird.fly(100, 50))
                print(bird.soar(5) if hasattr(bird, 'soar') else "No soaring capability")
                print(bird.land())
                
                flight_status = bird.get_flight_status()
                print(f"Flight status: {flight_status}")
                
            except (NotImplementedError, AttributeError) as e:
                print(f"❌ {bird.name} cannot perform flight operations: {e}")
            except ValueError as e:
                print(f"❌ Flight error for {bird.name}: {e}")
    
    def organize_migration(self, destination="South", distance=1500):
        """This method fails for non-flying birds"""
        print(f"\n=== Organizing Migration to {destination} ({distance}km) ===")
        
        for bird in self.birds:
            try:
                print(f"\n{bird.name} migration:")
                result = bird.migrate(destination, distance)
                print(result)
                
                status = bird.get_flight_status()
                print(f"Status: {status['status']} at {status['altitude']}m")
                
            except NotImplementedError as e:
                print(f"❌ {bird.name} cannot migrate using standard method: {e}")
            except ValueError as e:
                print(f"❌ Migration error for {bird.name}: {e}")
    
    def conduct_flight_training(self):
        """Training session that assumes all birds can fly"""
        print("\n=== Flight Training Session ===")
        
        for bird in self.birds:
            try:
                print(f"\nTraining {bird.name}:")
                
                # Basic flight drills
                print("1. Take off drill:")
                print(bird.take_off())
                
                print("2. Short flight drill:")
                print(bird.fly(50, 25))
                
                print("3. Altitude change drill:")
                print(bird.fly(30, 75))
                
                print("4. Landing drill:")
                print(bird.land())
                
                print(f"Training complete! Energy remaining: {bird.energy}")
                
            except NotImplementedError as e:
                print(f"❌ {bird.name} cannot participate in flight training: {e}")
            except ValueError as e:
                print(f"❌ Training error for {bird.name}: {e}")

# Demonstration of LSP violations
def demonstrate_lsp_violations():
    watcher = BirdWatcher()
    
    # Add various birds
    watcher.add_bird(Eagle("Baldy"))
    watcher.add_bird(Sparrow("Pip"))
    watcher.add_bird(Penguin("Waddles"))  # ❌ This will cause problems
    watcher.add_bird(Ostrich("Strider"))  # ❌ This will also cause problems
    
    # These methods expect all birds to be substitutable
    watcher.observe_flight_patterns()
    watcher.organize_migration()
    watcher.conduct_flight_training()

# Additional demonstration of contract violations
class AdvancedBirdOperations:
    @staticmethod
    def compare_flight_efficiency(bird1, bird2, distance=100):
        """Compare flight efficiency between two birds"""
        print(f"\nComparing flight efficiency: {bird1.name} vs {bird2.name}")
        
        try:
            # Record initial energy
            initial_energy1 = bird1.energy
            initial_energy2 = bird2.energy
            
            # Perform identical flight operations
            bird1.take_off()
            bird1.fly(distance, 100)
            bird1.land()
            
            bird2.take_off()
            bird2.fly(distance, 100)
            bird2.land()
            
            # Calculate efficiency
            energy_used1 = initial_energy1 - bird1.energy
            energy_used2 = initial_energy2 - bird2.energy
            
            efficiency1 = distance / energy_used1 if energy_used1 > 0 else float('inf')
            efficiency2 = distance / energy_used2 if energy_used2 > 0 else float('inf')
            
            print(f"{bird1.name} efficiency: {efficiency1:.2f} m/energy")
            print(f"{bird2.name} efficiency: {efficiency2:.2f} m/energy")
            
            winner = bird1.name if efficiency1 > efficiency2 else bird2.name
            print(f"More efficient: {winner}")
            
        except (NotImplementedError, ValueError) as e:
            print(f"❌ Cannot compare flight efficiency: {e}")
    
    @staticmethod
    def aerial_formation(birds, formation_distance=50):
        """Have birds fly in formation"""
        print(f"\nForming aerial formation with {len(birds)} birds:")
        
        try:
            # All birds take off
            for bird in birds:
                print(bird.take_off())
            
            # Fly in formation
            for i, bird in enumerate(birds):
                altitude = 100 + (i * 20)  # Staggered altitudes
                print(bird.fly(formation_distance, altitude))
            
            print("Formation flying complete!")
            
            # All birds land
            for bird in birds:
                print(bird.land())
                
        except (NotImplementedError, ValueError) as e:
            print(f"❌ Formation flying failed: {e}")

if __name__ == "__main__":
    demonstrate_lsp_violations()
    
    # Additional tests
    print("\n" + "="*50)
    print("ADVANCED OPERATIONS TESTS")
    print("="*50)
    
    eagle = Eagle("Sky")
    sparrow = Sparrow("Chip")
    penguin = Penguin("Ice")
    ostrich = Ostrich("Runner")
    
    ops = AdvancedBirdOperations()
    
    # These should work
    ops.compare_flight_efficiency(eagle, sparrow)
    
    # These will fail due to LSP violations
    ops.compare_flight_efficiency(eagle, penguin)
    ops.aerial_formation([eagle, sparrow, penguin, ostrich])
```

### Your Task
Fix the LSP violations in this bird hierarchy.

### Requirements
- [ ] **Identify behavioral contracts** - what behaviors does Bird promise that some birds can't fulfill?
- [ ] **Redesign the hierarchy** - create interfaces/classes that support proper substitution
- [ ] **Handle non-flying birds** - design a solution that accommodates birds that can't fly
- [ ] **Maintain polymorphism** - clients should still be able to work with birds generically
- [ ] **Consider interface segregation** - separate flying, swimming, and running behaviors
- [ ] **Test substitutability** - ensure any bird type can be used where Bird is expected

### LSP Violations to Address
1. **Method availability**: Not all birds can fly/take_off/migrate by air
2. **Behavioral differences**: Some birds migrate by swimming/running instead of flying
3. **Precondition violations**: Flying methods expect wingspan and energy for flight
4. **Exception throwing**: Non-flying birds throw exceptions for flying operations

### Focus Areas
- Interface segregation for behaviors
- Composition over inheritance
- Behavioral contracts and documentation
- Polymorphic design that accommodates all bird types

---

## Problem 3: Account Hierarchy

### Current Code (C#)
```csharp
// ❌ Violates LSP - different account types have incompatible withdrawal rules
using System;
using System.Collections.Generic;
using System.Linq

public abstract class BankAccount
{
    protected decimal balance;
    protected string accountNumber;
    protected string customerName;
    protected DateTime createdDate;
    protected List<Transaction> transactions;
    
    public BankAccount(string accountNumber, string customerName, decimal initialBalance = 0)
    {
        this.accountNumber = accountNumber;
        this.customerName = customerName;
        this.balance = initialBalance;
        this.createdDate = DateTime.Now;
        this.transactions = new List<Transaction>();
        
        if (initialBalance > 0)
        {
            AddTransaction(TransactionType.Deposit, initialBalance, "Initial deposit");
        }
    }
    
    public decimal Balance => balance;
    public string AccountNumber => accountNumber;
    public string CustomerName => customerName;
    public DateTime CreatedDate => createdDate;
    public IReadOnlyList<Transaction> Transactions => transactions.AsReadOnly();
    
    // ❌ LSP Violation: Base class assumes all accounts can withdraw any amount
    public virtual decimal Withdraw(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Withdrawal amount must be positive");
        
        if (amount > balance)
            throw new InsufficientFundsException("Insufficient funds for withdrawal");
        
        balance -= amount;
        AddTransaction(TransactionType.Withdrawal, amount, "Cash withdrawal");
        
        return balance;
    }
    
    public virtual decimal Deposit(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Deposit amount must be positive");
        
        balance += amount;
        AddTransaction(TransactionType.Deposit, amount, "Cash deposit");
        
        return balance;
    }
    
    public virtual decimal Transfer(BankAccount targetAccount, decimal amount)
    {
        if (targetAccount == null)
            throw new ArgumentException("Target account cannot be null");
        
        // This assumes withdrawal is always possible
        Withdraw(amount);
        targetAccount.Deposit(amount);
        
        AddTransaction(TransactionType.Transfer, amount, $"Transfer to {targetAccount.AccountNumber}");
        
        return balance;
    }
    
    public virtual decimal GetAvailableBalance()
    {
        return balance;
    }
    
    public virtual List<Transaction> GetTransactionHistory(DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = transactions.AsQueryable();
        
        if (fromDate.HasValue)
            query = query.Where(t => t.Date >= fromDate.Value);
        
        if (toDate.HasValue)
            query = query.Where(t => t.Date <= toDate.Value);
        
        return query.OrderByDescending(t => t.Date).ToList();
    }
    
    protected void AddTransaction(TransactionType type, decimal amount, string description)
    {
        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            Date = DateTime.Now,
            Type = type,
            Amount = amount,
            Description = description,
            BalanceAfter = balance
        };
        
        transactions.Add(transaction);
    }
    
    public override string ToString()
    {
        return $"{GetType().Name}: {accountNumber} - {customerName} - Balance: ${balance:F2}";
    }
}

public class CheckingAccount : BankAccount
{
    private decimal overdraftLimit;
    private decimal overdraftFee;
    
    public CheckingAccount(string accountNumber, string customerName, decimal initialBalance = 0, 
                          decimal overdraftLimit = 500)
        : base(accountNumber, customerName, initialBalance)
    {
        this.overdraftLimit = overdraftLimit;
        this.overdraftFee = 35; // Standard overdraft fee
    }
    
    public decimal OverdraftLimit => overdraftLimit;
    
    // ❌ LSP Violation: Changes withdrawal behavior to allow overdrafts
    public override decimal Withdraw(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Withdrawal amount must be positive");
        
        decimal availableCredit = balance + overdraftLimit;
        
        if (amount > availableCredit)
            throw new InsufficientFundsException($"Withdrawal exceeds available credit of ${availableCredit:F2}");
        
        balance -= amount;
        
        // Charge overdraft fee if balance goes negative
        if (balance < 0)
        {
            balance -= overdraftFee;
            AddTransaction(TransactionType.Fee, overdraftFee, "Overdraft fee");
        }
        
        AddTransaction(TransactionType.Withdrawal, amount, "Cash withdrawal");
        
        return balance;
    }
    
    public override decimal GetAvailableBalance()
    {
        return balance + overdraftLimit;
    }
}

public class SavingsAccount : BankAccount
{
    private decimal interestRate;
    private int withdrawalCount;
    private int maxWithdrawalsPerMonth;
    private DateTime lastInterestDate;
    
    public SavingsAccount(string accountNumber, string customerName, decimal initialBalance = 0,
                         decimal interestRate = 0.02m)
        : base(accountNumber, customerName, initialBalance)
    {
        this.interestRate = interestRate;
        this.maxWithdrawalsPerMonth = 6; // Federal regulation
        this.withdrawalCount = 0;
        this.lastInterestDate = DateTime.Now;
    }
    
    public decimal InterestRate => interestRate;
    public int WithdrawalCount => withdrawalCount;
    public int RemainingWithdrawals => Math.Max(0, maxWithdrawalsPerMonth - withdrawalCount);
    
    // ❌ LSP Violation: Adds withdrawal limits not present in base class
    public override decimal Withdraw(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Withdrawal amount must be positive");
        
        // Check monthly withdrawal limit
        if (withdrawalCount >= maxWithdrawalsPerMonth)
            throw new WithdrawalLimitExceededException($"Maximum {maxWithdrawalsPerMonth} withdrawals per month exceeded");
        
        if (amount > balance)
            throw new InsufficientFundsException("Insufficient funds for withdrawal");
        
        balance -= amount;
        withdrawalCount++;
        
        AddTransaction(TransactionType.Withdrawal, amount, $"Savings withdrawal ({withdrawalCount}/{maxWithdrawalsPerMonth})");
        
        return balance;
    }
    
    public void ApplyMonthlyInterest()
    {
        if (DateTime.Now.Month != lastInterestDate.Month || DateTime.Now.Year != lastInterestDate.Year)
        {
            decimal interestEarned = balance * (interestRate / 12);
            balance += interestEarned;
            lastInterestDate = DateTime.Now;
            withdrawalCount = 0; // Reset monthly withdrawal count
            
            AddTransaction(TransactionType.Interest, interestEarned, "Monthly interest");
        }
    }
}

public class FixedDepositAccount : BankAccount
{
    private DateTime maturityDate;
    private decimal penaltyRate;
    private bool isMatured;
    
    public FixedDepositAccount(string accountNumber, string customerName, decimal initialDeposit,
                              int termInMonths, decimal interestRate = 0.05m)
        : base(accountNumber, customerName, initialDeposit)
    {
        if (termInMonths < 1 || termInMonths > 120)
            throw new ArgumentException("Term must be between 1 and 120 months");
        
        this.maturityDate = DateTime.Now.AddMonths(termInMonths);
        this.penaltyRate = 0.02m; // 2% penalty for early withdrawal
        this.isMatured = false;
        
        // Calculate maturity amount
        decimal maturityAmount = initialDeposit * (decimal)Math.Pow((double)(1 + interestRate / 12), termInMonths);
        
        AddTransaction(TransactionType.Deposit, 0, $"Fixed deposit created. Maturity: {maturityDate:yyyy-MM-dd}, Expected amount: ${maturityAmount:F2}");
    }
    
    public DateTime MaturityDate => maturityDate;
    public bool IsMatured => DateTime.Now >= maturityDate || isMatured;
    
    // ❌ LSP Violation: Completely different withdrawal behavior
    public override decimal Withdraw(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Withdrawal amount must be positive");
        
        if (!IsMatured)
        {
            // Early withdrawal - apply penalty
            decimal penalty = balance * penaltyRate;
            decimal availableAmount = balance - penalty;
            
            if (amount > availableAmount)
                throw new InsufficientFundsException($"Early withdrawal limit: ${availableAmount:F2} (after penalty)");
            
            balance -= amount;
            balance -= penalty; // Apply penalty
            
            AddTransaction(TransactionType.Withdrawal, amount, "Early withdrawal");
            AddTransaction(TransactionType.Fee, penalty, "Early withdrawal penalty");
        }
        else
        {
            // Normal withdrawal after maturity
            if (amount > balance)
                throw new InsufficientFundsException("Insufficient funds for withdrawal");
            
            balance -= amount;
            AddTransaction(TransactionType.Withdrawal, amount, "Maturity withdrawal");
        }
        
        return balance;
    }
    
    // ❌ LSP Violation: Cannot accept additional deposits
    public override decimal Deposit(decimal amount)
    {
        throw new InvalidOperationException("Additional deposits not allowed in fixed deposit accounts");
    }
    
    public void ProcessMaturity()
    {
        if (IsMatured && !isMatured)
        {
            // Apply interest
            decimal interest = balance * 0.05m; // Simplified interest calculation
            balance += interest;
            isMatured = true;
            
            AddTransaction(TransactionType.Interest, interest, "Maturity interest");
        }
    }
}

// Client code that demonstrates LSP violations
public class BankingService
{
    private List<BankAccount> accounts;
    
    public BankingService()
    {
        accounts = new List<BankAccount>();
    }
    
    public void AddAccount(BankAccount account)
    {
        accounts.Add(account);
    }
    
    // ❌ This method assumes all accounts behave the same way
    public void ProcessMonthlyMaintenance()
    {
        Console.WriteLine("=== Processing Monthly Maintenance ===");
        
        foreach (var account in accounts)
        {
            try
            {
                Console.WriteLine($"\nProcessing {account.AccountNumber}:");
                
                // Assume all accounts can handle maintenance fee withdrawal
                decimal maintenanceFee = 10;
                Console.WriteLine($"Charging maintenance fee: ${maintenanceFee}");
                account.Withdraw(maintenanceFee);
                
                Console.WriteLine($"Account balance after fee: ${account.Balance:F2}");
                
            }
            catch (Exception e)
            {
                Console.WriteLine($"❌ Maintenance processing failed for {account.AccountNumber}: {e.Message}");
            }
        }
    }
    
    // ❌ This method assumes uniform withdrawal behavior
    public void ProcessEmergencyWithdrawals(decimal emergencyAmount)
    {
        Console.WriteLine($"\n=== Processing Emergency Withdrawals of ${emergencyAmount} ===");
        
        foreach (var account in accounts)
        {
            try
            {
                Console.WriteLine($"\nEmergency withdrawal from {account.AccountNumber}:");
                Console.WriteLine($"Balance before: ${account.Balance:F2}");
                
                account.Withdraw(emergencyAmount);
                
                Console.WriteLine($"Balance after: ${account.Balance:F2}");
                Console.WriteLine("✓ Emergency withdrawal successful");
                
            }
            catch (Exception e)
            {
                Console.WriteLine($"❌ Emergency withdrawal failed: {e.Message}");
            }
        }
    }
    
    // ❌ This method assumes all accounts can receive deposits
    public void ProcessBonusPayments(decimal bonusAmount)
    {
        Console.WriteLine($"\n=== Processing Bonus Payments of ${bonusAmount} ===");
        
        foreach (var account in accounts)
        {
            try
            {
                Console.WriteLine($"\nDepositing bonus to {account.AccountNumber}:");
                Console.WriteLine($"Balance before: ${account.Balance:F2}");
                
                account.Deposit(bonusAmount);
                
                Console.WriteLine($"Balance after: ${account.Balance:F2}");
                Console.WriteLine("✓ Bonus payment successful");
                
            }
            catch (Exception e)
            {
                Console.WriteLine($"❌ Bonus payment failed: {e.Message}");
            }
        }
    }
    
    public void GenerateAvailableFundsReport()
    {
        Console.WriteLine("\n=== Available Funds Report ===");
        
        foreach (var account in accounts)
        {
            decimal availableFunds = account.GetAvailableBalance();
            Console.WriteLine($"{account.AccountNumber}: ${availableFunds:F2} available");
        }
    }
}

// Supporting classes
public class Transaction
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; }
    public decimal BalanceAfter { get; set; }
}

public enum TransactionType
{
    Deposit,
    Withdrawal,
    Transfer,
    Interest,
    Fee
}

public class InsufficientFundsException : Exception
{
    public InsufficientFundsException(string message) : base(message) { }
}

public class WithdrawalLimitExceededException : Exception
{
    public WithdrawalLimitExceededException(string message) : base(message) { }
}

// Demonstration of LSP violations
public class LSPDemo
{
    public static void Main()
    {
        var bankingService = new BankingService();
        
        // Add different types of accounts
        bankingService.AddAccount(new CheckingAccount("CHK001", "John Doe", 1000, 500));
        bankingService.AddAccount(new SavingsAccount("SAV001", "Jane Smith", 5000, 0.03m));
        bankingService.AddAccount(new FixedDepositAccount("FD001", "Bob Johnson", 10000, 12, 0.05m));
        
        // These operations demonstrate LSP violations
        bankingService.ProcessMonthlyMaintenance();
        bankingService.ProcessEmergencyWithdrawals(200);
        bankingService.ProcessBonusPayments(100);
        bankingService.GenerateAvailableFundsReport();
        
        DemonstrateTransferViolations();
    }
    
    private static void DemonstrateTransferViolations()
    {
        Console.WriteLine("\n=== Transfer Violations Demo ===");
        
        var checking = new CheckingAccount("CHK002", "Alice", 100);
        var savings = new SavingsAccount("SAV002", "Bob", 200);
        var fixedDeposit = new FixedDepositAccount("FD002", "Charlie", 5000, 6);
        
        try
        {
            Console.WriteLine("Attempting transfer from fixed deposit to checking...");
            fixedDeposit.Transfer(checking, 1000); // This should fail
        }
        catch (Exception e)
        {
            Console.WriteLine($"❌ Transfer failed: {e.Message}");
        }
        
        try
        {
            Console.WriteLine("Attempting transfer to fixed deposit...");
            checking.Transfer(fixedDeposit, 50); // This should also fail
        }
        catch (Exception e)
        {
            Console.WriteLine($"❌ Transfer failed: {e.Message}");
        }
    }
}
```

### Your Task
Fix the LSP violations in this banking system.

### Requirements
- [ ] **Identify contract violations** - where do derived classes break base class promises?
- [ ] **Analyze behavioral differences** - how do withdrawal/deposit behaviors differ?
- [ ] **Design proper abstractions** - create interfaces that accommodate all account types
- [ ] **Handle special constraints** - withdrawal limits, deposit restrictions, penalties
- [ ] **Maintain banking operations** - all banking functionality should still work
- [ ] **Enable polymorphic usage** - clients should work with any account type

### LSP Violations to Address
1. **Withdrawal behavior differences**: Overdrafts, limits, penalties
2. **Deposit restrictions**: Fixed deposits can't accept additional deposits
3. **Available balance calculation**: Different accounts calculate differently
4. **Transfer operations**: Some accounts have restrictions on transfers
5. **Fee structures**: Different accounts have different fee behaviors

### Focus Areas
- Banking domain modeling
- Interface design for financial operations
- Constraint handling in inheritance
- Polymorphic financial services

---

## 🏆 Success Criteria

For each LSP exercise, demonstrate:

### Substitutability
- **Behavioral Compatibility**: Derived classes honor base class contracts
- **No Surprising Behavior**: Substitution doesn't break client expectations
- **Contract Preservation**: Preconditions, postconditions, and invariants are maintained
- **Exception Consistency**: Error handling is consistent across the hierarchy

### Design Quality
- **Proper Inheritance**: "Is-a" relationships are behaviorally sound
- **Interface Segregation**: Clients depend only on methods they use
- **Composition Usage**: Inheritance is used only when substitutability makes sense
- **Contract Documentation**: Behavioral contracts are clearly specified

### Code Quality
- **No Special Cases**: Client code doesn't need type checking or special handling
- **Polymorphic Usage**: Any derived class can be used where base class is expected
- **Maintainable Design**: New subclasses can be added without breaking clients
- **Clear Semantics**: Class relationships are intuitive and well-documented

---

## 💡 LSP Implementation Patterns

### **Proper Inheritance Design**
```java
// ✅ Proper inheritance - all shapes can calculate area
abstract class Shape {
    public abstract double calculateArea();
    public abstract double calculatePerimeter();
    
    // Template method that works for all shapes
    public final String getDescription() {
        return String.format("%s - Area: %.2f, Perimeter: %.2f", 
            getClass().getSimpleName(), calculateArea(), calculatePerimeter());
    }
}

class Circle extends Shape {
    private double radius;
    
    public Circle(double radius) {
        this.radius = radius;
    }
    
    @Override
    public double calculateArea() {
        return Math.PI * radius * radius;
    }
    
    @Override
    public double calculatePerimeter() {
        return 2 * Math.PI * radius;
    }
}

class Rectangle extends Shape {
    private double width, height;
    
    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }
    
    @Override
    public double calculateArea() {
        return width * height;
    }
    
    @Override
    public double calculatePerimeter() {
        return 2 * (width + height);
    }
}
```

### **Interface Segregation for LSP**
```java
// ✅ Segregated interfaces prevent LSP violations
interface Drawable {
    void draw();
}

interface Resizable {
    void resize(double factor);
}

interface Movable {
    void move(double x, double y);
}

// Classes implement only the interfaces they can properly support
class Circle implements Drawable, Resizable, Movable {
    // All operations make sense for circles
}

class Line implements Drawable, Movable {
    // Lines can't be resized, so they don't implement Resizable
}

class FixedBackground implements Drawable {
    // Background can only be drawn, not moved or resized
}
```

### **Composition Over Inheritance**
```java
// ✅ Use composition when inheritance would violate LSP
interface Vehicle {
    void start();
    void stop();
    String getType();
}

class Engine {
    public void start() { /* engine logic */ }
    public void stop() { /* engine logic */ }
}

class FlyingCapability {
    public void takeOff() { /* flying logic */ }
    public void land() { /* flying logic */ }
}

class Car implements Vehicle {
    private Engine engine = new Engine();
    
    @Override
    public void start() { engine.start(); }
    
    @Override
    public void stop() { engine.stop(); }
    
    @Override
    public String getType() { return "Car"; }
}

class Airplane implements Vehicle {
    private Engine engine = new Engine();
    private FlyingCapability flyingCapability = new FlyingCapability();
    
    @Override
    public void start() { engine.start(); }
    
    @Override
    public void stop() { engine.stop(); }
    
    @Override
    public String getType() { return "Airplane"; }
    
    // Additional flying methods - not in Vehicle interface
    public void takeOff() { flyingCapability.takeOff(); }
    public void land() { flyingCapability.land(); }
}
```

---

## 🎯 Self-Assessment

After completing each LSP exercise:

### **Substitutability Achievement (1-5 scale)**
- [ ] **Contract Preservation**: Derived classes honor base class contracts
- [ ] **Behavioral Consistency**: No surprising behavior when substituting
- [ ] **Exception Compatibility**: Error handling is consistent
- [ ] **Client Independence**: Clients work with any derived class

### **Design Quality (1-5 scale)**
- [ ] **Inheritance Appropriateness**: Inheritance used only when proper substitution exists
- [ ] **Interface Design**: Interfaces support all implementers properly
- [ ] **Composition Usage**: Composition used when inheritance would violate LSP
- [ ] **Contract Clarity**: Behavioral contracts are well-documented

**Target**: All scores should be 4 or 5, representing mastery of LSP.

---

## 🚀 Next Steps

Once you've mastered the Liskov Substitution Principle:

1. **Practice with your inheritance hierarchies** - Review existing code for LSP violations
2. **Design with substitutability in mind** - Always consider whether inheritance makes behavioral sense
3. **Move to [Exercise 4: Interface Segregation Principle](./exercise-4-isp.md)** - Learn to design focused interfaces
4. **Apply LSP thinking** - Question every inheritance relationship for proper substitutability

Remember: Inheritance is not just about code reuse - it's about creating proper "is-a" relationships where derived objects can truly substitute for their base objects. When inheritance doesn't provide proper substitutability, composition is often a better choice!
