# Exercise 4: Testing Complex Logic

Master the art of testing intricate business rules, algorithms, and complex conditional logic with comprehensive, maintainable test suites.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Design test strategies for complex business logic
- Create comprehensive test coverage for conditional branches
- Test edge cases and boundary conditions systematically
- Use parameterized tests to handle multiple scenarios efficiently
- Apply property-based testing for algorithmic validation
- Structure tests for complex domain rules

## 📝 Exercise Format

Each problem presents complex business logic with multiple branches, edge cases, and intricate rules. Your job is to create comprehensive test suites that verify all scenarios and provide confidence in the implementation.

---

## Problem 1: Insurance Premium Calculator

### System Under Test
```python
# Complex insurance premium calculation with multiple factors
from datetime import datetime, date
from typing import List, Dict, Optional
from enum import Enum
from dataclasses import dataclass

class CoverageType(Enum):
    LIABILITY = "liability"
    COLLISION = "collision" 
    COMPREHENSIVE = "comprehensive"
    PERSONAL_INJURY = "personal_injury"
    UNINSURED_MOTORIST = "uninsured_motorist"

class VehicleType(Enum):
    SEDAN = "sedan"
    SUV = "suv"
    TRUCK = "truck"
    MOTORCYCLE = "motorcycle"
    LUXURY = "luxury"
    SPORTS = "sports"

@dataclass
class Vehicle:
    year: int
    make: str
    model: str
    vehicle_type: VehicleType
    safety_rating: int  # 1-5 stars
    theft_rating: int   # 1-10 (10 = most likely to be stolen)
    engine_size: float  # liters
    value: float        # current market value

@dataclass
class Driver:
    age: int
    gender: str
    years_licensed: int
    accidents_last_3_years: int
    tickets_last_3_years: int
    credit_score: int
    marital_status: str
    occupation: str
    annual_mileage: int
    has_defensive_driving_course: bool

@dataclass
class PolicyRequest:
    driver: Driver
    vehicle: Vehicle
    coverage_types: List[CoverageType]
    deductible_amounts: Dict[CoverageType, int]
    location_zip: str
    garage_type: str  # "garage", "carport", "street"
    anti_theft_devices: List[str]

class InsurancePremiumCalculator:
    
    def __init__(self):
        # Base rates per coverage type (annual)
        self.base_rates = {
            CoverageType.LIABILITY: 600,
            CoverageType.COLLISION: 800,
            CoverageType.COMPREHENSIVE: 400,
            CoverageType.PERSONAL_INJURY: 300,
            CoverageType.UNINSURED_MOTORIST: 200
        }
        
        # Risk factor tables
        self.age_factors = {
            (16, 20): 2.5,
            (21, 25): 1.8,
            (26, 35): 1.0,
            (36, 50): 0.9,
            (51, 65): 0.8,
            (66, 100): 1.1
        }
        
        self.vehicle_type_factors = {
            VehicleType.SEDAN: 1.0,
            VehicleType.SUV: 1.1,
            VehicleType.TRUCK: 1.2,
            VehicleType.MOTORCYCLE: 1.8,
            VehicleType.LUXURY: 1.5,
            VehicleType.SPORTS: 2.0
        }
        
        # Location risk multipliers by ZIP prefix
        self.location_factors = {
            "901": 1.4,  # High crime urban area
            "902": 1.2,  # Moderate urban area  
            "903": 1.0,  # Suburban area
            "904": 0.8,  # Rural area
            "905": 0.7   # Very rural area
        }
    
    def calculate_premium(self, request: PolicyRequest) -> Dict[str, float]:
        """Calculate insurance premium with detailed breakdown"""
        
        if not self._validate_request(request):
            raise ValueError("Invalid policy request")
        
        premium_breakdown = {}
        total_premium = 0
        
        for coverage_type in request.coverage_types:
            coverage_premium = self._calculate_coverage_premium(coverage_type, request)
            premium_breakdown[coverage_type.value] = coverage_premium
            total_premium += coverage_premium
        
        # Apply multi-coverage discount
        if len(request.coverage_types) >= 3:
            multi_coverage_discount = total_premium * 0.05
            premium_breakdown["multi_coverage_discount"] = -multi_coverage_discount
            total_premium -= multi_coverage_discount
        
        # Apply loyalty discount (simplified - based on driver experience)
        if request.driver.years_licensed >= 10 and request.driver.accidents_last_3_years == 0:
            loyalty_discount = total_premium * 0.03
            premium_breakdown["loyalty_discount"] = -loyalty_discount
            total_premium -= loyalty_discount
        
        premium_breakdown["total"] = total_premium
        return premium_breakdown
    
    def _validate_request(self, request: PolicyRequest) -> bool:
        """Validate policy request data"""
        driver = request.driver
        vehicle = request.vehicle
        
        # Driver validation
        if not (16 <= driver.age <= 100):
            return False
        
        if driver.years_licensed < 0 or driver.years_licensed > (driver.age - 15):
            return False
        
        if driver.accidents_last_3_years < 0 or driver.accidents_last_3_years > 10:
            return False
        
        if driver.tickets_last_3_years < 0 or driver.tickets_last_3_years > 20:
            return False
        
        if not (300 <= driver.credit_score <= 850):
            return False
        
        if driver.annual_mileage < 0 or driver.annual_mileage > 100000:
            return False
        
        # Vehicle validation
        current_year = datetime.now().year
        if not (1980 <= vehicle.year <= current_year + 1):
            return False
        
        if not (1 <= vehicle.safety_rating <= 5):
            return False
        
        if not (1 <= vehicle.theft_rating <= 10):
            return False
        
        if vehicle.engine_size <= 0 or vehicle.engine_size > 10:
            return False
        
        if vehicle.value <= 0:
            return False
        
        # Coverage validation
        if not request.coverage_types:
            return False
        
        # Liability is required
        if CoverageType.LIABILITY not in request.coverage_types:
            return False
        
        return True
    
    def _calculate_coverage_premium(self, coverage_type: CoverageType, request: PolicyRequest) -> float:
        """Calculate premium for specific coverage type"""
        base_premium = self.base_rates[coverage_type]
        
        # Apply all risk factors
        premium = base_premium
        premium *= self._get_age_factor(request.driver.age)
        premium *= self._get_gender_factor(request.driver.gender)
        premium *= self._get_vehicle_factor(request.vehicle)
        premium *= self._get_driving_record_factor(request.driver)
        premium *= self._get_credit_score_factor(request.driver.credit_score)
        premium *= self._get_location_factor(request.location_zip)
        premium *= self._get_mileage_factor(request.driver.annual_mileage)
        premium *= self._get_garage_factor(request.garage_type)
        
        # Apply deductible discount
        deductible = request.deductible_amounts.get(coverage_type, 500)
        premium *= self._get_deductible_factor(deductible)
        
        # Apply coverage-specific factors
        if coverage_type == CoverageType.COMPREHENSIVE:
            premium *= self._get_theft_factor(request.vehicle.theft_rating)
            premium *= self._get_anti_theft_factor(request.anti_theft_devices)
        
        if coverage_type == CoverageType.COLLISION:
            premium *= self._get_vehicle_age_factor(request.vehicle.year)
            premium *= self._get_safety_rating_factor(request.vehicle.safety_rating)
        
        # Apply discounts
        if request.driver.has_defensive_driving_course:
            premium *= 0.95
        
        if request.driver.marital_status == "married":
            premium *= 0.97
        
        # Occupation-based adjustments
        premium *= self._get_occupation_factor(request.driver.occupation)
        
        return round(premium, 2)
    
    def _get_age_factor(self, age: int) -> float:
        """Get age-based risk factor"""
        for (min_age, max_age), factor in self.age_factors.items():
            if min_age <= age <= max_age:
                return factor
        return 1.0
    
    def _get_gender_factor(self, gender: str) -> float:
        """Get gender-based risk factor"""
        gender_factors = {
            "male": 1.1,
            "female": 0.95,
            "other": 1.0
        }
        return gender_factors.get(gender.lower(), 1.0)
    
    def _get_vehicle_factor(self, vehicle: Vehicle) -> float:
        """Get vehicle-based risk factor"""
        base_factor = self.vehicle_type_factors.get(vehicle.vehicle_type, 1.0)
        
        # Adjust for engine size
        if vehicle.engine_size > 4.0:
            base_factor *= 1.2
        elif vehicle.engine_size > 6.0:
            base_factor *= 1.4
        
        return base_factor
    
    def _get_driving_record_factor(self, driver: Driver) -> float:
        """Get driving record risk factor"""
        factor = 1.0
        
        # Accidents multiplier
        if driver.accidents_last_3_years > 0:
            factor *= (1.0 + (driver.accidents_last_3_years * 0.25))
        
        # Tickets multiplier  
        if driver.tickets_last_3_years > 0:
            factor *= (1.0 + (driver.tickets_last_3_years * 0.10))
        
        # Experience discount
        if driver.years_licensed >= 5:
            factor *= 0.95
        if driver.years_licensed >= 10:
            factor *= 0.93
        
        return factor
    
    def _get_credit_score_factor(self, credit_score: int) -> float:
        """Get credit score risk factor"""
        if credit_score >= 750:
            return 0.85
        elif credit_score >= 700:
            return 0.90
        elif credit_score >= 650:
            return 0.95
        elif credit_score >= 600:
            return 1.0
        elif credit_score >= 550:
            return 1.1
        else:
            return 1.2
    
    def _get_location_factor(self, zip_code: str) -> float:
        """Get location-based risk factor"""
        zip_prefix = zip_code[:3]
        return self.location_factors.get(zip_prefix, 1.0)
    
    def _get_mileage_factor(self, annual_mileage: int) -> float:
        """Get mileage-based risk factor"""
        if annual_mileage <= 5000:
            return 0.9
        elif annual_mileage <= 10000:
            return 0.95
        elif annual_mileage <= 15000:
            return 1.0
        elif annual_mileage <= 20000:
            return 1.05
        elif annual_mileage <= 30000:
            return 1.15
        else:
            return 1.25
    
    def _get_garage_factor(self, garage_type: str) -> float:
        """Get garage type risk factor"""
        garage_factors = {
            "garage": 0.95,
            "carport": 0.98,
            "street": 1.05
        }
        return garage_factors.get(garage_type.lower(), 1.0)
    
    def _get_deductible_factor(self, deductible: int) -> float:
        """Get deductible discount factor"""
        if deductible >= 1000:
            return 0.85
        elif deductible >= 750:
            return 0.90
        elif deductible >= 500:
            return 0.95
        else:
            return 1.0
    
    def _get_theft_factor(self, theft_rating: int) -> float:
        """Get theft risk factor for comprehensive coverage"""
        return 1.0 + ((theft_rating - 1) * 0.05)
    
    def _get_anti_theft_factor(self, anti_theft_devices: List[str]) -> float:
        """Get anti-theft discount factor"""
        if not anti_theft_devices:
            return 1.0
        
        discount = 0
        if "alarm" in anti_theft_devices:
            discount += 0.03
        if "immobilizer" in anti_theft_devices:
            discount += 0.05
        if "gps_tracking" in anti_theft_devices:
            discount += 0.07
        if "steering_wheel_lock" in anti_theft_devices:
            discount += 0.02
        
        return 1.0 - min(discount, 0.15)  # Max 15% discount
    
    def _get_vehicle_age_factor(self, vehicle_year: int) -> float:
        """Get vehicle age factor for collision coverage"""
        current_year = datetime.now().year
        age = current_year - vehicle_year
        
        if age <= 2:
            return 1.1
        elif age <= 5:
            return 1.0
        elif age <= 10:
            return 0.95
        else:
            return 0.9
    
    def _get_safety_rating_factor(self, safety_rating: int) -> float:
        """Get safety rating discount factor"""
        return 1.0 - ((safety_rating - 1) * 0.02)
    
    def _get_occupation_factor(self, occupation: str) -> float:
        """Get occupation-based risk factor"""
        high_risk_occupations = ["delivery_driver", "taxi_driver", "racing_driver"]
        low_risk_occupations = ["teacher", "engineer", "doctor", "accountant"]
        
        if occupation.lower() in high_risk_occupations:
            return 1.15
        elif occupation.lower() in low_risk_occupations:
            return 0.95
        else:
            return 1.0
```

### Your Task
Create a comprehensive test suite for this complex premium calculator.

### Requirements
- [ ] **Test all validation rules** - invalid ages, credit scores, vehicle years, etc.
- [ ] **Test calculation accuracy** - verify premiums calculated correctly
- [ ] **Test boundary conditions** - edge cases for all ranges and thresholds
- [ ] **Test discount combinations** - multiple discounts applied together
- [ ] **Test coverage combinations** - different coverage type scenarios
- [ ] **Use parameterized tests** - test multiple scenarios efficiently
- [ ] **Test floating point precision** - handle rounding and precision issues

### Testing Strategy

#### Validation Testing
```python
@pytest.mark.parametrize("age,expected_valid", [
    (15, False),  # Too young
    (16, True),   # Minimum age
    (25, True),   # Normal age
    (100, True),  # Maximum age
    (101, False), # Too old
])
def test_age_validation(age, expected_valid):
    # Test age validation boundaries
    pass

@pytest.mark.parametrize("years_licensed,driver_age,expected_valid", [
    (0, 16, True),   # Just licensed
    (5, 21, True),   # Normal case
    (20, 30, False), # More experience than possible
    (-1, 25, False), # Negative experience
])
def test_years_licensed_validation(years_licensed, driver_age, expected_valid):
    # Test years licensed validation logic
    pass
```

#### Calculation Testing
```python
def test_liability_premium_calculation_for_low_risk_driver():
    # Test specific scenario with known expected result
    driver = create_low_risk_driver()
    vehicle = create_standard_vehicle()
    request = create_policy_request(driver, vehicle, [CoverageType.LIABILITY])
    
    calculator = InsurancePremiumCalculator()
    result = calculator.calculate_premium(request)
    
    # Verify calculation step by step
    expected_base = 600  # Base liability rate
    expected_after_age = expected_base * 1.0  # 26-35 age factor
    expected_after_gender = expected_after_age * 0.95  # Female factor
    # ... continue calculation verification
    
    assert result["liability"] == pytest.approx(expected_final, rel=1e-2)

@pytest.mark.parametrize("coverage_types,expected_discount", [
    ([CoverageType.LIABILITY], 0),  # No discount
    ([CoverageType.LIABILITY, CoverageType.COLLISION], 0),  # No discount
    ([CoverageType.LIABILITY, CoverageType.COLLISION, CoverageType.COMPREHENSIVE], True),  # Discount applies
])
def test_multi_coverage_discount(coverage_types, expected_discount):
    # Test multi-coverage discount application
    pass
```

### Focus Areas
- Boundary value testing
- Equivalence class partitioning
- Combination testing
- Property-based testing for calculations

---

## Problem 2: Game Tournament Scoring System

### System Under Test
```java
// Complex tournament scoring with multiple game formats and rules
import java.util.*;
import java.time.LocalDateTime;

public enum GameFormat {
    SINGLE_ELIMINATION,
    DOUBLE_ELIMINATION, 
    ROUND_ROBIN,
    SWISS_SYSTEM,
    LADDER
}

public enum TieBreaker {
    HEAD_TO_HEAD,
    POINT_DIFFERENTIAL,
    TOTAL_POINTS_SCORED,
    OPPONENT_STRENGTH,
    RANDOM
}

public class Player {
    private String id;
    private String name;
    private int skill_rating;
    private int tournaments_played;
    private double win_percentage;
    
    // constructors, getters, setters...
}

public class Match {
    private String id;
    private Player player1;
    private Player player2;
    private Player winner;
    private int player1_score;
    private int player2_score;
    private LocalDateTime completed_at;
    private boolean forfeit;
    private String forfeit_reason;
    
    // constructors, getters, setters...
}

public class Tournament {
    private String id;
    private String name;
    private GameFormat format;
    private List<TieBreaker> tie_breakers;
    private List<Player> players;
    private List<Match> matches;
    private Map<String, Integer> entry_fees;
    private Map<String, Double> prize_distribution;
    private boolean allow_byes;
    private int max_players;
    private LocalDateTime start_time;
    
    // constructors, getters, setters...
}

public class TournamentScoringSystem {
    
    public TournamentStandings calculateStandings(Tournament tournament) {
        if (!isValidTournament(tournament)) {
            throw new IllegalArgumentException("Invalid tournament configuration");
        }
        
        Map<Player, PlayerStats> playerStats = calculatePlayerStats(tournament);
        List<Player> rankedPlayers = rankPlayers(playerStats, tournament.getTieBreakers());
        
        return new TournamentStandings(rankedPlayers, playerStats, calculatePrizeDistribution(tournament, rankedPlayers));
    }
    
    private boolean isValidTournament(Tournament tournament) {
        // Complex validation logic
        if (tournament.getPlayers().size() < 2) {
            return false;
        }
        
        if (tournament.getFormat() == GameFormat.SINGLE_ELIMINATION) {
            // Must be power of 2 for single elimination (or allow byes)
            int playerCount = tournament.getPlayers().size();
            if (!tournament.isAllowByes() && !isPowerOfTwo(playerCount)) {
                return false;
            }
        }
        
        if (tournament.getFormat() == GameFormat.ROUND_ROBIN) {
            // All players must play each other
            int expectedMatches = (tournament.getPlayers().size() * (tournament.getPlayers().size() - 1)) / 2;
            long completedMatches = tournament.getMatches().stream().filter(m -> m.getWinner() != null).count();
            
            // For ongoing tournament, we need at least some matches
            if (completedMatches == 0) {
                return false;
            }
        }
        
        // Validate match integrity
        for (Match match : tournament.getMatches()) {
            if (!tournament.getPlayers().contains(match.getPlayer1()) || 
                !tournament.getPlayers().contains(match.getPlayer2())) {
                return false;
            }
            
            if (match.getWinner() != null) {
                if (!match.getWinner().equals(match.getPlayer1()) && 
                    !match.getWinner().equals(match.getPlayer2())) {
                    return false;
                }
                
                // Verify score consistency
                if (!match.isForfeit()) {
                    if (match.getWinner().equals(match.getPlayer1())) {
                        if (match.getPlayer1Score() <= match.getPlayer2Score()) {
                            return false;
                        }
                    } else {
                        if (match.getPlayer2Score() <= match.getPlayer1Score()) {
                            return false;
                        }
                    }
                }
            }
        }
        
        return true;
    }
    
    private Map<Player, PlayerStats> calculatePlayerStats(Tournament tournament) {
        Map<Player, PlayerStats> stats = new HashMap<>();
        
        // Initialize stats for all players
        for (Player player : tournament.getPlayers()) {
            stats.put(player, new PlayerStats(player));
        }
        
        // Process all completed matches
        for (Match match : tournament.getMatches()) {
            if (match.getWinner() == null) continue;
            
            PlayerStats player1Stats = stats.get(match.getPlayer1());
            PlayerStats player2Stats = stats.get(match.getPlayer2());
            
            // Update basic stats
            player1Stats.incrementGamesPlayed();
            player2Stats.incrementGamesPlayed();
            
            if (match.isForfeit()) {
                // Handle forfeit differently
                if (match.getWinner().equals(match.getPlayer1())) {
                    player1Stats.incrementWins();
                    player1Stats.incrementForfeitWins();
                    player2Stats.incrementLosses();
                    player2Stats.incrementForfeits();
                } else {
                    player2Stats.incrementWins();
                    player2Stats.incrementForfeitWins();
                    player1Stats.incrementLosses();
                    player1Stats.incrementForfeits();
                }
            } else {
                // Normal game scoring
                player1Stats.addPointsScored(match.getPlayer1Score());
                player1Stats.addPointsAllowed(match.getPlayer2Score());
                player2Stats.addPointsScored(match.getPlayer2Score());
                player2Stats.addPointsAllowed(match.getPlayer1Score());
                
                if (match.getWinner().equals(match.getPlayer1())) {
                    player1Stats.incrementWins();
                    player2Stats.incrementLosses();
                } else {
                    player2Stats.incrementWins();
                    player1Stats.incrementLosses();
                }
            }
            
            // Update head-to-head records
            player1Stats.addHeadToHeadResult(match.getPlayer2(), match.getWinner().equals(match.getPlayer1()));
            player2Stats.addHeadToHeadResult(match.getPlayer1(), match.getWinner().equals(match.getPlayer2()));
        }
        
        // Calculate derived stats
        for (PlayerStats stat : stats.values()) {
            stat.calculateDerivedStats();
            stat.calculateOpponentStrength(stats, tournament.getMatches());
        }
        
        return stats;
    }
    
    private List<Player> rankPlayers(Map<Player, PlayerStats> playerStats, List<TieBreaker> tieBreakers) {
        List<Player> players = new ArrayList<>(playerStats.keySet());
        
        players.sort((p1, p2) -> {
            PlayerStats stats1 = playerStats.get(p1);
            PlayerStats stats2 = playerStats.get(p2);
            
            // Primary sort: win percentage
            int winPercentageComparison = Double.compare(stats2.getWinPercentage(), stats1.getWinPercentage());
            if (winPercentageComparison != 0) {
                return winPercentageComparison;
            }
            
            // Apply tie breakers in order
            for (TieBreaker tieBreaker : tieBreakers) {
                int result = applyTieBreaker(stats1, stats2, tieBreaker);
                if (result != 0) {
                    return result;
                }
            }
            
            return 0; // Complete tie
        });
        
        return players;
    }
    
    private int applyTieBreaker(PlayerStats stats1, PlayerStats stats2, TieBreaker tieBreaker) {
        switch (tieBreaker) {
            case HEAD_TO_HEAD:
                return Integer.compare(
                    stats2.getHeadToHeadWins(stats1.getPlayer()),
                    stats1.getHeadToHeadWins(stats2.getPlayer())
                );
                
            case POINT_DIFFERENTIAL:
                return Double.compare(stats2.getPointDifferential(), stats1.getPointDifferential());
                
            case TOTAL_POINTS_SCORED:
                return Integer.compare(stats2.getTotalPointsScored(), stats1.getTotalPointsScored());
                
            case OPPONENT_STRENGTH:
                return Double.compare(stats2.getOpponentStrength(), stats1.getOpponentStrength());
                
            case RANDOM:
                return new Random().nextBoolean() ? 1 : -1;
                
            default:
                return 0;
        }
    }
    
    private Map<Player, Double> calculatePrizeDistribution(Tournament tournament, List<Player> rankedPlayers) {
        Map<Player, Double> prizes = new HashMap<>();
        
        if (tournament.getPrizeDistribution() == null || tournament.getPrizeDistribution().isEmpty()) {
            return prizes;
        }
        
        double totalPrizePool = tournament.getPlayers().size() * 
                               tournament.getEntryFees().getOrDefault("standard", 0);
        
        for (int i = 0; i < rankedPlayers.size() && i < tournament.getPrizeDistribution().size(); i++) {
            Player player = rankedPlayers.get(i);
            String place = getPlaceString(i + 1);
            Double percentage = tournament.getPrizeDistribution().get(place);
            
            if (percentage != null) {
                prizes.put(player, totalPrizePool * percentage);
            }
        }
        
        return prizes;
    }
    
    private String getPlaceString(int place) {
        switch (place) {
            case 1: return "1st";
            case 2: return "2nd"; 
            case 3: return "3rd";
            default: return place + "th";
        }
    }
    
    private boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
}

// Supporting classes
public class PlayerStats {
    private Player player;
    private int gamesPlayed;
    private int wins;
    private int losses;
    private int forfeits;
    private int forfeitWins;
    private int totalPointsScored;
    private int totalPointsAllowed;
    private double winPercentage;
    private double pointDifferential;
    private double opponentStrength;
    private Map<Player, Integer> headToHeadWins;
    private Map<Player, Integer> headToHeadLosses;
    
    // Implementation details...
}

public class TournamentStandings {
    private List<Player> rankedPlayers;
    private Map<Player, PlayerStats> playerStats;
    private Map<Player, Double> prizeDistribution;
    
    // constructors, getters...
}
```

### Your Task
Create comprehensive tests for the tournament scoring system.

### Requirements
- [ ] **Test tournament validation** - various invalid tournament configurations
- [ ] **Test different game formats** - single elimination, round robin, Swiss system
- [ ] **Test tie-breaking scenarios** - multiple tied players with different tie breakers
- [ ] **Test statistical calculations** - win percentage, point differential, opponent strength
- [ ] **Test edge cases** - forfeits, byes, incomplete tournaments
- [ ] **Test prize distribution** - various prize structures and player counts
- [ ] **Use test data builders** - create complex tournament scenarios easily

### Testing Challenges

#### Complex Data Setup
```java
public class TournamentTestBuilder {
    private Tournament tournament;
    
    public TournamentTestBuilder() {
        this.tournament = new Tournament();
        // Set sensible defaults
    }
    
    public TournamentTestBuilder withFormat(GameFormat format) {
        tournament.setFormat(format);
        return this;
    }
    
    public TournamentTestBuilder withPlayers(String... playerNames) {
        List<Player> players = Arrays.stream(playerNames)
            .map(name -> new Player(UUID.randomUUID().toString(), name, 1000, 0, 0.0))
            .collect(Collectors.toList());
        tournament.setPlayers(players);
        return this;
    }
    
    public TournamentTestBuilder withMatch(String player1Name, String player2Name, 
                                          int score1, int score2) {
        Player p1 = findPlayerByName(player1Name);
        Player p2 = findPlayerByName(player2Name);
        Player winner = score1 > score2 ? p1 : p2;
        
        Match match = new Match(UUID.randomUUID().toString(), p1, p2, winner, 
                               score1, score2, LocalDateTime.now(), false, null);
        tournament.getMatches().add(match);
        return this;
    }
    
    public Tournament build() {
        return tournament;
    }
}

@Test
public void testComplexTieBreakingScenario() {
    Tournament tournament = new TournamentTestBuilder()
        .withFormat(GameFormat.ROUND_ROBIN)
        .withPlayers("Alice", "Bob", "Charlie", "Diana")
        .withTieBreakers(TieBreaker.HEAD_TO_HEAD, TieBreaker.POINT_DIFFERENTIAL)
        // Create scenario where Alice and Bob have same record
        .withMatch("Alice", "Charlie", 10, 5)
        .withMatch("Alice", "Diana", 8, 12)
        .withMatch("Bob", "Charlie", 7, 9)
        .withMatch("Bob", "Diana", 15, 3)
        .withMatch("Charlie", "Diana", 6, 8)
        // Alice beats Bob head-to-head
        .withMatch("Alice", "Bob", 11, 9)
        .build();
    
    TournamentScoringSystem system = new TournamentScoringSystem();
    TournamentStandings standings = system.calculateStandings(tournament);
    
    // Both Alice and Bob should have 1 win, 1 loss
    // But Alice should rank higher due to head-to-head win
    List<Player> rankings = standings.getRankedPlayers();
    
    // Find Alice and Bob in rankings
    int aliceRank = findPlayerRank(rankings, "Alice");
    int bobRank = findPlayerRank(rankings, "Bob");
    
    assertThat(aliceRank).isLessThan(bobRank);
}
```

### Focus Areas
- Complex test data creation
- Tie-breaking logic verification
- Statistical calculation accuracy
- Edge case handling

---

## Problem 3: Financial Risk Assessment Algorithm

### System Under Test
```csharp
// Complex financial risk assessment with multiple models and factors
using System;
using System.Collections.Generic;
using System.Linq;

public enum RiskCategory
{
    VeryLow,
    Low, 
    Medium,
    High,
    VeryHigh
}

public enum InvestmentType
{
    Stocks,
    Bonds,
    RealEstate,
    Commodities,
    Cryptocurrency,
    Cash
}

public class PortfolioHolding
{
    public InvestmentType Type { get; set; }
    public string Symbol { get; set; }
    public decimal Amount { get; set; }
    public decimal CurrentValue { get; set; }
    public DateTime PurchaseDate { get; set; }
    public decimal VolatilityScore { get; set; }
    public string Sector { get; set; }
    public string Country { get; set; }
}

public class InvestorProfile
{
    public int Age { get; set; }
    public decimal AnnualIncome { get; set; }
    public decimal NetWorth { get; set; }
    public int InvestmentExperienceYears { get; set; }
    public RiskCategory RiskTolerance { get; set; }
    public int InvestmentTimeHorizonYears { get; set; }
    public bool HasEmergencyFund { get; set; }
    public bool HasDependents { get; set; }
    public bool IsRetired { get; set; }
    public string EmploymentStatus { get; set; }
    public decimal MonthlyExpenses { get; set; }
}

public class MarketConditions
{
    public decimal VixLevel { get; set; }
    public decimal InterestRate { get; set; }
    public decimal InflationRate { get; set; }
    public decimal UnemploymentRate { get; set; }
    public decimal GdpGrowthRate { get; set; }
    public bool IsRecessionProbable { get; set; }
    public Dictionary<string, decimal> SectorPerformance { get; set; }
    public Dictionary<string, decimal> CountryRisk { get; set; }
}

public class RiskAssessmentResult
{
    public RiskCategory OverallRisk { get; set; }
    public decimal RiskScore { get; set; }
    public Dictionary<string, decimal> RiskFactors { get; set; }
    public List<string> Recommendations { get; set; }
    public decimal ConcentrationRisk { get; set; }
    public decimal LiquidityRisk { get; set; }
    public decimal MarketRisk { get; set; }
    public decimal CreditRisk { get; set; }
    public bool IsPortfolioSuitable { get; set; }
}

public class FinancialRiskAssessmentEngine
{
    private readonly Dictionary<InvestmentType, decimal> _baseRiskWeights;
    private readonly Dictionary<RiskCategory, decimal> _riskToleranceMultipliers;
    
    public FinancialRiskAssessmentEngine()
    {
        _baseRiskWeights = new Dictionary<InvestmentType, decimal>
        {
            { InvestmentType.Cash, 0.0m },
            { InvestmentType.Bonds, 0.2m },
            { InvestmentType.RealEstate, 0.4m },
            { InvestmentType.Stocks, 0.6m },
            { InvestmentType.Commodities, 0.8m },
            { InvestmentType.Cryptocurrency, 1.0m }
        };
        
        _riskToleranceMultipliers = new Dictionary<RiskCategory, decimal>
        {
            { RiskCategory.VeryLow, 0.5m },
            { RiskCategory.Low, 0.7m },
            { RiskCategory.Medium, 1.0m },
            { RiskCategory.High, 1.3m },
            { RiskCategory.VeryHigh, 1.6m }
        };
    }
    
    public RiskAssessmentResult AssessPortfolioRisk(
        List<PortfolioHolding> portfolio, 
        InvestorProfile investor, 
        MarketConditions market)
    {
        if (!ValidateInputs(portfolio, investor, market))
        {
            throw new ArgumentException("Invalid input parameters");
        }
        
        var result = new RiskAssessmentResult
        {
            RiskFactors = new Dictionary<string, decimal>(),
            Recommendations = new List<string>()
        };
        
        // Calculate various risk components
        result.ConcentrationRisk = CalculateConcentrationRisk(portfolio);
        result.LiquidityRisk = CalculateLiquidityRisk(portfolio, investor);
        result.MarketRisk = CalculateMarketRisk(portfolio, market);
        result.CreditRisk = CalculateCreditRisk(portfolio);
        
        // Calculate overall risk score
        result.RiskScore = CalculateOverallRiskScore(portfolio, investor, market, result);
        result.OverallRisk = DetermineRiskCategory(result.RiskScore);
        
        // Assess portfolio suitability
        result.IsPortfolioSuitable = AssessPortfolioSuitability(result, investor);
        
        // Generate recommendations
        result.Recommendations = GenerateRecommendations(result, portfolio, investor, market);
        
        return result;
    }
    
    private bool ValidateInputs(List<PortfolioHolding> portfolio, InvestorProfile investor, MarketConditions market)
    {
        // Portfolio validation
        if (portfolio == null || !portfolio.Any())
            return false;
        
        if (portfolio.Any(h => h.Amount <= 0 || h.CurrentValue <= 0))
            return false;
        
        // Investor validation
        if (investor.Age < 18 || investor.Age > 120)
            return false;
        
        if (investor.AnnualIncome < 0 || investor.NetWorth < 0)
            return false;
        
        if (investor.InvestmentExperienceYears < 0 || investor.InvestmentExperienceYears > (investor.Age - 18))
            return false;
        
        if (investor.InvestmentTimeHorizonYears <= 0)
            return false;
        
        if (investor.MonthlyExpenses < 0)
            return false;
        
        // Market conditions validation
        if (market.VixLevel < 0 || market.VixLevel > 100)
            return false;
        
        if (market.InterestRate < -10 || market.InterestRate > 50)
            return false;
        
        return true;
    }
    
    private decimal CalculateConcentrationRisk(List<PortfolioHolding> portfolio)
    {
        var totalValue = portfolio.Sum(h => h.CurrentValue);
        
        // Calculate concentration by investment type
        var typeConcentration = portfolio
            .GroupBy(h => h.Type)
            .Select(g => g.Sum(h => h.CurrentValue) / totalValue)
            .Max();
        
        // Calculate concentration by sector
        var sectorConcentration = portfolio
            .Where(h => !string.IsNullOrEmpty(h.Sector))
            .GroupBy(h => h.Sector)
            .Select(g => g.Sum(h => h.CurrentValue) / totalValue)
            .DefaultIfEmpty(0)
            .Max();
        
        // Calculate concentration by country
        var countryConcentration = portfolio
            .Where(h => !string.IsNullOrEmpty(h.Country))
            .GroupBy(h => h.Country)
            .Select(g => g.Sum(h => h.CurrentValue) / totalValue)
            .DefaultIfEmpty(0)
            .Max();
        
        // Single position concentration
        var positionConcentration = portfolio
            .Select(h => h.CurrentValue / totalValue)
            .Max();
        
        // Weight different concentration types
        var concentrationScore = 
            (typeConcentration * 0.4m) +
            (sectorConcentration * 0.25m) +
            (countryConcentration * 0.2m) +
            (positionConcentration * 0.15m);
        
        // Convert to risk score (0-1 scale)
        return Math.Min(concentrationScore * 2, 1.0m);
    }
    
    private decimal CalculateLiquidityRisk(List<PortfolioHolding> portfolio, InvestorProfile investor)
    {
        var totalValue = portfolio.Sum(h => h.CurrentValue);
        var liquidityScore = 0m;
        
        foreach (var holding in portfolio)
        {
            var weight = holding.CurrentValue / totalValue;
            var liquidityFactor = GetLiquidityFactor(holding);
            liquidityScore += weight * liquidityFactor;
        }
        
        // Adjust based on investor needs
        if (!investor.HasEmergencyFund)
        {
            liquidityScore *= 1.3m;
        }
        
        if (investor.IsRetired)
        {
            liquidityScore *= 1.2m;
        }
        
        var monthlyExpensesRatio = investor.MonthlyExpenses / (investor.AnnualIncome / 12);
        if (monthlyExpensesRatio > 0.8m)
        {
            liquidityScore *= 1.15m;
        }
        
        return Math.Min(liquidityScore, 1.0m);
    }
    
    private decimal GetLiquidityFactor(PortfolioHolding holding)
    {
        return holding.Type switch
        {
            InvestmentType.Cash => 0.0m,
            InvestmentType.Stocks => 0.1m,
            InvestmentType.Bonds => 0.2m,
            InvestmentType.RealEstate => 0.8m,
            InvestmentType.Commodities => 0.4m,
            InvestmentType.Cryptocurrency => 0.3m,
            _ => 0.5m
        };
    }
    
    private decimal CalculateMarketRisk(List<PortfolioHolding> portfolio, MarketConditions market)
    {
        var totalValue = portfolio.Sum(h => h.CurrentValue);
        var marketRisk = 0m;
        
        foreach (var holding in portfolio)
        {
            var weight = holding.CurrentValue / totalValue;
            var baseRisk = _baseRiskWeights[holding.Type];
            
            // Adjust for volatility
            var volatilityAdjustment = holding.VolatilityScore / 100m;
            var adjustedRisk = baseRisk * (1 + volatilityAdjustment);
            
            // Adjust for market conditions
            adjustedRisk *= GetMarketConditionMultiplier(market, holding);
            
            // Adjust for sector/country risk
            adjustedRisk *= GetCountryRiskMultiplier(market, holding.Country);
            
            marketRisk += weight * adjustedRisk;
        }
        
        return Math.Min(marketRisk, 1.0m);
    }
    
    private decimal GetMarketConditionMultiplier(MarketConditions market, PortfolioHolding holding)
    {
        var multiplier = 1.0m;
        
        // VIX adjustment
        if (market.VixLevel > 30)
        {
            multiplier += (market.VixLevel - 30) / 100m;
        }
        
        // Interest rate impact
        if (holding.Type == InvestmentType.Bonds)
        {
            // Bonds are more sensitive to interest rate changes
            multiplier += Math.Abs(market.InterestRate - 2.5m) / 100m;
        }
        
        // Recession probability
        if (market.IsRecessionProbable)
        {
            multiplier *= 1.2m;
        }
        
        // Sector performance
        if (!string.IsNullOrEmpty(holding.Sector) && 
            market.SectorPerformance.ContainsKey(holding.Sector))
        {
            var sectorPerf = market.SectorPerformance[holding.Sector];
            if (sectorPerf < -0.1m) // Sector declining more than 10%
            {
                multiplier *= 1.1m;
            }
        }
        
        return multiplier;
    }
    
    private decimal GetCountryRiskMultiplier(MarketConditions market, string country)
    {
        if (string.IsNullOrEmpty(country) || market.CountryRisk == null)
            return 1.0m;
        
        return market.CountryRisk.ContainsKey(country) 
            ? 1.0m + market.CountryRisk[country] 
            : 1.0m;
    }
    
    private decimal CalculateCreditRisk(List<PortfolioHolding> portfolio)
    {
        // Simplified credit risk calculation
        var totalValue = portfolio.Sum(h => h.CurrentValue);
        var creditRisk = 0m;
        
        foreach (var holding in portfolio)
        {
            var weight = holding.CurrentValue / totalValue;
            var creditFactor = GetCreditRiskFactor(holding.Type);
            creditRisk += weight * creditFactor;
        }
        
        return creditRisk;
    }
    
    private decimal GetCreditRiskFactor(InvestmentType type)
    {
        return type switch
        {
            InvestmentType.Cash => 0.01m,
            InvestmentType.Bonds => 0.1m,
            InvestmentType.Stocks => 0.05m,
            InvestmentType.RealEstate => 0.03m,
            InvestmentType.Commodities => 0.02m,
            InvestmentType.Cryptocurrency => 0.15m,
            _ => 0.05m
        };
    }
    
    private decimal CalculateOverallRiskScore(
        List<PortfolioHolding> portfolio, 
        InvestorProfile investor, 
        MarketConditions market,
        RiskAssessmentResult intermediateResult)
    {
        // Weighted combination of risk factors
        var riskScore = 
            (intermediateResult.ConcentrationRisk * 0.25m) +
            (intermediateResult.LiquidityRisk * 0.2m) +
            (intermediateResult.MarketRisk * 0.4m) +
            (intermediateResult.CreditRisk * 0.15m);
        
        // Adjust for investor characteristics
        riskScore *= GetInvestorRiskMultiplier(investor);
        
        // Store detailed risk factors
        intermediateResult.RiskFactors["Concentration"] = intermediateResult.ConcentrationRisk;
        intermediateResult.RiskFactors["Liquidity"] = intermediateResult.LiquidityRisk;
        intermediateResult.RiskFactors["Market"] = intermediateResult.MarketRisk;
        intermediateResult.RiskFactors["Credit"] = intermediateResult.CreditRisk;
        intermediateResult.RiskFactors["Investor Profile"] = GetInvestorRiskMultiplier(investor);
        
        return Math.Min(riskScore, 1.0m);
    }
    
    private decimal GetInvestorRiskMultiplier(InvestorProfile investor)
    {
        var multiplier = 1.0m;
        
        // Age factor
        if (investor.Age > 65)
        {
            multiplier *= 0.8m; // Lower risk tolerance for older investors
        }
        else if (investor.Age < 30)
        {
            multiplier *= 1.1m; // Higher risk capacity for younger investors
        }
        
        // Experience factor
        if (investor.InvestmentExperienceYears < 3)
        {
            multiplier *= 1.2m; // Inexperienced investors face higher risk
        }
        
        // Financial stability
        var incomeToExpenseRatio = investor.AnnualIncome / (investor.MonthlyExpenses * 12);
        if (incomeToExpenseRatio < 1.2m)
        {
            multiplier *= 1.3m; // Limited financial cushion increases risk
        }
        
        // Dependents
        if (investor.HasDependents)
        {
            multiplier *= 1.1m;
        }
        
        // Time horizon
        if (investor.InvestmentTimeHorizonYears < 3)
        {
            multiplier *= 1.4m; // Short time horizon increases risk
        }
        else if (investor.InvestmentTimeHorizonYears > 20)
        {
            multiplier *= 0.9m; // Long time horizon reduces risk
        }
        
        return multiplier;
    }
    
    private RiskCategory DetermineRiskCategory(decimal riskScore)
    {
        return riskScore switch
        {
            <= 0.2m => RiskCategory.VeryLow,
            <= 0.4m => RiskCategory.Low,
            <= 0.6m => RiskCategory.Medium,
            <= 0.8m => RiskCategory.High,
            _ => RiskCategory.VeryHigh
        };
    }
    
    private bool AssessPortfolioSuitability(RiskAssessmentResult result, InvestorProfile investor)
    {
        var toleranceScore = _riskToleranceMultipliers[investor.RiskTolerance];
        var portfolioRiskScore = result.RiskScore;
        
        // Portfolio is suitable if its risk level doesn't exceed investor tolerance by more than 20%
        return portfolioRiskScore <= (toleranceScore * 1.2m);
    }
    
    private List<string> GenerateRecommendations(
        RiskAssessmentResult result, 
        List<PortfolioHolding> portfolio, 
        InvestorProfile investor, 
        MarketConditions market)
    {
        var recommendations = new List<string>();
        
        // Concentration risk recommendations
        if (result.ConcentrationRisk > 0.7m)
        {
            recommendations.Add("Consider diversifying your portfolio across more asset classes and sectors to reduce concentration risk.");
        }
        
        // Liquidity risk recommendations
        if (result.LiquidityRisk > 0.6m && !investor.HasEmergencyFund)
        {
            recommendations.Add("Build an emergency fund of 3-6 months expenses in liquid assets before investing in illiquid investments.");
        }
        
        // Market risk recommendations
        if (result.MarketRisk > 0.8m && investor.RiskTolerance == RiskCategory.Low)
        {
            recommendations.Add("Your portfolio has high market risk. Consider increasing allocation to lower-risk assets like bonds or cash.");
        }
        
        // Age-based recommendations
        var stockAllocation = portfolio.Where(h => h.Type == InvestmentType.Stocks).Sum(h => h.CurrentValue) / 
                             portfolio.Sum(h => h.CurrentValue);
        var suggestedStockAllocation = Math.Max(0.2m, (120 - investor.Age) / 100m);
        
        if (stockAllocation > suggestedStockAllocation * 1.2m)
        {
            recommendations.Add($"Consider reducing stock allocation to around {suggestedStockAllocation:P0} based on your age and risk profile.");
        }
        
        // Suitability recommendations
        if (!result.IsPortfolioSuitable)
        {
            recommendations.Add("Your current portfolio risk level exceeds your stated risk tolerance. Consider rebalancing to more conservative investments.");
        }
        
        return recommendations;
    }
}
```

### Your Task
Create comprehensive tests for this complex financial risk assessment engine.

### Requirements
- [ ] **Test validation logic** - invalid investor profiles, portfolio holdings, market conditions
- [ ] **Test risk calculations** - each type of risk (concentration, liquidity, market, credit)
- [ ] **Test edge cases** - empty portfolios, extreme market conditions, unusual investor profiles
- [ ] **Test recommendation logic** - various scenarios that should trigger specific recommendations
- [ ] **Test mathematical accuracy** - verify calculations are correct
- [ ] **Use property-based testing** - test invariants and mathematical properties
- [ ] **Test floating point precision** - handle decimal arithmetic correctly

### Testing Strategy

#### Property-Based Testing
```csharp
[Property]
public void RiskScore_ShouldAlwaysBeBetweenZeroAndOne(
    List<PortfolioHolding> portfolio,
    InvestorProfile investor,
    MarketConditions market)
{
    // Assume valid inputs (use generators to create valid test data)
    Assume.That(IsValidPortfolio(portfolio));
    Assume.That(IsValidInvestor(investor));
    Assume.That(IsValidMarket(market));
    
    var engine = new FinancialRiskAssessmentEngine();
    var result = engine.AssessPortfolioRisk(portfolio, investor, market);
    
    Assert.That(result.RiskScore, Is.InRange(0m, 1m));
}

[Property]
public void ConcentrationRisk_ShouldIncreaseWithConcentration(
    List<PortfolioHolding> diversifiedPortfolio,
    List<PortfolioHolding> concentratedPortfolio)
{
    // Assume concentrated portfolio has higher concentration than diversified
    Assume.That(CalculateMaxConcentration(concentratedPortfolio) > 
                CalculateMaxConcentration(diversifiedPortfolio));
    
    var engine = new FinancialRiskAssessmentEngine();
    
    // Test with same investor and market conditions
    var investor = CreateStandardInvestor();
    var market = CreateNormalMarket();
    
    var diversifiedResult = engine.AssessPortfolioRisk(diversifiedPortfolio, investor, market);
    var concentratedResult = engine.AssessPortfolioRisk(concentratedPortfolio, investor, market);
    
    Assert.That(concentratedResult.ConcentrationRisk, 
                Is.GreaterThan(diversifiedResult.ConcentrationRisk));
}
```

### Focus Areas
- Mathematical property verification
- Edge case boundary testing
- Complex calculation validation
- Financial domain rule testing

---

## 🏆 Success Criteria

For complex logic testing mastery:

### Test Design Quality
- **Comprehensive Coverage**: All branches, conditions, and edge cases tested
- **Boundary Testing**: Edge values and limits thoroughly explored
- **Property Testing**: Mathematical invariants and properties verified
- **Scenario Testing**: Realistic business scenarios covered

### Test Organization
- **Parameterized Tests**: Multiple scenarios tested efficiently
- **Test Data Builders**: Complex objects created easily for testing
- **Clear Test Names**: Test intent is obvious from names
- **Focused Tests**: Each test verifies one specific behavior

### Domain Understanding
- **Business Rule Verification**: Domain logic correctly implemented
- **Edge Case Identification**: Unusual but valid scenarios tested
- **Error Condition Testing**: Invalid inputs handled appropriately
- **Integration Testing**: Components work together correctly

---

## 🎯 Self-Assessment

After completing complex logic testing:

### **Testing Strategy (1-5 scale)**
- [ ] **Coverage**: Can identify and test all important scenarios
- [ ] **Organization**: Can structure large test suites maintainably
- [ ] **Efficiency**: Can test many scenarios without duplication
- [ ] **Clarity**: Tests clearly express business requirements

### **Technical Skills (1-5 scale)**
- [ ] **Parameterization**: Can use parameterized tests effectively
- [ ] **Test Data**: Can create complex test data efficiently
- [ ] **Property Testing**: Can identify and test mathematical properties
- [ ] **Precision**: Can handle floating-point and precision issues

**Target**: All scores should be 4 or 5, representing mastery of complex logic testing.

---

## 🚀 Next Steps

Once you've mastered testing complex logic:

1. **Apply to your domain** - Identify complex business logic in your applications
2. **Practice property-based testing** - Learn tools like QuickCheck, Hypothesis, or FsCheck
3. **Move to [Exercise 5: API and Integration Testing](./exercise-5-integration.md)** - Learn to test system interactions
4. **Study domain testing patterns** - Learn testing patterns specific to your business domain

Remember: Complex logic is where bugs hide. Comprehensive testing of intricate business rules and algorithms is essential for building reliable systems. The investment in thorough testing pays dividends in reduced production issues and increased confidence in your code!
