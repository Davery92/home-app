const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const PersonalReminder = require('../models/PersonalReminder');
const { authenticateToken } = require('../middleware/auth');

// Get all personal reminders for authenticated user
router.get('/', authenticateToken, [
  query('type').optional().isIn(['medication', 'appointment', 'task', 'bill', 'call', 'event', 'personal', 'work', 'other']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('completed').optional().isBoolean(),
  query('upcoming').optional().isBoolean(),
  query('overdue').optional().isBoolean(),
  query('category').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('skip').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, priority, completed, upcoming, overdue, category, limit = 50, skip = 0 } = req.query;
    const userId = req.user._id;

    // Build filter
    const filter = { userId, isArchived: false };
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (completed !== undefined) filter.completed = completed === 'true';
    if (category) filter.category = new RegExp(category, 'i');
    
    // Date-based filters
    if (upcoming === 'true') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      filter.dueDate = { $gte: new Date(), $lte: tomorrow };
      filter.completed = false;
    }
    
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.completed = false;
    }

    const reminders = await PersonalReminder.find(filter)
      .sort({ completed: 1, priority: -1, dueDate: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Get stats
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const stats = await PersonalReminder.aggregate([
      { $match: { userId: req.user._id, isArchived: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          pending: { $sum: { $cond: ['$completed', 0, 1] } },
          overdue: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $not: '$completed' },
                  { $lt: ['$dueDate', now] }
                ]}, 
                1, 
                0 
              ] 
            } 
          },
          upcoming: {
            $sum: {
              $cond: [
                { $and: [
                  { $not: '$completed' },
                  { $gte: ['$dueDate', now] },
                  { $lte: ['$dueDate', tomorrow] }
                ]},
                1,
                0
              ]
            }
          },
          high_priority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      reminders: reminders.map(reminder => ({
        ...reminder,
        id: reminder._id,
        isOverdue: !reminder.completed && reminder.dueDate && now > reminder.dueDate,
        isUpcoming: !reminder.completed && reminder.dueDate && reminder.dueDate <= tomorrow && reminder.dueDate >= now,
        isSnoozed: reminder.snoozedUntil && now < reminder.snoozedUntil
      })),
      stats: stats.length > 0 ? stats[0] : {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        upcoming: 0,
        high_priority: 0,
        urgent: 0
      }
    });

  } catch (error) {
    console.error('Error fetching personal reminders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reminders',
      error: error.message 
    });
  }
});

// Create a new personal reminder
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('type').optional().isIn(['medication', 'appointment', 'task', 'bill', 'call', 'event', 'personal', 'work', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').isISO8601().withMessage('Valid due date required'),
  body('reminderTime').isISO8601().withMessage('Valid reminder time required'),
  body('allDay').optional().isBoolean(),
  body('recurring.enabled').optional().isBoolean(),
  body('recurring.frequency').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  body('notifications.enabled').optional().isBoolean(),
  body('location').optional().isLength({ max: 200 }),
  body('tags').optional().isArray(),
  body('tags.*').optional().isLength({ max: 30 }),
  body('category').optional().isLength({ max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reminderData = {
      ...req.body,
      userId: req.user._id
    };

    const reminder = new PersonalReminder(reminderData);
    await reminder.save();

    res.status(201).json({
      success: true,
      message: 'Personal reminder created successfully',
      reminder: {
        ...reminder.toJSON(),
        id: reminder._id
      }
    });

  } catch (error) {
    console.error('Error creating personal reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create reminder',
      error: error.message 
    });
  }
});

// Update a personal reminder
router.put('/:reminderId', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('type').optional().isIn(['medication', 'appointment', 'task', 'bill', 'call', 'event', 'personal', 'work', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601(),
  body('reminderTime').optional().isISO8601(),
  body('completed').optional().isBoolean(),
  body('allDay').optional().isBoolean(),
  body('location').optional().isLength({ max: 200 }),
  body('tags').optional().isArray(),
  body('tags.*').optional().isLength({ max: 30 }),
  body('category').optional().isLength({ max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reminderId } = req.params;
    const userId = req.user._id;

    const reminder = await PersonalReminder.findOne({ _id: reminderId, userId });
    if (!reminder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reminder not found' 
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key === 'completed' && req.body[key] && !reminder.completed) {
        // Mark as completed
        reminder.completed = true;
        reminder.completedAt = new Date();
      } else if (key === 'completed' && !req.body[key] && reminder.completed) {
        // Mark as not completed
        reminder.completed = false;
        reminder.completedAt = null;
      } else {
        reminder[key] = req.body[key];
      }
    });

    await reminder.save();

    // If this was a recurring reminder that was completed, create next instance
    if (reminder.completed && reminder.recurring.enabled) {
      try {
        await reminder.createNextInstance();
      } catch (recurringError) {
        console.warn('Failed to create next recurring instance:', recurringError);
      }
    }

    res.json({
      success: true,
      message: 'Reminder updated successfully',
      reminder: {
        ...reminder.toJSON(),
        id: reminder._id
      }
    });

  } catch (error) {
    console.error('Error updating personal reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update reminder',
      error: error.message 
    });
  }
});

// Toggle reminder completion
router.patch('/:reminderId/toggle', authenticateToken, async (req, res) => {
  try {
    const { reminderId } = req.params;
    const userId = req.user._id;

    const reminder = await PersonalReminder.findOne({ _id: reminderId, userId });
    if (!reminder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reminder not found' 
      });
    }

    reminder.completed = !reminder.completed;
    if (reminder.completed) {
      reminder.completedAt = new Date();
    } else {
      reminder.completedAt = null;
    }

    await reminder.save();

    // If this was a recurring reminder that was completed, create next instance
    if (reminder.completed && reminder.recurring.enabled) {
      try {
        await reminder.createNextInstance();
      } catch (recurringError) {
        console.warn('Failed to create next recurring instance:', recurringError);
      }
    }

    res.json({
      success: true,
      message: `Reminder ${reminder.completed ? 'completed' : 'reopened'}`,
      reminder: {
        ...reminder.toJSON(),
        id: reminder._id
      }
    });

  } catch (error) {
    console.error('Error toggling reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle reminder',
      error: error.message 
    });
  }
});

// Snooze a reminder
router.patch('/:reminderId/snooze', authenticateToken, [
  body('minutes').optional().isInt({ min: 1, max: 1440 }).withMessage('Minutes must be 1-1440')
], async (req, res) => {
  try {
    const { reminderId } = req.params;
    const userId = req.user._id;
    const { minutes = 15 } = req.body;

    const reminder = await PersonalReminder.findOne({ _id: reminderId, userId });
    if (!reminder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reminder not found' 
      });
    }

    await reminder.snooze(minutes);

    res.json({
      success: true,
      message: `Reminder snoozed for ${minutes} minutes`,
      reminder: {
        ...reminder.toJSON(),
        id: reminder._id
      }
    });

  } catch (error) {
    console.error('Error snoozing reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to snooze reminder',
      error: error.message 
    });
  }
});

// Delete a personal reminder
router.delete('/:reminderId', authenticateToken, async (req, res) => {
  try {
    const { reminderId } = req.params;
    const userId = req.user._id;

    const reminder = await PersonalReminder.findOneAndDelete({ _id: reminderId, userId });
    if (!reminder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reminder not found' 
      });
    }

    res.json({
      success: true,
      message: 'Reminder deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting personal reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete reminder',
      error: error.message 
    });
  }
});

// Clear completed reminders
router.delete('/completed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await PersonalReminder.deleteMany({ 
      userId, 
      completed: true,
      isArchived: false
    });

    res.json({
      success: true,
      message: `${result.deletedCount} completed reminders deleted`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error clearing completed reminders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear completed reminders',
      error: error.message 
    });
  }
});

module.exports = router;