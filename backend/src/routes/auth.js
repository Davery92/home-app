const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Family = require('../models/Family');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      profile: { firstName, lastName }
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    console.log('🔐 Login attempt received:', { email: req.body.email, timestamp: new Date().toISOString() });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('🔍 Searching for user:', email);

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    console.log('👤 User found:', user ? `Yes (ID: ${user._id}, Active: ${user.isActive})` : 'No');
    
    if (!user || !user.isActive) {
      console.log('❌ Login failed: User not found or inactive');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    console.log('🔑 Checking password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔑 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get user with family info if they belong to one
    let familyInfo = null;
    if (user.familyId) {
      familyInfo = await Family.findById(user.familyId).select('name memberCount');
    }

    console.log('✅ Login successful for user:', user.email);
    
    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
      family: familyInfo
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'familyId',
      select: 'name memberCount inviteCode'
    });

    res.json({
      user: user.toJSON(),
      family: user.familyId || null
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('dateOfBirth').optional().isISO8601(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    const { firstName, lastName, dateOfBirth } = req.body;

    if (firstName) updates['profile.firstName'] = firstName;
    if (lastName) updates['profile.lastName'] = lastName;
    if (dateOfBirth) updates['profile.dateOfBirth'] = new Date(dateOfBirth);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Update user settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { notifications, privacy, preferences } = req.body;
    
    const updates = {};
    if (notifications) updates['settings.notifications'] = notifications;
    if (privacy) updates['settings.privacy'] = privacy;
    if (preferences) updates['settings.preferences'] = preferences;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Settings updated successfully',
      settings: user.settings
    });

  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', authenticateToken, (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({ message: 'Logout successful' });
});

module.exports = router;