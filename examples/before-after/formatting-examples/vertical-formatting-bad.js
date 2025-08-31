// ❌ BAD EXAMPLE: Poor Vertical Formatting
// This code has no organization and is hard to navigate

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const { validateEmail, validatePassword, validatePhoneNumber } = require('./utils/validation');
const { sendEmail, sendSMS } = require('./utils/notifications');
const { logInfo, logError, logWarning } = require('./utils/logging');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const app = express();
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.'
});
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/', generalLimiter);
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '24h';
const PORT = process.env.PORT || 3000;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
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
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
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
async function sendWelcomeNotifications(user) {
  try {
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      data: { firstName: user.firstName }
    });
    if (user.phoneNumber) {
      await sendSMS({
        to: user.phoneNumber,
        message: `Welcome ${user.firstName}! Your account has been created successfully.`
      });
    }
    logInfo('Welcome notifications sent', { userId: user.id });
  } catch (error) {
    logError('Failed to send welcome notifications', { userId: user.id, error: error.message });
  }
}
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || !validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
    }
    if (!firstName || firstName.trim().length < 2) {
      return res.status(400).json({ error: 'First name must be at least 2 characters' });
    }
    if (!lastName || lastName.trim().length < 2) {
      return res.status(400).json({ error: 'Last name must be at least 2 characters' });
    }
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    const user = await createNewUser({ email, password, firstName, lastName, phoneNumber });
    await sendWelcomeNotifications(user);
    const token = generateToken(user);
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
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = generateToken(user);
    await User.updateLastLogin(user.id);
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
    logError('Login endpoint error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/api/users/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
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
app.listen(PORT, () => {
  logInfo('Server started successfully', { port: PORT });
  console.log(`Server running on port ${PORT}`);
});

// Problems with this formatting:
// 1. No logical organization - everything is mixed together
// 2. Imports, middleware, constants, functions, and routes all jumbled
// 3. No blank lines to separate different concepts
// 4. Hard to find specific functionality
// 5. No clear file structure or hierarchy
// 6. Related functions are scattered throughout
// 7. Constants are mixed with function definitions
// 8. Middleware configuration is spread around
// 9. No visual separation between different concerns
// 10. Impossible to quickly scan or navigate
