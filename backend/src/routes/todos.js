const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes for personal todo functionality
router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Personal todos endpoint - Coming soon' });
});

router.post('/', authenticateToken, (req, res) => {
  res.json({ message: 'Create personal todo - Coming soon' });
});

module.exports = router;