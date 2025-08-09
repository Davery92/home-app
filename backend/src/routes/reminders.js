const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes for personal reminders functionality
router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Personal reminders endpoint - Coming soon' });
});

router.post('/', authenticateToken, (req, res) => {
  res.json({ message: 'Create personal reminder - Coming soon' });
});

module.exports = router;