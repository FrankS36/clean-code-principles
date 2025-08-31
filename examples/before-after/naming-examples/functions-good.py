# ✅ GOOD EXAMPLE: Meaningful Function Naming
# This code demonstrates clean, intention-revealing function names

from datetime import datetime

# Solution 1: Functions with clear, descriptive names
def update_user_login_timestamp(user):
    """Clear what this function does - updates login timestamp"""
    user.last_login = datetime.now()
    user.login_count += 1
    send_analytics_event('user_login', user.id)

def normalize_and_timestamp_data(data):
    """Clear about both actions this function performs"""
    data['normalized'] = True
    data['processed_at'] = datetime.now()
    return data

# Solution 2: Functions with names that match their actual behavior
def find_or_create_user(user_id):
    """Name clearly indicates it might create if not found"""
    user = database.find_user(user_id)
    if not user:
        user = database.create_user({'id': user_id, 'status': 'new'})
        send_welcome_email_to_new_user(user)  # Clear this is a side effect
    return user

def normalize_and_validate_email(email):
    """Clear that this both modifies AND validates"""
    normalized_email = email.strip().lower()
    is_valid = '@' in normalized_email and '.' in normalized_email
    return normalized_email, is_valid

# Solution 3: Specific names that indicate exact purpose
def route_http_request(request):
    """Clear this is handling HTTP routing"""
    if request.method == 'POST':
        return create_resource_from_request(request.data)
    elif request.method == 'GET':
        return fetch_resource_by_params(request.params)

def update_item_and_notify_stakeholders(item):
    """Clear about both responsibilities"""
    if item.needs_update:
        update_item_status(item)
    if item.needs_notification:
        notify_stakeholders_of_change(item)

# Solution 4: Consistent vocabulary for similar operations
def get_user_profile(user_id):
    """Consistent 'get' prefix for all retrieval operations"""
    return database.fetch_user(user_id)

def get_product_details(product_id):
    """Consistent with user function above"""
    return database.fetch_product(product_id)

def get_order_summary(order_id):
    """Consistent vocabulary pattern"""
    return database.fetch_order(order_id)

def get_shipping_status(tracking_id):
    """Consistent with other get operations"""
    return shipping_api.lookup(tracking_id)

# Solution 5: Functions that clearly indicate side effects
def calculate_and_save_order_total(order):
    """Name clearly indicates both calculation AND saving"""
    total = sum(item.price * item.quantity for item in order.items)
    order.total = total
    database.save_order(order)
    track_order_calculation_event(order.id)
    return total

def check_and_update_inventory_timestamp(product_id):
    """Clear that this checks AND updates timestamp"""
    product = get_product(product_id)
    product.last_inventory_check = datetime.now()
    database.save_product(product)
    return product.stock_quantity

# Solution 6: Full, descriptive words instead of abbreviations
def process_customer_order(order_data):
    """Clear, full words that are easy to understand"""
    # Process customer order logic here
    pass

def calculate_sales_tax(amount, location):
    """Descriptive parameters and function name"""
    pass

def update_user_preferences(user_id, preferences):
    """Clear, readable function and parameter names"""
    pass

# Solution 7: Specific, purposeful function names
def initialize_application_services():
    """Clear what 'running' means in this context"""
    setup_database_connection()
    start_web_server()
    begin_health_monitoring()

def execute_data_migration():
    """Specific about what's being executed"""
    validate_migration_config()
    initialize_migration_services()
    begin_data_processing()

# Solution 8: Functions that follow verb convention
def authenticate_user_credentials(credentials):
    """Verb phrase clearly indicates action"""
    return validate_user_credentials(credentials)

def validate_email_format(email):
    """Clear that this validates email format"""
    return '@' in email and '.' in email

def check_password_strength(password):
    """Clear that this checks/evaluates strength"""
    return len(password) >= 8 and any(c.isdigit() for c in password)

# Solution 9: Functions with clear return type indication
def is_user_active(user_id):
    """'is_' prefix clearly indicates boolean return"""
    user = get_user(user_id)
    return user.is_active

def get_order_items(order_id):
    """'get_' prefix clearly indicates retrieval, not sorting"""
    order = get_order(order_id)
    return order.items

def sort_order_items_by_price(order_id):
    """If we wanted sorting, the name would be explicit"""
    order = get_order(order_id)
    return sorted(order.items, key=lambda item: item.price)

# Solution 10: Functions with single responsibility (and names that reflect it)
def save_user_to_database(user):
    """Single responsibility: saving to database"""
    database.save_user(user)

def send_welcome_email_to_new_user(user):
    """Single responsibility: sending welcome email"""
    email_service.send_welcome_email(user.email)

def track_user_creation_analytics(user):
    """Single responsibility: analytics tracking"""
    analytics.track_user_creation(user.id)

def invalidate_user_cache(user_id):
    """Single responsibility: cache invalidation"""
    cache.invalidate_user_cache(user_id)

def register_new_user(user):
    """Orchestration function with clear purpose"""
    save_user_to_database(user)
    send_welcome_email_to_new_user(user)
    track_user_creation_analytics(user)
    invalidate_user_cache(user.id)

# Separated payment validation and processing
def validate_payment_data(payment_data):
    """Single responsibility: validation only"""
    if not payment_data.get('amount') or payment_data['amount'] <= 0:
        return False
    if not payment_data.get('card_number'):
        return False
    return True

def process_validated_payment(payment_data):
    """Single responsibility: processing only"""
    result = payment_gateway.process(payment_data)
    database.save_transaction(result)
    return result

def send_payment_receipt(customer_email, transaction_result):
    """Single responsibility: sending receipt"""
    send_receipt_email(customer_email, transaction_result)

def handle_payment_request(payment_data):
    """Orchestration function that coordinates the workflow"""
    if not validate_payment_data(payment_data):
        raise ValidationError("Invalid payment data")
    
    result = process_validated_payment(payment_data)
    send_payment_receipt(payment_data.customer_email, result)
    return result

# Additional examples of good function naming patterns

# Query functions (return information)
def find_users_by_email_domain(domain):
    """Clear that this searches and returns multiple users"""
    return [user for user in users if user.email.endswith(domain)]

def count_active_subscriptions():
    """Clear that this returns a count"""
    return len([sub for sub in subscriptions if sub.is_active])

# Command functions (perform actions)
def deactivate_expired_subscriptions():
    """Clear that this performs an action on subscriptions"""
    expired_subs = find_expired_subscriptions()
    for subscription in expired_subs:
        subscription.deactivate()

def send_reminder_emails_to_inactive_users():
    """Clear about the specific action being performed"""
    inactive_users = find_users_inactive_for_days(30)
    for user in inactive_users:
        send_reactivation_reminder(user)

# Boolean check functions
def has_valid_subscription(user):
    """Clear yes/no question"""
    return user.subscription and user.subscription.is_active

def can_user_access_premium_features(user):
    """Clear permission check"""
    return user.subscription_tier in ['premium', 'enterprise']

# These function names make the code self-documenting
# Readers can understand what each function does without reading implementation
# Side effects are clearly indicated in names
# Each function has a single, clear responsibility
