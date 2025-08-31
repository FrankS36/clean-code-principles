# ❌ BAD EXAMPLE: Poor Function Naming
# This code demonstrates common function naming mistakes

# Problem 1: Functions that don't indicate what they do
def do_stuff(user):
    """What stuff? This name tells us nothing"""
    user.last_login = datetime.now()
    user.login_count += 1
    send_analytics_event('user_login', user.id)

def process(data):
    """Process how? For what purpose?"""
    data['normalized'] = True
    data['processed_at'] = datetime.now()
    return data

# Problem 2: Functions with misleading names
def get_user(user_id):
    """This actually creates AND returns a user if not found"""
    user = database.find_user(user_id)
    if not user:
        user = database.create_user({'id': user_id, 'status': 'new'})
        send_welcome_email(user)  # Side effect not indicated by name
    return user

def validate_email(email):
    """This validates AND modifies the email"""
    email = email.strip().lower()  # Modifies input, not just validates
    return '@' in email and '.' in email

# Problem 3: Generic names that could mean anything
def handle(request):
    """Handle how? What aspect of the request?"""
    if request.method == 'POST':
        return create_resource(request.data)
    elif request.method == 'GET':
        return fetch_resource(request.params)

def manage(item):
    """Manage how? What management action?"""
    if item.needs_update:
        update_item(item)
    if item.needs_notification:
        notify_stakeholders(item)

# Problem 4: Inconsistent vocabulary for similar operations
def get_user_data(user_id):
    return database.fetch_user(user_id)

def fetch_product_info(product_id):
    return database.get_product(product_id)

def retrieve_order_details(order_id):
    return database.find_order(order_id)

def obtain_shipping_info(tracking_id):
    return shipping_api.lookup(tracking_id)

# Problem 5: Functions that don't indicate they have side effects
def calculate_total(order):
    """This calculates but also saves to database - hidden side effect"""
    total = sum(item.price * item.quantity for item in order.items)
    order.total = total
    database.save_order(order)  # Side effect not indicated in name
    analytics.track('order_calculated', order.id)  # Another side effect
    return total

def check_inventory(product_id):
    """This checks but also updates 'last_checked' timestamp"""
    product = get_product(product_id)
    product.last_inventory_check = datetime.now()
    database.save_product(product)  # Side effect
    return product.stock_quantity

# Problem 6: Abbreviations that require mental translation
def proc_ord(ord_data):
    """Process order? Procedure ordination? Unclear abbreviations"""
    # Actually processes an order
    pass

def calc_tax(amt, loc):
    """Calculate tax, but abbreviated parameters are unclear"""
    pass

def upd_usr_pref(usr_id, prefs):
    """Update user preferences, but very hard to read"""
    pass

# Problem 7: Functions that are too generic
def run():
    """Run what? This could be anything"""
    setup_database()
    start_server()
    monitor_health()

def execute():
    """Execute what? Too vague"""
    validate_config()
    initialize_services()
    begin_processing()

# Problem 8: Functions that don't follow verb conventions
def user_authentication(credentials):
    """Should be a verb phrase, not a noun phrase"""
    return validate_credentials(credentials)

def email_validation(email):
    """Should indicate it's performing validation"""
    return '@' in email

def password_strength(password):
    """Doesn't indicate if it's checking, calculating, or setting strength"""
    return len(password) >= 8 and any(c.isdigit() for c in password)

# Problem 9: Functions with unclear return types
def user_status(user_id):
    """Returns boolean? String? Object? Unclear from name"""
    user = get_user(user_id)
    return user.is_active  # Returns boolean, but name suggests it might return status string

def order_items(order_id):
    """Does this return items or sort/order them? Ambiguous"""
    order = get_order(order_id)
    return order.items  # Returns items, but could be confused with sorting

# Problem 10: Functions that try to do multiple things (violates single responsibility)
def save_and_email_user(user):
    """Function name reveals it's doing multiple things"""
    database.save_user(user)
    email_service.send_welcome_email(user.email)
    analytics.track_user_creation(user.id)
    cache.invalidate_user_cache()

def validate_and_process_payment(payment_data):
    """Two responsibilities in one function"""
    if not validate_payment_data(payment_data):
        raise ValidationError("Invalid payment data")
    
    result = payment_gateway.process(payment_data)
    database.save_transaction(result)
    send_receipt_email(payment_data.customer_email)
    return result

# These function names make the code harder to understand and maintain
# Readers can't predict what functions do based on their names
# Side effects are hidden, making debugging and testing difficult
