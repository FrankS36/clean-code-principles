# Exercise 5: API and Integration Testing

Master the art of testing system interactions, API endpoints, database integrations, and external service communications with confidence and reliability.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Design integration test strategies for complex systems
- Test API endpoints with various scenarios and edge cases
- Handle database interactions and data consistency in tests
- Test external service integrations with proper isolation
- Create reliable tests that don't depend on external systems
- Build integration test suites that run consistently

## 📝 Exercise Format

Each problem presents a system component that interacts with external dependencies. Your job is to create comprehensive integration tests that verify the complete workflows while maintaining test reliability and speed.

---

## Problem 1: REST API Testing

### System Under Test
```javascript
// Express.js API with authentication, validation, and database interactions
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

class UserAPI {
    constructor(userService, authService, logger) {
        this.userService = userService;
        this.authService = authService;
        this.logger = logger;
        this.router = express.Router();
        this.setupRoutes();
    }
    
    setupRoutes() {
        // Authentication endpoints
        this.router.post('/auth/login', 
            this.validateLogin(),
            this.handleLogin.bind(this));
        
        this.router.post('/auth/register',
            this.validateRegistration(),
            this.handleRegistration.bind(this));
        
        this.router.post('/auth/refresh',
            this.authenticateToken.bind(this),
            this.handleRefreshToken.bind(this));
        
        // User management endpoints
        this.router.get('/users',
            this.authenticateToken.bind(this),
            this.requireAdmin.bind(this),
            this.handleGetUsers.bind(this));
        
        this.router.get('/users/:id',
            this.authenticateToken.bind(this),
            this.authorizeUserAccess.bind(this),
            this.handleGetUser.bind(this));
        
        this.router.put('/users/:id',
            this.authenticateToken.bind(this),
            this.authorizeUserAccess.bind(this),
            this.validateUserUpdate(),
            this.handleUpdateUser.bind(this));
        
        this.router.delete('/users/:id',
            this.authenticateToken.bind(this),
            this.requireAdmin.bind(this),
            this.handleDeleteUser.bind(this));
        
        // Profile endpoints
        this.router.get('/profile',
            this.authenticateToken.bind(this),
            this.handleGetProfile.bind(this));
        
        this.router.put('/profile',
            this.authenticateToken.bind(this),
            this.validateProfileUpdate(),
            this.handleUpdateProfile.bind(this));
        
        this.router.post('/profile/avatar',
            this.authenticateToken.bind(this),
            this.handleUploadAvatar.bind(this));
    }
    
    validateLogin() {
        return [
            body('email').isEmail().normalizeEmail(),
            body('password').isLength({ min: 1 }).withMessage('Password is required'),
        ];
    }
    
    validateRegistration() {
        return [
            body('email').isEmail().normalizeEmail(),
            body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
            body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
            body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
            body('dateOfBirth').isISO8601().toDate(),
        ];
    }
    
    validateUserUpdate() {
        return [
            body('email').optional().isEmail().normalizeEmail(),
            body('firstName').optional().trim().isLength({ min: 2 }),
            body('lastName').optional().trim().isLength({ min: 2 }),
            body('role').optional().isIn(['user', 'admin', 'moderator']),
        ];
    }
    
    validateProfileUpdate() {
        return [
            body('firstName').optional().trim().isLength({ min: 2 }),
            body('lastName').optional().trim().isLength({ min: 2 }),
            body('bio').optional().trim().isLength({ max: 500 }),
            body('preferences.newsletter').optional().isBoolean(),
            body('preferences.notifications').optional().isBoolean(),
        ];
    }
    
    async authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        
        try {
            const decoded = await this.authService.verifyToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            this.logger.warn('Token verification failed', { token, error: error.message });
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
    }
    
    async requireAdmin(req, res, next) {
        if (req.user.role !== 'admin') {
            this.logger.warn('Admin access required', { userId: req.user.id, role: req.user.role });
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    }
    
    async authorizeUserAccess(req, res, next) {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;
        const userRole = req.user.role;
        
        // Allow access if user is accessing their own data or is an admin
        if (currentUserId === targetUserId || userRole === 'admin') {
            next();
        } else {
            this.logger.warn('Unauthorized user access attempt', { 
                currentUserId, 
                targetUserId, 
                userRole 
            });
            return res.status(403).json({ error: 'Access denied' });
        }
    }
    
    async handleLogin(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }
            
            const { email, password } = req.body;
            
            // Find user by email
            const user = await this.userService.findByEmail(email);
            if (!user) {
                this.logger.info('Login attempt with non-existent email', { email });
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Check if account is locked
            if (user.isLocked && user.lockUntil > Date.now()) {
                this.logger.warn('Login attempt on locked account', { userId: user.id, email });
                return res.status(423).json({ 
                    error: 'Account locked', 
                    unlockTime: user.lockUntil 
                });
            }
            
            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                await this.userService.recordFailedLogin(user.id);
                this.logger.warn('Invalid password attempt', { userId: user.id, email });
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Reset failed login attempts and unlock account
            await this.userService.recordSuccessfulLogin(user.id);
            
            // Generate tokens
            const accessToken = await this.authService.generateAccessToken(user);
            const refreshToken = await this.authService.generateRefreshToken(user);
            
            this.logger.info('Successful login', { userId: user.id, email });
            
            res.json({
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                }
            });
            
        } catch (error) {
            this.logger.error('Login error', { error: error.message, stack: error.stack });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleRegistration(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }
            
            const { email, password, firstName, lastName, dateOfBirth } = req.body;
            
            // Check if user already exists
            const existingUser = await this.userService.findByEmail(email);
            if (existingUser) {
                this.logger.info('Registration attempt with existing email', { email });
                return res.status(409).json({ error: 'User already exists' });
            }
            
            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);
            
            // Create user
            const newUser = await this.userService.create({
                email,
                passwordHash,
                firstName,
                lastName,
                dateOfBirth,
                role: 'user',
                isEmailVerified: false,
                createdAt: new Date()
            });
            
            // Send verification email
            await this.authService.sendVerificationEmail(newUser);
            
            this.logger.info('User registered successfully', { userId: newUser.id, email });
            
            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName
                }
            });
            
        } catch (error) {
            this.logger.error('Registration error', { error: error.message, stack: error.stack });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleGetUser(req, res) {
        try {
            const userId = req.params.id;
            const user = await this.userService.findById(userId);
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Return different levels of detail based on access
            const isOwnProfile = req.user.id === userId;
            const isAdmin = req.user.role === 'admin';
            
            const userData = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                createdAt: user.createdAt
            };
            
            // Include sensitive information for own profile or admin
            if (isOwnProfile || isAdmin) {
                userData.isEmailVerified = user.isEmailVerified;
                userData.lastLoginAt = user.lastLoginAt;
                userData.preferences = user.preferences;
            }
            
            // Include admin-only information
            if (isAdmin) {
                userData.isLocked = user.isLocked;
                userData.failedLoginAttempts = user.failedLoginAttempts;
            }
            
            res.json({ user: userData });
            
        } catch (error) {
            this.logger.error('Get user error', { error: error.message, userId: req.params.id });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleUpdateUser(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }
            
            const userId = req.params.id;
            const updates = req.body;
            
            // Check if user exists
            const user = await this.userService.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Check for email conflicts
            if (updates.email && updates.email !== user.email) {
                const existingUser = await this.userService.findByEmail(updates.email);
                if (existingUser) {
                    return res.status(409).json({ error: 'Email already in use' });
                }
            }
            
            // Validate role changes
            if (updates.role && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admins can change user roles' });
            }
            
            // Update user
            const updatedUser = await this.userService.update(userId, updates);
            
            this.logger.info('User updated', { userId, updatedBy: req.user.id });
            
            res.json({
                message: 'User updated successfully',
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    role: updatedUser.role
                }
            });
            
        } catch (error) {
            this.logger.error('Update user error', { error: error.message, userId: req.params.id });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleDeleteUser(req, res) {
        try {
            const userId = req.params.id;
            
            // Check if user exists
            const user = await this.userService.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Prevent self-deletion
            if (userId === req.user.id) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }
            
            // Soft delete user
            await this.userService.softDelete(userId);
            
            this.logger.info('User deleted', { userId, deletedBy: req.user.id });
            
            res.status(204).send();
            
        } catch (error) {
            this.logger.error('Delete user error', { error: error.message, userId: req.params.id });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    getRouter() {
        return this.router;
    }
}

module.exports = UserAPI;
```

### Your Task
Create comprehensive integration tests for this API.

### Requirements
- [ ] **Test all endpoints** - authentication, user management, profile operations
- [ ] **Test authentication flows** - login, registration, token refresh, access control
- [ ] **Test validation** - input validation, business rule validation
- [ ] **Test error scenarios** - invalid data, missing resources, authorization failures
- [ ] **Test edge cases** - account locking, email conflicts, role changes
- [ ] **Use test database** - isolated test data for each test
- [ ] **Mock external services** - email service, file upload service

### Integration Testing Strategy

#### Test Setup and Database Management
```javascript
const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

describe('UserAPI Integration Tests', () => {
    let app;
    let mongoServer;
    let userService;
    let authService;
    let logger;
    let userAPI;
    
    beforeAll(async () => {
        // Start in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        
        // Setup test services
        userService = new UserService(mongoose.connection);
        authService = new MockAuthService();
        logger = new MockLogger();
        
        // Create API instance
        userAPI = new UserAPI(userService, authService, logger);
        
        // Setup Express app
        app = express();
        app.use(express.json());
        app.use('/api', userAPI.getRouter());
    });
    
    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });
    
    beforeEach(async () => {
        // Clear database before each test
        await mongoose.connection.db.dropDatabase();
    });
    
    describe('Authentication Endpoints', () => {
        describe('POST /api/auth/register', () => {
            it('should register a new user with valid data', async () => {
                const userData = {
                    email: 'test@example.com',
                    password: 'securepassword123',
                    firstName: 'John',
                    lastName: 'Doe',
                    dateOfBirth: '1990-01-01'
                };
                
                const response = await request(app)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(201);
                
                expect(response.body).toMatchObject({
                    message: 'User registered successfully',
                    user: {
                        email: 'test@example.com',
                        firstName: 'John',
                        lastName: 'Doe'
                    }
                });
                
                // Verify user was created in database
                const user = await userService.findByEmail('test@example.com');
                expect(user).toBeDefined();
                expect(user.firstName).toBe('John');
                
                // Verify verification email was sent
                expect(authService.sendVerificationEmail).toHaveBeenCalledWith(
                    expect.objectContaining({ email: 'test@example.com' })
                );
            });
            
            it('should return 409 when email already exists', async () => {
                // Create existing user
                await userService.create({
                    email: 'existing@example.com',
                    passwordHash: 'hashedpassword',
                    firstName: 'Existing',
                    lastName: 'User'
                });
                
                const userData = {
                    email: 'existing@example.com',
                    password: 'newpassword123',
                    firstName: 'New',
                    lastName: 'User',
                    dateOfBirth: '1995-01-01'
                };
                
                const response = await request(app)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(409);
                
                expect(response.body.error).toBe('User already exists');
            });
            
            it('should return 400 for invalid input data', async () => {
                const invalidData = {
                    email: 'invalid-email',
                    password: '123', // Too short
                    firstName: 'A', // Too short
                    lastName: '', // Empty
                    dateOfBirth: 'invalid-date'
                };
                
                const response = await request(app)
                    .post('/api/auth/register')
                    .send(invalidData)
                    .expect(400);
                
                expect(response.body.error).toBe('Validation failed');
                expect(response.body.details).toHaveLength(5);
            });
        });
        
        describe('POST /api/auth/login', () => {
            beforeEach(async () => {
                // Create test user
                const passwordHash = await bcrypt.hash('correctpassword', 12);
                await userService.create({
                    email: 'testuser@example.com',
                    passwordHash,
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'user',
                    isLocked: false,
                    failedLoginAttempts: 0
                });
            });
            
            it('should login with correct credentials', async () => {
                const credentials = {
                    email: 'testuser@example.com',
                    password: 'correctpassword'
                };
                
                const response = await request(app)
                    .post('/api/auth/login')
                    .send(credentials)
                    .expect(200);
                
                expect(response.body).toMatchObject({
                    accessToken: expect.any(String),
                    refreshToken: expect.any(String),
                    user: {
                        email: 'testuser@example.com',
                        firstName: 'Test',
                        lastName: 'User',
                        role: 'user'
                    }
                });
                
                // Verify tokens were generated
                expect(authService.generateAccessToken).toHaveBeenCalled();
                expect(authService.generateRefreshToken).toHaveBeenCalled();
            });
            
            it('should return 401 for incorrect password', async () => {
                const credentials = {
                    email: 'testuser@example.com',
                    password: 'wrongpassword'
                };
                
                const response = await request(app)
                    .post('/api/auth/login')
                    .send(credentials)
                    .expect(401);
                
                expect(response.body.error).toBe('Invalid credentials');
                
                // Verify failed login was recorded
                const user = await userService.findByEmail('testuser@example.com');
                expect(user.failedLoginAttempts).toBe(1);
            });
        });
    });
    
    describe('Protected Endpoints', () => {
        let authToken;
        let testUser;
        
        beforeEach(async () => {
            // Create and authenticate test user
            testUser = await createTestUser();
            authToken = await authService.generateAccessToken(testUser);
        });
        
        describe('GET /api/users/:id', () => {
            it('should allow user to access their own profile', async () => {
                const response = await request(app)
                    .get(`/api/users/${testUser.id}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
                
                expect(response.body.user).toMatchObject({
                    id: testUser.id,
                    email: testUser.email,
                    firstName: testUser.firstName,
                    lastName: testUser.lastName,
                    isEmailVerified: expect.any(Boolean),
                    preferences: expect.any(Object)
                });
            });
            
            it('should deny access to other users profile for non-admin', async () => {
                const otherUser = await createTestUser({ email: 'other@example.com' });
                
                const response = await request(app)
                    .get(`/api/users/${otherUser.id}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(403);
                
                expect(response.body.error).toBe('Access denied');
            });
            
            it('should require authentication', async () => {
                const response = await request(app)
                    .get(`/api/users/${testUser.id}`)
                    .expect(401);
                
                expect(response.body.error).toBe('Access token required');
            });
        });
    });
});

// Helper functions
async function createTestUser(overrides = {}) {
    const defaultUser = {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password', 12),
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isEmailVerified: true,
        preferences: {
            newsletter: true,
            notifications: true
        }
    };
    
    return userService.create({ ...defaultUser, ...overrides });
}

class MockAuthService {
    async generateAccessToken(user) {
        return jwt.sign({ id: user.id, role: user.role }, 'test-secret', { expiresIn: '1h' });
    }
    
    async generateRefreshToken(user) {
        return jwt.sign({ id: user.id }, 'test-refresh-secret', { expiresIn: '7d' });
    }
    
    async verifyToken(token) {
        return jwt.verify(token, 'test-secret');
    }
    
    async sendVerificationEmail(user) {
        // Mock implementation
        return Promise.resolve();
    }
}

class MockLogger {
    info() {}
    warn() {}
    error() {}
}
```

### Focus Areas
- Complete API workflow testing
- Authentication and authorization testing
- Database interaction testing
- Error handling verification

---

## Problem 2: Database Integration Testing

### System Under Test
```python
# Complex database operations with transactions, relationships, and business logic
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.exc import IntegrityError, DatabaseError
from datetime import datetime, timedelta
from typing import List, Optional
import uuid

Base = declarative_base()

class Customer(Base):
    __tablename__ = 'customers'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    orders = relationship("Order", back_populates="customer")
    addresses = relationship("Address", back_populates="customer")

class Address(Base):
    __tablename__ = 'addresses'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String, ForeignKey('customers.id'), nullable=False)
    street = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip_code = Column(String, nullable=False)
    country = Column(String, default='US')
    is_primary = Column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="addresses")

class Order(Base):
    __tablename__ = 'orders'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String, ForeignKey('customers.id'), nullable=False)
    order_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default='pending')
    total_amount = Column(Numeric(10, 2), nullable=False)
    shipping_address_id = Column(String, ForeignKey('addresses.id'))
    notes = Column(Text)
    
    customer = relationship("Customer", back_populates="orders")
    shipping_address = relationship("Address", foreign_keys=[shipping_address_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

class OrderItem(Base):
    __tablename__ = 'order_items'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey('orders.id'), nullable=False)
    product_id = Column(String, ForeignKey('products.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class OrderRepository:
    def __init__(self, session: Session):
        self.session = session
    
    def create_order_with_items(self, customer_id: str, items: List[dict], 
                               shipping_address_id: str, notes: str = None) -> Order:
        """Create an order with items in a single transaction"""
        try:
            # Validate customer exists
            customer = self.session.query(Customer).filter_by(id=customer_id).first()
            if not customer:
                raise ValueError(f"Customer {customer_id} not found")
            
            # Validate shipping address belongs to customer
            if shipping_address_id:
                address = self.session.query(Address).filter_by(
                    id=shipping_address_id, 
                    customer_id=customer_id
                ).first()
                if not address:
                    raise ValueError("Invalid shipping address for customer")
            
            # Calculate total and validate inventory
            total_amount = 0
            order_items = []
            
            for item_data in items:
                product_id = item_data['product_id']
                quantity = item_data['quantity']
                
                # Get product and check availability
                product = self.session.query(Product).filter_by(
                    id=product_id, 
                    is_active=True
                ).first()
                
                if not product:
                    raise ValueError(f"Product {product_id} not found or inactive")
                
                if product.stock_quantity < quantity:
                    raise ValueError(f"Insufficient stock for product {product.name}. "
                                   f"Available: {product.stock_quantity}, Requested: {quantity}")
                
                # Create order item
                order_item = OrderItem(
                    product_id=product_id,
                    quantity=quantity,
                    unit_price=product.price
                )
                order_items.append(order_item)
                
                total_amount += product.price * quantity
                
                # Reserve inventory
                product.stock_quantity -= quantity
            
            # Create order
            order = Order(
                customer_id=customer_id,
                total_amount=total_amount,
                shipping_address_id=shipping_address_id,
                notes=notes,
                status='confirmed'
            )
            
            # Add items to order
            order.items = order_items
            
            self.session.add(order)
            self.session.commit()
            
            return order
            
        except Exception as e:
            self.session.rollback()
            raise
    
    def cancel_order(self, order_id: str, reason: str = None) -> bool:
        """Cancel an order and restore inventory"""
        try:
            order = self.session.query(Order).filter_by(id=order_id).first()
            if not order:
                raise ValueError(f"Order {order_id} not found")
            
            if order.status in ['cancelled', 'shipped', 'delivered']:
                raise ValueError(f"Cannot cancel order with status: {order.status}")
            
            # Restore inventory
            for order_item in order.items:
                product = order_item.product
                product.stock_quantity += order_item.quantity
            
            # Update order status
            order.status = 'cancelled'
            order.notes = f"{order.notes or ''}\nCancelled: {reason or 'No reason provided'}"
            
            self.session.commit()
            return True
            
        except Exception as e:
            self.session.rollback()
            raise
    
    def get_customer_orders(self, customer_id: str, 
                           status_filter: str = None,
                           date_from: datetime = None,
                           date_to: datetime = None) -> List[Order]:
        """Get orders for a customer with optional filters"""
        query = self.session.query(Order).filter_by(customer_id=customer_id)
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        if date_from:
            query = query.filter(Order.order_date >= date_from)
        
        if date_to:
            query = query.filter(Order.order_date <= date_to)
        
        return query.order_by(Order.order_date.desc()).all()
    
    def get_order_summary_stats(self, date_from: datetime, date_to: datetime) -> dict:
        """Get order summary statistics for a date range"""
        from sqlalchemy import func
        
        # Total orders and revenue
        stats = self.session.query(
            func.count(Order.id).label('total_orders'),
            func.sum(Order.total_amount).label('total_revenue'),
            func.avg(Order.total_amount).label('average_order_value')
        ).filter(
            Order.order_date >= date_from,
            Order.order_date <= date_to,
            Order.status != 'cancelled'
        ).first()
        
        # Orders by status
        status_counts = self.session.query(
            Order.status,
            func.count(Order.id).label('count')
        ).filter(
            Order.order_date >= date_from,
            Order.order_date <= date_to
        ).group_by(Order.status).all()
        
        # Top customers
        top_customers = self.session.query(
            Customer.first_name,
            Customer.last_name,
            Customer.email,
            func.count(Order.id).label('order_count'),
            func.sum(Order.total_amount).label('total_spent')
        ).join(Order).filter(
            Order.order_date >= date_from,
            Order.order_date <= date_to,
            Order.status != 'cancelled'
        ).group_by(
            Customer.id, Customer.first_name, Customer.last_name, Customer.email
        ).order_by(
            func.sum(Order.total_amount).desc()
        ).limit(5).all()
        
        return {
            'total_orders': stats.total_orders or 0,
            'total_revenue': float(stats.total_revenue or 0),
            'average_order_value': float(stats.average_order_value or 0),
            'orders_by_status': {status: count for status, count in status_counts},
            'top_customers': [
                {
                    'name': f"{customer.first_name} {customer.last_name}",
                    'email': customer.email,
                    'order_count': customer.order_count,
                    'total_spent': float(customer.total_spent)
                }
                for customer in top_customers
            ]
        }
    
    def update_order_shipping_status(self, order_id: str, tracking_number: str) -> Order:
        """Update order to shipped status with tracking information"""
        try:
            order = self.session.query(Order).filter_by(id=order_id).first()
            if not order:
                raise ValueError(f"Order {order_id} not found")
            
            if order.status != 'confirmed':
                raise ValueError(f"Can only ship confirmed orders. Current status: {order.status}")
            
            order.status = 'shipped'
            order.notes = f"{order.notes or ''}\nShipped with tracking: {tracking_number}"
            
            self.session.commit()
            return order
            
        except Exception as e:
            self.session.rollback()
            raise
    
    def process_bulk_order_updates(self, updates: List[dict]) -> dict:
        """Process multiple order updates in a single transaction"""
        results = {
            'successful': [],
            'failed': []
        }
        
        try:
            for update in updates:
                order_id = update['order_id']
                new_status = update['status']
                notes = update.get('notes', '')
                
                try:
                    order = self.session.query(Order).filter_by(id=order_id).first()
                    if not order:
                        results['failed'].append({
                            'order_id': order_id,
                            'error': 'Order not found'
                        })
                        continue
                    
                    # Validate status transition
                    if not self._is_valid_status_transition(order.status, new_status):
                        results['failed'].append({
                            'order_id': order_id,
                            'error': f'Invalid status transition from {order.status} to {new_status}'
                        })
                        continue
                    
                    order.status = new_status
                    if notes:
                        order.notes = f"{order.notes or ''}\n{notes}"
                    
                    results['successful'].append(order_id)
                    
                except Exception as e:
                    results['failed'].append({
                        'order_id': order_id,
                        'error': str(e)
                    })
            
            # Only commit if there were no critical errors
            if len(results['failed']) == 0:
                self.session.commit()
            else:
                # If there are failures, decide whether to commit partial success
                # For this example, we'll commit successful updates
                self.session.commit()
            
            return results
            
        except Exception as e:
            self.session.rollback()
            raise
    
    def _is_valid_status_transition(self, current_status: str, new_status: str) -> bool:
        """Validate if a status transition is allowed"""
        valid_transitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'returned'],
            'delivered': ['returned'],
            'cancelled': [],  # No transitions from cancelled
            'returned': []    # No transitions from returned
        }
        
        return new_status in valid_transitions.get(current_status, [])
```

### Your Task
Create comprehensive database integration tests.

### Requirements
- [ ] **Test transactional operations** - order creation, cancellation, bulk updates
- [ ] **Test data consistency** - inventory updates, referential integrity
- [ ] **Test complex queries** - filtering, aggregations, joins
- [ ] **Test error scenarios** - constraint violations, rollbacks
- [ ] **Test concurrent access** - race conditions, locking
- [ ] **Use test database** - isolated environment for each test
- [ ] **Test database performance** - query optimization verification

### Database Testing Strategy

#### Test Database Setup
```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from testcontainers.postgres import PostgresContainer
import uuid

@pytest.fixture(scope="session")
def test_database():
    """Create test database using testcontainers"""
    with PostgresContainer("postgres:13") as postgres:
        engine = create_engine(postgres.get_connection_url())
        Base.metadata.create_all(engine)
        yield engine

@pytest.fixture
def db_session(test_database):
    """Create a database session for each test"""
    Session = sessionmaker(bind=test_database)
    session = Session()
    
    # Start a transaction
    transaction = session.begin()
    
    yield session
    
    # Rollback the transaction to clean up
    transaction.rollback()
    session.close()

@pytest.fixture
def order_repository(db_session):
    """Create an order repository instance"""
    return OrderRepository(db_session)

@pytest.fixture
def sample_customer(db_session):
    """Create a sample customer for testing"""
    customer = Customer(
        email='test@example.com',
        first_name='John',
        last_name='Doe',
        phone='555-1234'
    )
    db_session.add(customer)
    db_session.commit()
    return customer

@pytest.fixture
def sample_address(db_session, sample_customer):
    """Create a sample address for testing"""
    address = Address(
        customer_id=sample_customer.id,
        street='123 Main St',
        city='Anytown',
        state='CA',
        zip_code='12345',
        is_primary=True
    )
    db_session.add(address)
    db_session.commit()
    return address

@pytest.fixture
def sample_products(db_session):
    """Create sample products for testing"""
    products = [
        Product(name='Widget A', price=10.99, stock_quantity=100),
        Product(name='Widget B', price=25.50, stock_quantity=50),
        Product(name='Widget C', price=5.75, stock_quantity=200)
    ]
    
    for product in products:
        db_session.add(product)
    
    db_session.commit()
    return products

class TestOrderRepository:
    
    def test_create_order_with_items_success(self, order_repository, sample_customer, 
                                           sample_address, sample_products):
        """Test successful order creation with inventory updates"""
        # Arrange
        items = [
            {'product_id': sample_products[0].id, 'quantity': 2},
            {'product_id': sample_products[1].id, 'quantity': 1}
        ]
        
        initial_stock_a = sample_products[0].stock_quantity
        initial_stock_b = sample_products[1].stock_quantity
        
        # Act
        order = order_repository.create_order_with_items(
            customer_id=sample_customer.id,
            items=items,
            shipping_address_id=sample_address.id,
            notes="Test order"
        )
        
        # Assert
        assert order is not None
        assert order.customer_id == sample_customer.id
        assert order.status == 'confirmed'
        assert len(order.items) == 2
        assert float(order.total_amount) == (10.99 * 2) + (25.50 * 1)
        
        # Verify inventory was updated
        db_session = order_repository.session
        updated_product_a = db_session.query(Product).filter_by(id=sample_products[0].id).first()
        updated_product_b = db_session.query(Product).filter_by(id=sample_products[1].id).first()
        
        assert updated_product_a.stock_quantity == initial_stock_a - 2
        assert updated_product_b.stock_quantity == initial_stock_b - 1
    
    def test_create_order_insufficient_stock_rollback(self, order_repository, sample_customer, 
                                                     sample_address, sample_products):
        """Test that order creation rolls back when insufficient stock"""
        # Arrange
        items = [
            {'product_id': sample_products[0].id, 'quantity': 1000}  # More than available
        ]
        
        initial_stock = sample_products[0].stock_quantity
        
        # Act & Assert
        with pytest.raises(ValueError, match="Insufficient stock"):
            order_repository.create_order_with_items(
                customer_id=sample_customer.id,
                items=items,
                shipping_address_id=sample_address.id
            )
        
        # Verify inventory was not changed
        db_session = order_repository.session
        product = db_session.query(Product).filter_by(id=sample_products[0].id).first()
        assert product.stock_quantity == initial_stock
        
        # Verify no order was created
        orders = db_session.query(Order).filter_by(customer_id=sample_customer.id).all()
        assert len(orders) == 0
    
    def test_cancel_order_restores_inventory(self, order_repository, sample_customer, 
                                           sample_address, sample_products):
        """Test that cancelling an order restores inventory"""
        # Arrange - Create an order first
        items = [
            {'product_id': sample_products[0].id, 'quantity': 3}
        ]
        
        order = order_repository.create_order_with_items(
            customer_id=sample_customer.id,
            items=items,
            shipping_address_id=sample_address.id
        )
        
        # Get stock after order creation
        db_session = order_repository.session
        product_after_order = db_session.query(Product).filter_by(id=sample_products[0].id).first()
        stock_after_order = product_after_order.stock_quantity
        
        # Act - Cancel the order
        result = order_repository.cancel_order(order.id, "Customer requested cancellation")
        
        # Assert
        assert result is True
        
        # Verify order status
        cancelled_order = db_session.query(Order).filter_by(id=order.id).first()
        assert cancelled_order.status == 'cancelled'
        assert 'Customer requested cancellation' in cancelled_order.notes
        
        # Verify inventory was restored
        product_after_cancel = db_session.query(Product).filter_by(id=sample_products[0].id).first()
        assert product_after_cancel.stock_quantity == stock_after_order + 3
    
    def test_get_order_summary_stats(self, order_repository, sample_customer, 
                                   sample_address, sample_products):
        """Test order summary statistics calculation"""
        # Arrange - Create multiple orders
        from datetime import datetime, timedelta
        
        base_date = datetime.utcnow()
        date_from = base_date - timedelta(days=7)
        date_to = base_date + timedelta(days=1)
        
        # Create orders with different statuses
        for i in range(3):
            items = [{'product_id': sample_products[0].id, 'quantity': 1}]
            order = order_repository.create_order_with_items(
                customer_id=sample_customer.id,
                items=items,
                shipping_address_id=sample_address.id
            )
            
            if i == 2:  # Cancel the last order
                order_repository.cancel_order(order.id, "Test cancellation")
        
        # Act
        stats = order_repository.get_order_summary_stats(date_from, date_to)
        
        # Assert
        assert stats['total_orders'] == 2  # Cancelled orders excluded
        assert stats['total_revenue'] == 21.98  # 2 orders × 10.99
        assert stats['average_order_value'] == 10.99
        assert stats['orders_by_status']['confirmed'] == 2
        assert stats['orders_by_status']['cancelled'] == 1
        assert len(stats['top_customers']) == 1
        assert stats['top_customers'][0]['name'] == 'John Doe'
    
    def test_concurrent_order_creation_inventory_consistency(self, test_database):
        """Test that concurrent order creation maintains inventory consistency"""
        import threading
        import time
        
        # Setup
        Session = sessionmaker(bind=test_database)
        
        # Create test data
        setup_session = Session()
        customer = Customer(email='concurrent@test.com', first_name='Test', last_name='User')
        product = Product(name='Limited Stock', price=50.0, stock_quantity=5)
        address = Address(
            customer_id=customer.id,
            street='123 Test St',
            city='Test City',
            state='TS',
            zip_code='12345'
        )
        
        setup_session.add(customer)
        setup_session.add(product)
        setup_session.commit()
        
        address.customer_id = customer.id
        setup_session.add(address)
        setup_session.commit()
        setup_session.close()
        
        # Test concurrent order creation
        results = []
        exceptions = []
        
        def create_order(thread_id):
            try:
                session = Session()
                repository = OrderRepository(session)
                
                items = [{'product_id': product.id, 'quantity': 2}]
                order = repository.create_order_with_items(
                    customer_id=customer.id,
                    items=items,
                    shipping_address_id=address.id,
                    notes=f"Concurrent order {thread_id}"
                )
                results.append(order.id)
                session.close()
                
            except Exception as e:
                exceptions.append(str(e))
        
        # Start multiple threads trying to create orders
        threads = []
        for i in range(5):
            thread = threading.Thread(target=create_order, args=(i,))
            threads.append(thread)
        
        for thread in threads:
            thread.start()
        
        for thread in threads:
            thread.join()
        
        # Verify results
        # Should have 2 successful orders (5 stock / 2 quantity each = 2 orders max)
        # and 3 failures due to insufficient stock
        assert len(results) == 2
        assert len(exceptions) == 3
        
        # Verify final stock quantity
        final_session = Session()
        final_product = final_session.query(Product).filter_by(id=product.id).first()
        assert final_product.stock_quantity == 1  # 5 - (2 × 2) = 1
        final_session.close()
```

### Focus Areas
- Transaction management and rollbacks
- Data consistency and referential integrity  
- Complex query testing
- Concurrent access patterns

---

## Problem 3: External Service Integration Testing

### System Under Test
```java
// Payment processing service with multiple external integrations
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class PaymentProcessingService {
    
    private final PaymentGateway primaryGateway;
    private final PaymentGateway backupGateway;
    private final FraudDetectionService fraudService;
    private final NotificationService notificationService;
    private final PaymentRepository paymentRepository;
    private final ConfigurationService configService;
    private final MetricsCollector metricsCollector;
    
    public PaymentProcessingService(PaymentGateway primaryGateway,
                                  PaymentGateway backupGateway,
                                  FraudDetectionService fraudService,
                                  NotificationService notificationService,
                                  PaymentRepository paymentRepository,
                                  ConfigurationService configService,
                                  MetricsCollector metricsCollector) {
        this.primaryGateway = primaryGateway;
        this.backupGateway = backupGateway;
        this.fraudService = fraudService;
        this.notificationService = notificationService;
        this.paymentRepository = paymentRepository;
        this.configService = configService;
        this.metricsCollector = metricsCollector;
    }
    
    public CompletableFuture<PaymentResult> processPayment(PaymentRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Record payment attempt
                Payment payment = createPaymentRecord(request);
                
                // Validate payment request
                validatePaymentRequest(request);
                
                // Check for fraud
                FraudCheckResult fraudResult = fraudService.checkPayment(request);
                
                if (fraudResult.isHighRisk()) {
                    payment.setStatus(PaymentStatus.FRAUD_DETECTED);
                    payment.setFailureReason("High fraud risk: " + fraudResult.getRiskFactors());
                    paymentRepository.save(payment);
                    
                    // Notify security team
                    notificationService.sendFraudAlert(request.getCustomerId(), fraudResult);
                    
                    metricsCollector.incrementCounter("payment.fraud_detected");
                    
                    return PaymentResult.failure(payment.getId(), "Payment declined for security reasons");
                }
                
                // Process payment through gateway
                PaymentResult result = processWithGateway(request, payment);
                
                // Handle post-processing
                handlePostProcessing(payment, result);
                
                return result;
                
            } catch (Exception e) {
                metricsCollector.incrementCounter("payment.processing_error");
                throw new PaymentProcessingException("Error processing payment", e);
            }
        });
    }
    
    private PaymentResult processWithGateway(PaymentRequest request, Payment payment) {
        PaymentGateway gateway = selectGateway(request);
        
        try {
            GatewayPaymentRequest gatewayRequest = buildGatewayRequest(request);
            GatewayPaymentResponse response = gateway.processPayment(gatewayRequest);
            
            PaymentResult result = mapGatewayResponse(response, payment);
            
            // Update payment record
            payment.setGatewayTransactionId(response.getTransactionId());
            payment.setGatewayResponseCode(response.getResponseCode());
            payment.setProcessedAt(LocalDateTime.now());
            
            if (result.isSuccessful()) {
                payment.setStatus(PaymentStatus.COMPLETED);
                metricsCollector.incrementCounter("payment.successful");
                metricsCollector.recordTimer("payment.processing_time", 
                    calculateProcessingTime(payment));
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason(response.getFailureReason());
                metricsCollector.incrementCounter("payment.failed");
            }
            
            paymentRepository.save(payment);
            return result;
            
        } catch (GatewayTimeoutException e) {
            // Try backup gateway if primary fails
            if (gateway == primaryGateway && shouldUseBackupGateway()) {
                metricsCollector.incrementCounter("payment.gateway_failover");
                return processWithBackupGateway(request, payment);
            }
            
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Gateway timeout");
            paymentRepository.save(payment);
            
            return PaymentResult.failure(payment.getId(), "Payment processing timeout");
            
        } catch (GatewayException e) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Gateway error: " + e.getMessage());
            paymentRepository.save(payment);
            
            metricsCollector.incrementCounter("payment.gateway_error");
            return PaymentResult.failure(payment.getId(), "Payment processing failed");
        }
    }
    
    private PaymentResult processWithBackupGateway(PaymentRequest request, Payment payment) {
        try {
            GatewayPaymentRequest gatewayRequest = buildGatewayRequest(request);
            GatewayPaymentResponse response = backupGateway.processPayment(gatewayRequest);
            
            PaymentResult result = mapGatewayResponse(response, payment);
            
            payment.setGatewayTransactionId(response.getTransactionId());
            payment.setGatewayResponseCode(response.getResponseCode());
            payment.setProcessedAt(LocalDateTime.now());
            payment.setGatewayUsed("backup");
            
            if (result.isSuccessful()) {
                payment.setStatus(PaymentStatus.COMPLETED);
                metricsCollector.incrementCounter("payment.backup_gateway_successful");
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason(response.getFailureReason());
                metricsCollector.incrementCounter("payment.backup_gateway_failed");
            }
            
            paymentRepository.save(payment);
            return result;
            
        } catch (Exception e) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Backup gateway failed: " + e.getMessage());
            paymentRepository.save(payment);
            
            return PaymentResult.failure(payment.getId(), "Payment processing failed on all gateways");
        }
    }
    
    private void handlePostProcessing(Payment payment, PaymentResult result) {
        if (result.isSuccessful()) {
            // Send confirmation notifications
            CompletableFuture.runAsync(() -> {
                try {
                    notificationService.sendPaymentConfirmation(
                        payment.getCustomerId(), 
                        payment.getId(),
                        payment.getAmount()
                    );
                } catch (Exception e) {
                    // Log notification failure but don't fail the payment
                    metricsCollector.incrementCounter("notification.payment_confirmation_failed");
                }
            });
            
            // Update customer payment history
            CompletableFuture.runAsync(() -> {
                try {
                    updateCustomerPaymentHistory(payment);
                } catch (Exception e) {
                    // Log but don't fail
                    metricsCollector.incrementCounter("customer_history.update_failed");
                }
            });
            
            // Process any applicable rewards
            if (payment.getAmount().compareTo(BigDecimal.valueOf(100)) >= 0) {
                CompletableFuture.runAsync(() -> {
                    try {
                        processRewardsForPayment(payment);
                    } catch (Exception e) {
                        metricsCollector.incrementCounter("rewards.processing_failed");
                    }
                });
            }
        }
    }
    
    public CompletableFuture<RefundResult> processRefund(RefundRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Validate refund request
                validateRefundRequest(request);
                
                // Get original payment
                Payment originalPayment = paymentRepository.findById(request.getOriginalPaymentId())
                    .orElseThrow(() -> new PaymentNotFoundException("Original payment not found"));
                
                // Validate refund eligibility
                validateRefundEligibility(originalPayment, request);
                
                // Create refund record
                Refund refund = createRefundRecord(request, originalPayment);
                
                // Process through gateway
                PaymentGateway gateway = getGatewayForPayment(originalPayment);
                GatewayRefundRequest gatewayRequest = buildRefundRequest(request, originalPayment);
                GatewayRefundResponse response = gateway.processRefund(gatewayRequest);
                
                // Update refund record
                refund.setGatewayTransactionId(response.getTransactionId());
                refund.setProcessedAt(LocalDateTime.now());
                
                RefundResult result;
                if (response.isSuccessful()) {
                    refund.setStatus(RefundStatus.COMPLETED);
                    result = RefundResult.success(refund.getId(), response.getTransactionId());
                    
                    // Send refund notification
                    notificationService.sendRefundConfirmation(
                        originalPayment.getCustomerId(),
                        refund.getId(),
                        refund.getAmount()
                    );
                    
                    metricsCollector.incrementCounter("refund.successful");
                } else {
                    refund.setStatus(RefundStatus.FAILED);
                    refund.setFailureReason(response.getFailureReason());
                    result = RefundResult.failure(refund.getId(), response.getFailureReason());
                    
                    metricsCollector.incrementCounter("refund.failed");
                }
                
                paymentRepository.saveRefund(refund);
                return result;
                
            } catch (Exception e) {
                metricsCollector.incrementCounter("refund.processing_error");
                throw new RefundProcessingException("Error processing refund", e);
            }
        });
    }
    
    public List<Payment> getPaymentHistory(String customerId, PaymentHistoryFilter filter) {
        try {
            List<Payment> payments = paymentRepository.findByCustomerId(
                customerId, 
                filter.getFromDate(),
                filter.getToDate(),
                filter.getStatuses(),
                filter.getLimit()
            );
            
            // Enrich with additional data if needed
            if (filter.isIncludeRefunds()) {
                enrichWithRefundData(payments);
            }
            
            if (filter.isIncludeDisputes()) {
                enrichWithDisputeData(payments);
            }
            
            return payments;
            
        } catch (Exception e) {
            metricsCollector.incrementCounter("payment_history.query_error");
            throw new PaymentHistoryException("Error retrieving payment history", e);
        }
    }
    
    // Validation methods
    private void validatePaymentRequest(PaymentRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidPaymentRequestException("Payment amount must be positive");
        }
        
        if (request.getAmount().compareTo(configService.getMaxPaymentAmount()) > 0) {
            throw new InvalidPaymentRequestException("Payment amount exceeds maximum allowed");
        }
        
        if (request.getCurrency() == null || !configService.getSupportedCurrencies().contains(request.getCurrency())) {
            throw new InvalidPaymentRequestException("Unsupported currency");
        }
        
        if (request.getPaymentMethod() == null) {
            throw new InvalidPaymentRequestException("Payment method is required");
        }
    }
    
    private void validateRefundRequest(RefundRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidRefundRequestException("Refund amount must be positive");
        }
        
        if (request.getOriginalPaymentId() == null) {
            throw new InvalidRefundRequestException("Original payment ID is required");
        }
    }
    
    private void validateRefundEligibility(Payment originalPayment, RefundRequest request) {
        if (originalPayment.getStatus() != PaymentStatus.COMPLETED) {
            throw new RefundNotEligibleException("Can only refund completed payments");
        }
        
        // Check refund time window
        LocalDateTime paymentDate = originalPayment.getProcessedAt();
        LocalDateTime refundDeadline = paymentDate.plusDays(configService.getRefundWindowDays());
        
        if (LocalDateTime.now().isAfter(refundDeadline)) {
            throw new RefundNotEligibleException("Refund window has expired");
        }
        
        // Check if refund amount exceeds original payment
        BigDecimal totalRefunded = paymentRepository.getTotalRefundedAmount(originalPayment.getId());
        BigDecimal newTotal = totalRefunded.add(request.getAmount());
        
        if (newTotal.compareTo(originalPayment.getAmount()) > 0) {
            throw new RefundNotEligibleException("Refund amount exceeds original payment amount");
        }
    }
    
    // Helper methods...
    private PaymentGateway selectGateway(PaymentRequest request) {
        // Gateway selection logic based on amount, region, payment method, etc.
        return primaryGateway;
    }
    
    private boolean shouldUseBackupGateway() {
        return configService.isBackupGatewayEnabled();
    }
    
    private PaymentGateway getGatewayForPayment(Payment payment) {
        String gatewayUsed = payment.getGatewayUsed();
        return "backup".equals(gatewayUsed) ? backupGateway : primaryGateway;
    }
    
    // Additional helper methods...
}
```

### Your Task
Create comprehensive integration tests for this payment service.

### Requirements
- [ ] **Test external service interactions** - payment gateways, fraud detection, notifications
- [ ] **Test failover scenarios** - primary gateway failure, backup gateway usage
- [ ] **Test async operations** - concurrent payment processing, notification handling
- [ ] **Test error handling** - network timeouts, service unavailability
- [ ] **Test business workflows** - payment, refund, fraud detection flows
- [ ] **Mock external dependencies** - use test doubles for external services
- [ ] **Test retry mechanisms** - gateway failures, temporary service outages

### External Service Testing Strategy

#### Service Mocking and Stubbing
```java
@ExtendWith(MockitoExtension.class)
class PaymentProcessingServiceIntegrationTest {
    
    @Mock private PaymentGateway primaryGateway;
    @Mock private PaymentGateway backupGateway;
    @Mock private FraudDetectionService fraudService;
    @Mock private NotificationService notificationService;
    @Mock private PaymentRepository paymentRepository;
    @Mock private ConfigurationService configService;
    @Mock private MetricsCollector metricsCollector;
    
    private PaymentProcessingService paymentService;
    
    @BeforeEach
    void setUp() {
        paymentService = new PaymentProcessingService(
            primaryGateway, backupGateway, fraudService,
            notificationService, paymentRepository, 
            configService, metricsCollector
        );
        
        // Setup default configuration
        when(configService.getMaxPaymentAmount()).thenReturn(BigDecimal.valueOf(10000));
        when(configService.getSupportedCurrencies()).thenReturn(Set.of("USD", "EUR"));
        when(configService.isBackupGatewayEnabled()).thenReturn(true);
        when(configService.getRefundWindowDays()).thenReturn(30);
    }
    
    @Test
    void processPayment_SuccessfulFlow_CompletesPayment() throws Exception {
        // Arrange
        PaymentRequest request = createValidPaymentRequest();
        
        // Mock fraud check
        FraudCheckResult fraudResult = FraudCheckResult.lowRisk();
        when(fraudService.checkPayment(request)).thenReturn(fraudResult);
        
        // Mock gateway response
        GatewayPaymentResponse gatewayResponse = GatewayPaymentResponse.success(
            "txn_123456", "00", "Approved"
        );
        when(primaryGateway.processPayment(any(GatewayPaymentRequest.class)))
            .thenReturn(gatewayResponse);
        
        // Mock payment repository
        Payment savedPayment = createPayment(request);
        when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);
        
        // Act
        CompletableFuture<PaymentResult> future = paymentService.processPayment(request);
        PaymentResult result = future.get(5, TimeUnit.SECONDS);
        
        // Assert
        assertThat(result.isSuccessful()).isTrue();
        assertThat(result.getTransactionId()).isEqualTo("txn_123456");
        
        // Verify interactions
        verify(fraudService).checkPayment(request);
        verify(primaryGateway).processPayment(any(GatewayPaymentRequest.class));
        verify(paymentRepository, times(2)).save(any(Payment.class)); // Initial save + final save
        verify(notificationService).sendPaymentConfirmation(
            eq(request.getCustomerId()), 
            any(String.class), 
            eq(request.getAmount())
        );
        verify(metricsCollector).incrementCounter("payment.successful");
        
        // Verify no backup gateway was used
        verify(backupGateway, never()).processPayment(any());
    }
    
    @Test
    void processPayment_FraudDetected_RejectsPayment() throws Exception {
        // Arrange
        PaymentRequest request = createValidPaymentRequest();
        
        FraudCheckResult fraudResult = FraudCheckResult.highRisk(
            List.of("Unusual location", "High velocity")
        );
        when(fraudService.checkPayment(request)).thenReturn(fraudResult);
        
        Payment savedPayment = createPayment(request);
        when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);
        
        // Act
        CompletableFuture<PaymentResult> future = paymentService.processPayment(request);
        PaymentResult result = future.get(5, TimeUnit.SECONDS);
        
        // Assert
        assertThat(result.isSuccessful()).isFalse();
        assertThat(result.getFailureReason()).contains("security reasons");
        
        // Verify fraud handling
        verify(notificationService).sendFraudAlert(
            eq(request.getCustomerId()), 
            eq(fraudResult)
        );
        verify(metricsCollector).incrementCounter("payment.fraud_detected");
        
        // Verify payment gateway was not called
        verify(primaryGateway, never()).processPayment(any());
        verify(backupGateway, never()).processPayment(any());
    }
    
    @Test
    void processPayment_PrimaryGatewayTimeout_UsesBackupGateway() throws Exception {
        // Arrange
        PaymentRequest request = createValidPaymentRequest();
        
        FraudCheckResult fraudResult = FraudCheckResult.lowRisk();
        when(fraudService.checkPayment(request)).thenReturn(fraudResult);
        
        // Primary gateway times out
        when(primaryGateway.processPayment(any(GatewayPaymentRequest.class)))
            .thenThrow(new GatewayTimeoutException("Request timeout"));
        
        // Backup gateway succeeds
        GatewayPaymentResponse backupResponse = GatewayPaymentResponse.success(
            "backup_txn_789", "00", "Approved via backup"
        );
        when(backupGateway.processPayment(any(GatewayPaymentRequest.class)))
            .thenReturn(backupResponse);
        
        Payment savedPayment = createPayment(request);
        when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);
        
        // Act
        CompletableFuture<PaymentResult> future = paymentService.processPayment(request);
        PaymentResult result = future.get(5, TimeUnit.SECONDS);
        
        // Assert
        assertThat(result.isSuccessful()).isTrue();
        assertThat(result.getTransactionId()).isEqualTo("backup_txn_789");
        
        // Verify failover behavior
        verify(primaryGateway).processPayment(any(GatewayPaymentRequest.class));
        verify(backupGateway).processPayment(any(GatewayPaymentRequest.class));
        verify(metricsCollector).incrementCounter("payment.gateway_failover");
        verify(metricsCollector).incrementCounter("payment.backup_gateway_successful");
    }
    
    @Test
    void processRefund_ValidRequest_ProcessesSuccessfully() throws Exception {
        // Arrange
        RefundRequest refundRequest = createValidRefundRequest();
        Payment originalPayment = createCompletedPayment();
        
        when(paymentRepository.findById(refundRequest.getOriginalPaymentId()))
            .thenReturn(Optional.of(originalPayment));
        when(paymentRepository.getTotalRefundedAmount(originalPayment.getId()))
            .thenReturn(BigDecimal.ZERO);
        
        GatewayRefundResponse gatewayResponse = GatewayRefundResponse.success(
            "refund_123", "Refund processed"
        );
        when(primaryGateway.processRefund(any(GatewayRefundRequest.class)))
            .thenReturn(gatewayResponse);
        
        Refund savedRefund = createRefund(refundRequest);
        when(paymentRepository.saveRefund(any(Refund.class))).thenReturn(savedRefund);
        
        // Act
        CompletableFuture<RefundResult> future = paymentService.processRefund(refundRequest);
        RefundResult result = future.get(5, TimeUnit.SECONDS);
        
        // Assert
        assertThat(result.isSuccessful()).isTrue();
        assertThat(result.getTransactionId()).isEqualTo("refund_123");
        
        // Verify interactions
        verify(primaryGateway).processRefund(any(GatewayRefundRequest.class));
        verify(notificationService).sendRefundConfirmation(
            eq(originalPayment.getCustomerId()),
            any(String.class),
            eq(refundRequest.getAmount())
        );
        verify(metricsCollector).incrementCounter("refund.successful");
    }
    
    @Test
    void processRefund_RefundWindowExpired_ThrowsException() {
        // Arrange
        RefundRequest refundRequest = createValidRefundRequest();
        Payment originalPayment = createCompletedPayment();
        
        // Set payment date to 45 days ago (beyond 30-day window)
        originalPayment.setProcessedAt(LocalDateTime.now().minusDays(45));
        
        when(paymentRepository.findById(refundRequest.getOriginalPaymentId()))
            .thenReturn(Optional.of(originalPayment));
        
        // Act & Assert
        CompletableFuture<RefundResult> future = paymentService.processRefund(refundRequest);
        
        assertThrows(ExecutionException.class, () -> {
            future.get(5, TimeUnit.SECONDS);
        });
        
        // Verify no gateway call was made
        verify(primaryGateway, never()).processRefund(any());
        verify(backupGateway, never()).processRefund(any());
    }
    
    @Test
    void processPayment_ConcurrentRequests_HandlesCorrectly() throws Exception {
        // Arrange
        int numberOfRequests = 10;
        List<PaymentRequest> requests = IntStream.range(0, numberOfRequests)
            .mapToObj(i -> createValidPaymentRequest("customer_" + i))
            .collect(Collectors.toList());
        
        // Setup mocks for all requests
        when(fraudService.checkPayment(any())).thenReturn(FraudCheckResult.lowRisk());
        when(primaryGateway.processPayment(any()))
            .thenReturn(GatewayPaymentResponse.success("txn_" + System.nanoTime(), "00", "Approved"));
        when(paymentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        
        // Act
        List<CompletableFuture<PaymentResult>> futures = requests.stream()
            .map(paymentService::processPayment)
            .collect(Collectors.toList());
        
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(
            futures.toArray(new CompletableFuture[0])
        );
        
        allFutures.get(30, TimeUnit.SECONDS);
        
        // Collect results
        List<PaymentResult> results = futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());
        
        // Assert
        assertThat(results).hasSize(numberOfRequests);
        assertThat(results).allMatch(PaymentResult::isSuccessful);
        
        // Verify all requests were processed
        verify(fraudService, times(numberOfRequests)).checkPayment(any());
        verify(primaryGateway, times(numberOfRequests)).processPayment(any());
        verify(metricsCollector, times(numberOfRequests)).incrementCounter("payment.successful");
    }
    
    // Helper methods for creating test data
    private PaymentRequest createValidPaymentRequest() {
        return createValidPaymentRequest("customer_123");
    }
    
    private PaymentRequest createValidPaymentRequest(String customerId) {
        return PaymentRequest.builder()
            .customerId(customerId)
            .amount(BigDecimal.valueOf(99.99))
            .currency("USD")
            .paymentMethod(PaymentMethod.CREDIT_CARD)
            .build();
    }
    
    private Payment createPayment(PaymentRequest request) {
        Payment payment = new Payment();
        payment.setId(UUID.randomUUID().toString());
        payment.setCustomerId(request.getCustomerId());
        payment.setAmount(request.getAmount());
        payment.setCurrency(request.getCurrency());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        return payment;
    }
    
    private Payment createCompletedPayment() {
        Payment payment = new Payment();
        payment.setId(UUID.randomUUID().toString());
        payment.setCustomerId("customer_123");
        payment.setAmount(BigDecimal.valueOf(199.99));
        payment.setCurrency("USD");
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setProcessedAt(LocalDateTime.now().minusDays(5));
        payment.setGatewayTransactionId("original_txn_456");
        return payment;
    }
    
    private RefundRequest createValidRefundRequest() {
        return RefundRequest.builder()
            .originalPaymentId("payment_123")
            .amount(BigDecimal.valueOf(50.00))
            .reason("Customer requested refund")
            .build();
    }
    
    private Refund createRefund(RefundRequest request) {
        Refund refund = new Refund();
        refund.setId(UUID.randomUUID().toString());
        refund.setOriginalPaymentId(request.getOriginalPaymentId());
        refund.setAmount(request.getAmount());
        refund.setReason(request.getReason());
        refund.setStatus(RefundStatus.PENDING);
        refund.setCreatedAt(LocalDateTime.now());
        return refund;
    }
}
```

### Focus Areas
- External service interaction testing
- Failover and retry mechanism testing
- Asynchronous operation testing
- Error handling and recovery testing

---

## 🏆 Success Criteria

For integration testing mastery:

### Integration Test Quality
- **Complete Workflows**: End-to-end business processes are tested
- **External Dependencies**: All external integrations are properly tested
- **Error Scenarios**: Failure modes and recovery mechanisms are verified
- **Performance**: Integration tests run efficiently and reliably

### Test Reliability
- **Isolation**: Tests don't depend on external systems or shared state
- **Deterministic**: Tests produce consistent results across environments
- **Fast Execution**: Integration tests complete in reasonable time
- **Clear Failures**: Test failures provide actionable debugging information

### System Verification
- **API Contracts**: Endpoint behaviors match specifications
- **Data Consistency**: Database operations maintain integrity
- **Service Communication**: External service interactions work correctly
- **Business Rules**: Domain logic is correctly implemented

---

## 🎯 Self-Assessment

After completing integration testing exercises:

### **Integration Strategy (1-5 scale)**
- [ ] **Test Design**: Can design comprehensive integration test strategies
- [ ] **Dependency Management**: Can handle external dependencies effectively
- [ ] **Error Testing**: Can test complex failure scenarios thoroughly
- [ ] **Performance**: Can ensure integration tests are efficient and reliable

### **Technical Implementation (1-5 scale)**
- [ ] **API Testing**: Can test REST APIs with all scenarios and edge cases
- [ ] **Database Testing**: Can test complex database operations and transactions
- [ ] **Service Integration**: Can test external service interactions with proper mocking
- [ ] **Async Testing**: Can test concurrent and asynchronous operations correctly

**Target**: All scores should be 4 or 5, representing mastery of integration testing.

---

## 🚀 Congratulations!

You've completed the comprehensive Testing and TDD exercise series! You now have mastery of:

1. **TDD Fundamentals** - Red-Green-Refactor cycle and test-first development
2. **Testability Refactoring** - Making legacy code testable through good design
3. **Mocking and Test Doubles** - Isolating units under test effectively
4. **Complex Logic Testing** - Testing intricate business rules and algorithms  
5. **Integration Testing** - Testing system interactions and external dependencies

### **Your Testing Toolkit Now Includes:**
- **Comprehensive test strategies** for any system component
- **Test-driven development** as a design methodology
- **Legacy code improvement** through testability refactoring
- **Professional testing practices** for production systems
- **Integration testing** for complex system interactions

### **Next Steps in Your Clean Code Journey:**
1. **Apply these skills** to your real projects immediately
2. **Practice TDD daily** - make it your default development approach
3. **Move to [Classes and SOLID Exercises](../09-classes/README.md)** - Master object-oriented design
4. **Become a testing advocate** - help your team adopt these practices

**You've mastered one of the most valuable skills in software development - congratulations!** 🎉
