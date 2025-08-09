const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Family = require('../models/Family');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Check if user belongs to a family
const requireFamily = async (req, res, next) => {
  try {
    if (!req.user.familyId) {
      return res.status(403).json({ 
        message: 'You must be part of a family to access this resource',
        code: 'NO_FAMILY'
      });
    }

    const family = await Family.findById(req.user.familyId);
    if (!family || !family.isActive) {
      return res.status(404).json({ message: 'Family not found or inactive' });
    }

    req.family = family;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying family membership' });
  }
};

// Check specific family permissions
const requireFamilyPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.family) {
        return res.status(403).json({ message: 'Family context required' });
      }

      const hasPermission = req.family.hasPermission(req.user._id, permission);
      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Insufficient permissions: ${permission} required`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};

// Check if user is family admin
const requireFamilyAdmin = async (req, res, next) => {
  try {
    if (!req.family) {
      return res.status(403).json({ message: 'Family context required' });
    }

    const isAdmin = req.family.isAdmin(req.user._id);
    if (!isAdmin) {
      return res.status(403).json({ 
        message: 'Admin privileges required',
        code: 'ADMIN_REQUIRED'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking admin status' });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireFamily,
  requireFamilyPermission,
  requireFamilyAdmin,
  optionalAuth
};