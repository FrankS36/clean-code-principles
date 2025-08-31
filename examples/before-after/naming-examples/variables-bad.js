// ❌ BAD EXAMPLE: Poor Variable Naming
// This code demonstrates common variable naming mistakes

// Problem 1: Single letter variables with no context
let d = new Date();
let u = getCurrentUser();
let p = calculatePrice(cart);

// Problem 2: Abbreviations that require mental translation
let usr = getUser();
let addr = usr.getAddr();
let ph = usr.getPhNum();
let qty = item.getQty();

// Problem 3: Numbers series without meaning
let data1 = fetchUserData();
let data2 = fetchProductData();
let data3 = fetchOrderData();

// Problem 4: Misleading names (these aren't actually arrays/lists)
let userList = getCurrentUser(); // returns single user object
let productList = findProduct(id); // returns single product
let orderList = getLatestOrder(); // returns single order

// Problem 5: Magic numbers embedded in code
function processPayment(amount) {
    if (amount > 1000) { // What does 1000 represent?
        return applyDiscountRate(amount, 0.15); // What's 0.15?
    }
    return amount;
}

// Problem 6: Non-descriptive generic names
let data = api.fetch('/users/123');
let result = process(data);
let temp = result.transform();
let final = temp.validate();

// Problem 7: Hungarian notation (outdated practice)
let strFirstName = "John";
let intAge = 25;
let bIsActive = true;
let arrProducts = [];

// Problem 8: Noise words that don't add meaning
let userData = getUser();
let userInfo = userData.getInfo();
let userObject = new User();
let productData = getProduct();

// Problem 9: Context-free names
function validate(input) { // Validate what? How?
    return input.length > 0;
}

function process(item) { // Process how? For what purpose?
    item.status = 'done';
    return item;
}

// Problem 10: Inconsistent vocabulary
class UserService {
    getUser(id) { /* fetches user */ }
    fetchUserProfile(id) { /* gets profile - inconsistent with get */ }
    retrieveUserSettings(id) { /* obtains settings - third different verb */ }
    obtainUserPreferences(id) { /* fourth different verb for same concept */ }
}

// Problem 11: Names that don't reveal intent
let flag = true; // What does this flag control?
let count = 0; // Count of what?
let status = 'pending'; // Status of what?

// Problem 12: Technical jargon when business terms would be clearer
let dbRecord = getCustomerRecord(id);
let jsonResponse = api.call('/endpoint');
let httpStatus = response.getStatus();

// This code works, but it's hard to understand and maintain
// The reader has to constantly translate between what the code says
// and what it actually means
