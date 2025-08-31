// ✅ GOOD EXAMPLE: Excellent Vertical Formatting
// This code is organized like a well-written newspaper article

// =============================================================================
// EXTERNAL DEPENDENCIES
// =============================================================================
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

const { validateEmail, validatePassword, validatePhoneNumber } = require('./utils/validation');
const { sendEmail, sendSMS } = require('./utils/notifications');
const { logInfo, logError, logWarning } = require('./utils/logging');

// =============================================================================
// APPLICATION CONFIGURATION
// =============================================================================
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// RATE LIMITING CONFIGURATION
// =============================================================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 attempts per window
  message: 'Too many login attempts, please try again later.'
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // 100 requests per window
  message: 'Too many requests, please try again later.'
});

// Apply rate limiting
app.use('/api/auth/login', loginLimiter);
app.use('/api/', generalLimiter);

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '24h';
const PORT = process.env.PORT || 3000;

// Email configuration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS
};

// =============================================================================
// PASSWORD UTILITY FUNCTIONS
// =============================================================================
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logError('Password hashing failed', { error: error.message });
    throw new Error('Password hashing failed');
  }
}

async function comparePassword(plainPassword, hashedPassword) {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    logError('Password comparison failed', { error: error.message });
    throw new Error('Password comparison failed');
  }
}

// =============================================================================
// JWT TOKEN FUNCTIONS
// =============================================================================
function generateToken(user) {
  try {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return token;
  } catch (error) {
    logError('Token generation failed', { userId: user.id, error: error.message });
    throw new Error('Token generation failed');
  }
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    logError('Token verification failed', { error: error.message });
    throw new Error('Invalid or expired token');
  }
}

// =============================================================================
// USER AUTHENTICATION FUNCTIONS
// =============================================================================
async function authenticateUser(email, password) {
  try {
    const user = await User.findByEmail(email);
    if (!user) {
      logWarning('Authentication attempt with non-existent email', { email });
      return null;
    }
    
    const isPasswordValid = await comparePassword(password, user.hashedPassword);
    if (!isPasswordValid) {
      logWarning('Authentication attempt with invalid password', { userId: user.id });
      return null;
    }
    
    logInfo('User authenticated successfully', { userId: user.id });
    return user;
  } catch (error) {
    logError('Authentication process failed', { email, error: error.message });
    throw new Error('Authentication failed');
  }
}

async function createNewUser(userData) {
  try {
    const { email, password, firstName, lastName, phoneNumber } = userData;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Create new user
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      email,
      hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role: 'customer',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    logInfo('New user created successfully', { userId: newUser.id, email });
    return newUser;
  } catch (error) {
    logError('User creation failed', { email: userData.email, error: error.message });
    throw error;
  }
}

// =============================================================================
// NOTIFICATION FUNCTIONS
// =============================================================================
async function sendWelcomeNotifications(user) {
  try {
    // Send welcome email
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      data: { firstName: user.firstName }
    });
    
    // Send welcome SMS if phone number provided
    if (user.phoneNumber) {
      await sendSMS({
        to: user.phoneNumber,
        message: `Welcome ${user.firstName}! Your account has been created successfully.`
      });
    }
    
    logInfo('Welcome notifications sent', { userId: user.id });
  } catch (error) {
    logError('Failed to send welcome notifications', { 
      userId: user.id, 
      error: error.message 
    });
  }
}

// =============================================================================
// INPUT VALIDATION FUNCTIONS
// =============================================================================
function validateRegistrationInput(userData) {
  const { email, password, firstName, lastName, phoneNumber } = userData;
  
  if (!email || !validateEmail(email)) {
    throw new Error('Valid email is required');
  }
  
  if (!password || !validatePassword(password)) {
    throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
  }
  
  if (!firstName || firstName.trim().length < 2) {
    throw new Error('First name must be at least 2 characters');
  }
  
  if (!lastName || lastName.trim().length < 2) {
    throw new Error('Last name must be at least 2 characters');
  }
  
  if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
    throw new Error('Invalid phone number format');
  }
}

function validateLoginInput(credentials) {
  const { email, password } = credentials;
  
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
}

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate input
    validateRegistrationInput(userData);
    
    // Create user
    const user = await createNewUser(userData);
    
    // Send notifications
    await sendWelcomeNotifications(user);
    
    // Generate token
    const token = generateToken(user);
    
    // Send response
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
    
  } catch (error) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: error.message });
    }
    
    if (error.message.includes('email') || error.message.includes('password') || 
        error.message.includes('name') || error.message.includes('phone')) {
      return res.status(400).json({ error: error.message });
    }
    
    logError('Registration endpoint error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const credentials = req.body;
    
    // Validate input
    validateLoginInput(credentials);
    
    // Authenticate user
    const user = await authenticateUser(credentials.email, credentials.password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    await User.updateLastLogin(user.id);
    
    // Generate token
    const token = generateToken(user);
    
    // Send response
    logInfo('User logged in successfully', { userId: user.id });
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
    
  } catch (error) {
    if (error.message === 'Email and password are required') {
      return res.status(400).json({ error: error.message });
    }
    
    logError('Login endpoint error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// USER PROFILE ROUTES
// =============================================================================
app.get('/api/users/profile', async (req, res) => {
  try {
    // Extract and verify token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    const decoded = verifyToken(token);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Send user profile
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    logError('Profile endpoint error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// SERVER STARTUP
// =============================================================================
app.listen(PORT, () => {
  logInfo('Server started successfully', { port: PORT });
  console.log(`Server running on port ${PORT}`);
});

// Benefits of this formatting:
// 1. Clear logical organization like a newspaper article
// 2. Related concepts are grouped together in sections
// 3. Blank lines separate different concerns
// 4. Easy to find specific functionality
// 5. Clear file structure and hierarchy from imports to startup
// 6. Related functions are near each other
// 7. Constants are grouped together at the top
// 8. Middleware configuration is organized and clear
// 9. Visual separation makes scanning easy
// 10. Professional appearance that's easy to navigate and maintain
