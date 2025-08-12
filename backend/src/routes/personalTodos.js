const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const PersonalTodo = require('../models/PersonalTodo');
const { authenticateToken } = require('../middleware/auth');

// Get all personal todos for authenticated user
router.get('/', authenticateToken, [
  query('completed').optional().isBoolean(),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('category').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('skip').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { completed, priority, category, limit = 50, skip = 0 } = req.query;
    const userId = req.user.id;

    // Build filter
    const filter = { userId };
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }
    if (priority) {
      filter.priority = priority;
    }
    if (category) {
      filter.category = new RegExp(category, 'i');
    }

    const todos = await PersonalTodo.find(filter)
      .sort({ completed: 1, order: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Get stats
    const stats = await PersonalTodo.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          pending: { $sum: { $cond: ['$completed', 0, 1] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
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
          }
        }
      }
    ]);

    res.json({
      success: true,
      todos: todos.map(todo => ({
        ...todo,
        id: todo._id
      })),
      stats: stats.length > 0 ? stats[0] : {
        total: 0,
        completed: 0,
        pending: 0,
        high: 0,
        urgent: 0,
        overdue: 0
      }
    });

  } catch (error) {
    console.error('Error fetching personal todos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch todos',
      error: error.message 
    });
  }
});

// Create a new personal todo
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('category').optional().isLength({ max: 50 }),
  body('dueDate').optional().isISO8601(),
  body('tags').optional().isArray(),
  body('tags.*').optional().isLength({ max: 30 }),
  body('order').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const todoData = {
      ...req.body,
      userId: req.user._id
    };

    const todo = new PersonalTodo(todoData);
    await todo.save();

    res.status(201).json({
      success: true,
      message: 'Personal todo created successfully',
      todo: {
        ...todo.toJSON(),
        id: todo._id
      }
    });

  } catch (error) {
    console.error('Error creating personal todo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create todo',
      error: error.message 
    });
  }
});

// Update a personal todo
router.put('/:todoId', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('completed').optional().isBoolean(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('category').optional().isLength({ max: 50 }),
  body('dueDate').optional().isISO8601(),
  body('tags').optional().isArray(),
  body('tags.*').optional().isLength({ max: 30 }),
  body('order').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { todoId } = req.params;
    const userId = req.user._id;

    const todo = await PersonalTodo.findOne({ _id: todoId, userId });
    if (!todo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Todo not found' 
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      todo[key] = req.body[key];
    });

    await todo.save();

    res.json({
      success: true,
      message: 'Todo updated successfully',
      todo: {
        ...todo.toJSON(),
        id: todo._id
      }
    });

  } catch (error) {
    console.error('Error updating personal todo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update todo',
      error: error.message 
    });
  }
});

// Delete a personal todo
router.delete('/:todoId', authenticateToken, async (req, res) => {
  try {
    const { todoId } = req.params;
    const userId = req.user._id;

    const todo = await PersonalTodo.findOneAndDelete({ _id: todoId, userId });
    if (!todo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Todo not found' 
      });
    }

    res.json({
      success: true,
      message: 'Todo deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting personal todo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete todo',
      error: error.message 
    });
  }
});

// Toggle todo completion
router.patch('/:todoId/toggle', authenticateToken, async (req, res) => {
  try {
    const { todoId } = req.params;
    const userId = req.user._id;

    const todo = await PersonalTodo.findOne({ _id: todoId, userId });
    if (!todo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Todo not found' 
      });
    }

    todo.completed = !todo.completed;
    await todo.save();

    res.json({
      success: true,
      message: `Todo ${todo.completed ? 'completed' : 'reopened'}`,
      todo: {
        ...todo.toJSON(),
        id: todo._id
      }
    });

  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle todo',
      error: error.message 
    });
  }
});

// Bulk operations
router.patch('/bulk/complete', authenticateToken, [
  body('todoIds').isArray().withMessage('todoIds must be an array'),
  body('todoIds.*').isMongoId().withMessage('Invalid todo ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { todoIds } = req.body;
    const userId = req.user._id;

    const result = await PersonalTodo.updateMany(
      { _id: { $in: todoIds }, userId },
      { completed: true, completedAt: new Date() }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} todos completed`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error bulk completing todos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete todos',
      error: error.message 
    });
  }
});

router.delete('/bulk/completed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await PersonalTodo.deleteMany({ 
      userId, 
      completed: true 
    });

    res.json({
      success: true,
      message: `${result.deletedCount} completed todos deleted`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting completed todos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete completed todos',
      error: error.message 
    });
  }
});

module.exports = router;