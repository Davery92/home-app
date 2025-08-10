const express = require('express');
const { body, query, validationResult } = require('express-validator');
const CalendarEvent = require('../models/CalendarEvent');
const User = require('../models/User');
const FamilyMember = require('../models/FamilyMember');
const { authenticateToken, requireFamily, requireFamilyPermission } = require('../middleware/auth');

const router = express.Router();

// Get calendar events for a date range
router.get('/', authenticateToken, requireFamily, [
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date'),
  query('category').optional().isIn(['personal', 'work', 'health', 'school', 'family', 'social', 'holiday', 'birthday', 'other']),
  query('assignedTo').optional().isMongoId().withMessage('Assigned to must be valid ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, category, assignedTo } = req.query;
    let query = {
      family: req.family._id,
      isActive: true
    };

    // Add date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      query.$or = [
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } },
        { startDate: { $lte: start }, endDate: { $gte: end } }
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Add assigned to filter
    if (assignedTo) {
      query['assignedTo.memberId'] = assignedTo;
    }

    const events = await CalendarEvent.find(query)
      .populate('createdBy', 'profile email')
      .sort({ startDate: 1 });

    res.json({
      success: true,
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay,
        location: event.location,
        category: event.category,
        priority: event.priority,
        color: event.color,
        assignedTo: event.assignedTo,
        recurring: event.recurring,
        reminders: event.reminders,
        isCompleted: event.isCompleted,
        completedAt: event.completedAt,
        createdBy: {
          id: event.createdBy._id,
          name: `${event.createdBy.profile.firstName} ${event.createdBy.profile.lastName}`,
          email: event.createdBy.email
        },
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      })),
      total: events.length
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ message: 'Failed to fetch calendar events' });
  }
});

// Get events for today
router.get('/today', authenticateToken, requireFamily, async (req, res) => {
  try {
    const events = await CalendarEvent.findForToday(req.family._id)
      .populate('createdBy', 'profile email');

    res.json({
      success: true,
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay,
        location: event.location,
        category: event.category,
        priority: event.priority,
        color: event.color,
        assignedTo: event.assignedTo,
        isCompleted: event.isCompleted
      }))
    });

  } catch (error) {
    console.error('Error fetching today\'s events:', error);
    res.status(500).json({ message: 'Failed to fetch today\'s events' });
  }
});

// Get upcoming events
router.get('/upcoming', authenticateToken, requireFamily, [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const days = parseInt(req.query.days) || 7;
    const events = await CalendarEvent.findUpcoming(req.family._id, days)
      .populate('createdBy', 'profile email');

    res.json({
      success: true,
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay,
        location: event.location,
        category: event.category,
        priority: event.priority,
        color: event.color,
        assignedTo: event.assignedTo,
        isCompleted: event.isCompleted
      }))
    });

  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming events' });
  }
});

// Create a new calendar event
router.post('/', authenticateToken, requireFamily, requireFamilyPermission('manageCalendar'), [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be 1-100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('startDate').isISO8601().withMessage('Start date must be valid ISO date'),
  body('endDate').isISO8601().withMessage('End date must be valid ISO date'),
  body('allDay').optional().isBoolean().withMessage('All day must be boolean'),
  body('location').optional().isLength({ max: 200 }).withMessage('Location must be less than 200 characters'),
  body('category').optional().isIn(['personal', 'work', 'health', 'school', 'family', 'social', 'holiday', 'birthday', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('color').optional().isIn(['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'teal', 'orange', 'gray']),
  body('assignedTo').optional().isArray().withMessage('Assigned to must be an array'),
  body('assignedTo.*.memberId').isMongoId().withMessage('Member ID must be valid'),
  body('assignedTo.*.memberType').isIn(['user', 'familyMember']).withMessage('Member type must be user or familyMember'),
  body('assignedTo.*.name').trim().isLength({ min: 1 }).withMessage('Member name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      allDay = false,
      location,
      category = 'family',
      priority = 'medium',
      color = 'blue',
      assignedTo = [],
      recurring,
      reminders = []
    } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Create the event
    const calendarEvent = new CalendarEvent({
      family: req.family._id,
      title: title.trim(),
      description: description?.trim(),
      startDate: start,
      endDate: end,
      allDay,
      location: location?.trim(),
      category,
      priority,
      color,
      createdBy: req.user._id,
      assignedTo,
      recurring: recurring || { enabled: false },
      reminders
    });

    await calendarEvent.save();

    // Populate the creator information
    await calendarEvent.populate('createdBy', 'profile email');

    res.status(201).json({
      success: true,
      message: 'Calendar event created successfully',
      event: {
        id: calendarEvent._id,
        title: calendarEvent.title,
        description: calendarEvent.description,
        startDate: calendarEvent.startDate,
        endDate: calendarEvent.endDate,
        allDay: calendarEvent.allDay,
        location: calendarEvent.location,
        category: calendarEvent.category,
        priority: calendarEvent.priority,
        color: calendarEvent.color,
        assignedTo: calendarEvent.assignedTo,
        recurring: calendarEvent.recurring,
        reminders: calendarEvent.reminders,
        createdBy: {
          id: calendarEvent.createdBy._id,
          name: `${calendarEvent.createdBy.profile.firstName} ${calendarEvent.createdBy.profile.lastName}`,
          email: calendarEvent.createdBy.email
        },
        createdAt: calendarEvent.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ message: 'Failed to create calendar event' });
  }
});

// Update a calendar event
router.put('/:eventId', authenticateToken, requireFamily, requireFamilyPermission('manageCalendar'), [
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('allDay').optional().isBoolean(),
  body('location').optional().isLength({ max: 200 }),
  body('category').optional().isIn(['personal', 'work', 'health', 'school', 'family', 'social', 'holiday', 'birthday', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('color').optional().isIn(['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'teal', 'orange', 'gray'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId } = req.params;
    const updates = req.body;

    // Find the event
    const event = await CalendarEvent.findOne({
      _id: eventId,
      family: req.family._id,
      isActive: true
    });

    if (!event) {
      return res.status(404).json({ message: 'Calendar event not found' });
    }

    // Validate date updates if provided
    if (updates.startDate || updates.endDate) {
      const startDate = new Date(updates.startDate || event.startDate);
      const endDate = new Date(updates.endDate || event.endDate);
      
      if (endDate <= startDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }

    // Update the event
    Object.assign(event, updates);
    await event.save();

    await event.populate('createdBy', 'profile email');

    res.json({
      success: true,
      message: 'Calendar event updated successfully',
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay,
        location: event.location,
        category: event.category,
        priority: event.priority,
        color: event.color,
        assignedTo: event.assignedTo,
        updatedAt: event.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ message: 'Failed to update calendar event' });
  }
});

// Mark event as completed
router.patch('/:eventId/complete', authenticateToken, requireFamily, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await CalendarEvent.findOne({
      _id: eventId,
      family: req.family._id,
      isActive: true
    });

    if (!event) {
      return res.status(404).json({ message: 'Calendar event not found' });
    }

    event.markCompleted(req.user._id);
    await event.save();

    res.json({
      success: true,
      message: 'Event marked as completed',
      event: {
        id: event._id,
        isCompleted: event.isCompleted,
        completedAt: event.completedAt,
        completedBy: event.completedBy
      }
    });

  } catch (error) {
    console.error('Error completing calendar event:', error);
    res.status(500).json({ message: 'Failed to complete calendar event' });
  }
});

// Delete a calendar event
router.delete('/:eventId', authenticateToken, requireFamily, requireFamilyPermission('manageCalendar'), async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await CalendarEvent.findOne({
      _id: eventId,
      family: req.family._id,
      isActive: true
    });

    if (!event) {
      return res.status(404).json({ message: 'Calendar event not found' });
    }

    // Soft delete
    event.isActive = false;
    await event.save();

    res.json({
      success: true,
      message: 'Calendar event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ message: 'Failed to delete calendar event' });
  }
});

// Get calendar statistics
router.get('/stats', authenticateToken, requireFamily, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalEvents,
      monthlyEvents,
      todayEvents,
      upcomingEvents,
      completedEvents
    ] = await Promise.all([
      CalendarEvent.countDocuments({ family: req.family._id, isActive: true }),
      CalendarEvent.countDocuments({
        family: req.family._id,
        isActive: true,
        startDate: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      CalendarEvent.findForToday(req.family._id).then(events => events.length),
      CalendarEvent.findUpcoming(req.family._id, 7).then(events => events.length),
      CalendarEvent.countDocuments({
        family: req.family._id,
        isActive: true,
        isCompleted: true
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalEvents,
        monthlyEvents,
        todayEvents,
        upcomingEvents,
        completedEvents,
        completionRate: totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    res.status(500).json({ message: 'Failed to fetch calendar statistics' });
  }
});

module.exports = router;