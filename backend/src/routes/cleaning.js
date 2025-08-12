const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const CleaningTask = require('../models/CleaningTask');
const { authenticateToken } = require('../middleware/auth');

// Get all cleaning tasks for family
router.get('/', authenticateToken, [
  query('room').optional().isIn(['kitchen', 'bathroom', 'living_room', 'bedroom', 'laundry', 'garage', 'outdoor', 'office', 'dining_room', 'other']),
  query('category').optional().isIn(['daily', 'weekly', 'monthly', 'seasonal', 'deep_clean', 'maintenance']),
  query('completed').optional().isBoolean(),
  query('assignedTo').optional().isMongoId(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('skip').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { room, category, completed, assignedTo, limit = 50, skip = 0 } = req.query;
    const familyId = req.user.familyId;

    // Build filter
    const filter = { familyId, isArchived: false };
    if (room) filter.room = room;
    if (category) filter.category = category;
    if (completed !== undefined) filter.completed = completed === 'true';
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await CleaningTask.find(filter)
      .sort({ completed: 1, priority: -1, dueDate: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Get stats
    const stats = await CleaningTask.aggregate([
      { $match: { familyId: req.user.familyId, isArchived: false } },
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
                  { $lt: ['$dueDate', new Date()] }
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
      tasks: tasks.map(task => ({
        ...task,
        id: task._id,
        isOverdue: !task.completed && task.dueDate && new Date() > task.dueDate
      })),
      stats: stats.length > 0 ? stats[0] : {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        high_priority: 0,
        urgent: 0
      }
    });

  } catch (error) {
    console.error('Error fetching cleaning tasks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch cleaning tasks',
      error: error.message 
    });
  }
});

// Create a new cleaning task
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('assignedTo').isMongoId().withMessage('Valid assignedTo ID required'),
  body('assignedToType').isIn(['user', 'member']).withMessage('assignedToType must be user or member'),
  body('assignedToName').trim().isLength({ min: 1, max: 100 }).withMessage('assignedToName required'),
  body('room').optional().isIn(['kitchen', 'bathroom', 'living_room', 'bedroom', 'laundry', 'garage', 'outdoor', 'office', 'dining_room', 'other']),
  body('category').optional().isIn(['daily', 'weekly', 'monthly', 'seasonal', 'deep_clean', 'maintenance']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('estimatedMinutes').optional().isInt({ min: 5, max: 480 }),
  body('dueDate').optional().isISO8601(),
  body('recurring.enabled').optional().isBoolean(),
  body('recurring.frequency').optional().isIn(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly']),
  body('supplies').optional().isArray(),
  body('supplies.*.name').optional().isLength({ max: 100 }),
  body('supplies.*.optional').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taskData = {
      ...req.body,
      familyId: req.user.familyId,
      createdBy: req.user._id
    };

    const task = new CleaningTask(taskData);
    await task.save();

    res.status(201).json({
      success: true,
      message: 'Cleaning task created successfully',
      task: {
        ...task.toJSON(),
        id: task._id
      }
    });

  } catch (error) {
    console.error('Error creating cleaning task:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create cleaning task',
      error: error.message 
    });
  }
});

// Update a cleaning task
router.put('/:taskId', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('assignedTo').optional().isMongoId(),
  body('assignedToType').optional().isIn(['user', 'member']),
  body('assignedToName').optional().trim().isLength({ min: 1, max: 100 }),
  body('room').optional().isIn(['kitchen', 'bathroom', 'living_room', 'bedroom', 'laundry', 'garage', 'outdoor', 'office', 'dining_room', 'other']),
  body('category').optional().isIn(['daily', 'weekly', 'monthly', 'seasonal', 'deep_clean', 'maintenance']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('estimatedMinutes').optional().isInt({ min: 5, max: 480 }),
  body('dueDate').optional().isISO8601(),
  body('completed').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const familyId = req.user.familyId;

    const task = await CleaningTask.findOne({ _id: taskId, familyId });
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cleaning task not found' 
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key === 'completed' && req.body[key] && !task.completed) {
        // Mark as completed
        task.completed = true;
        task.completedAt = new Date();
        task.completedBy = req.user._id;
        task.completedByName = `${req.user.firstName} ${req.user.lastName}`;
        
        // Add to completion history
        task.completionHistory.push({
          completedAt: new Date(),
          completedBy: req.user._id,
          completedByName: `${req.user.firstName} ${req.user.lastName}`,
          notes: req.body.notes || '',
          timeSpent: req.body.timeSpent || null
        });
        
        // Update last completed
        task.lastCompleted = new Date();
        
      } else if (key === 'completed' && !req.body[key] && task.completed) {
        // Mark as not completed
        task.completed = false;
        task.completedAt = null;
        task.completedBy = null;
        task.completedByName = null;
      } else {
        task[key] = req.body[key];
      }
    });

    await task.save();

    // If this was a recurring task that was completed, create next instance
    if (task.completed && task.recurring.enabled) {
      try {
        await task.createNextInstance();
      } catch (recurringError) {
        console.warn('Failed to create next recurring instance:', recurringError);
      }
    }

    res.json({
      success: true,
      message: 'Cleaning task updated successfully',
      task: {
        ...task.toJSON(),
        id: task._id
      }
    });

  } catch (error) {
    console.error('Error updating cleaning task:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update cleaning task',
      error: error.message 
    });
  }
});

// Toggle task completion
router.patch('/:taskId/toggle', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const familyId = req.user.familyId;

    const task = await CleaningTask.findOne({ _id: taskId, familyId });
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cleaning task not found' 
      });
    }

    task.completed = !task.completed;
    
    if (task.completed) {
      task.completedAt = new Date();
      task.completedBy = req.user._id;
      task.completedByName = `${req.user.firstName} ${req.user.lastName}`;
      task.lastCompleted = new Date();
      
      // Add to completion history
      task.completionHistory.push({
        completedAt: new Date(),
        completedBy: req.user._id,
        completedByName: `${req.user.firstName} ${req.user.lastName}`
      });
    } else {
      task.completedAt = null;
      task.completedBy = null;
      task.completedByName = null;
    }

    await task.save();

    // If this was a recurring task that was completed, create next instance
    if (task.completed && task.recurring.enabled) {
      try {
        await task.createNextInstance();
      } catch (recurringError) {
        console.warn('Failed to create next recurring instance:', recurringError);
      }
    }

    res.json({
      success: true,
      message: `Cleaning task ${task.completed ? 'completed' : 'reopened'}`,
      task: {
        ...task.toJSON(),
        id: task._id
      }
    });

  } catch (error) {
    console.error('Error toggling cleaning task:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle cleaning task',
      error: error.message 
    });
  }
});

// Delete a cleaning task
router.delete('/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const familyId = req.user.familyId;

    const task = await CleaningTask.findOneAndDelete({ _id: taskId, familyId });
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cleaning task not found' 
      });
    }

    res.json({
      success: true,
      message: 'Cleaning task deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting cleaning task:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete cleaning task',
      error: error.message 
    });
  }
});

// Get cleaning task statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const familyId = req.user.familyId;
    
    const stats = await CleaningTask.aggregate([
      { $match: { familyId, isArchived: false } },
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
                  { $lt: ['$dueDate', new Date()] }
                ]}, 
                1, 
                0 
              ] 
            } 
          },
          by_room: {
            $push: {
              room: '$room',
              completed: '$completed'
            }
          },
          by_category: {
            $push: {
              category: '$category',
              completed: '$completed'
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats.length > 0 ? stats[0] : {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        by_room: [],
        by_category: []
      }
    });

  } catch (error) {
    console.error('Error fetching cleaning stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch cleaning stats',
      error: error.message 
    });
  }
});

// Clear completed tasks
router.delete('/completed', authenticateToken, async (req, res) => {
  try {
    const familyId = req.user.familyId;

    const result = await CleaningTask.deleteMany({ 
      familyId, 
      completed: true,
      isArchived: false
    });

    res.json({
      success: true,
      message: `${result.deletedCount} completed cleaning tasks deleted`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error clearing completed cleaning tasks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear completed tasks',
      error: error.message 
    });
  }
});

module.exports = router;