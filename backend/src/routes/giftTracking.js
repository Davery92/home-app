const express = require('express');
const GiftEvent = require('../models/GiftEvent');
const GiftRecipient = require('../models/GiftRecipient');
const GiftItem = require('../models/GiftItem');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ===== GIFT EVENTS =====

// Get all gift events for user
router.get('/events', async (req, res) => {
  try {
    const { includeArchived } = req.query;
    const query = { userId: req.user.id };
    
    if (!includeArchived || includeArchived === 'false') {
      query.isArchived = false;
    }

    const events = await GiftEvent.find(query)
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: events.length,
      active: events.filter(e => e.status !== 'archived' && !e.isArchived).length,
      planning: events.filter(e => e.status === 'planning').length,
      shopping: events.filter(e => e.status === 'shopping').length,
      completed: events.filter(e => e.status === 'completed').length,
      totalBudget: events.reduce((sum, e) => sum + (e.totalBudget || 0), 0),
      totalSpent: events.reduce((sum, e) => sum + (e.totalSpent || 0), 0)
    };

    res.json({
      success: true,
      events,
      stats
    });
  } catch (error) {
    console.error('Error fetching gift events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gift events',
      error: error.message
    });
  }
});

// Get single gift event by ID
router.get('/events/:id', async (req, res) => {
  try {
    const event = await GiftEvent.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Gift event not found'
      });
    }

    // Get recipients for this event
    const recipients = await GiftRecipient.find({
      eventId: event._id,
      userId: req.user.id
    }).sort({ group: 1, name: 1 });

    res.json({
      success: true,
      event,
      recipients
    });
  } catch (error) {
    console.error('Error fetching gift event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gift event',
      error: error.message
    });
  }
});

// Create new gift event
router.post('/events', async (req, res) => {
  try {
    const eventData = {
      userId: req.user.id,
      title: req.body.title,
      description: req.body.description,
      eventDate: req.body.eventDate,
      totalBudget: req.body.totalBudget || 0
    };

    const event = new GiftEvent(eventData);
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Gift event created successfully',
      event
    });
  } catch (error) {
    console.error('Error creating gift event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gift event',
      error: error.message
    });
  }
});

// Update gift event
router.put('/events/:id', async (req, res) => {
  try {
    const event = await GiftEvent.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Gift event not found'
      });
    }

    res.json({
      success: true,
      message: 'Gift event updated successfully',
      event
    });
  } catch (error) {
    console.error('Error updating gift event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gift event',
      error: error.message
    });
  }
});

// Delete gift event (and all related data)
router.delete('/events/:id', async (req, res) => {
  try {
    // Delete the event
    const event = await GiftEvent.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Gift event not found'
      });
    }

    // Delete all recipients and items for this event
    await GiftRecipient.deleteMany({ eventId: req.params.id, userId: req.user.id });
    await GiftItem.deleteMany({ eventId: req.params.id, userId: req.user.id });

    res.json({
      success: true,
      message: 'Gift event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gift event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gift event',
      error: error.message
    });
  }
});

// ===== GIFT RECIPIENTS =====

// Get recipients for an event
router.get('/events/:eventId/recipients', async (req, res) => {
  try {
    // Verify event belongs to user
    const event = await GiftEvent.findOne({
      _id: req.params.eventId,
      userId: req.user.id
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Gift event not found'
      });
    }

    const recipients = await GiftRecipient.find({
      eventId: req.params.eventId,
      userId: req.user.id
    }).sort({ group: 1, name: 1 });

    // Get group statistics
    const groups = {};
    recipients.forEach(recipient => {
      if (!groups[recipient.group]) {
        groups[recipient.group] = {
          count: 0,
          totalBudget: 0,
          totalSpent: 0
        };
      }
      groups[recipient.group].count++;
      groups[recipient.group].totalBudget += recipient.budget || 0;
      groups[recipient.group].totalSpent += recipient.totalSpent || 0;
    });

    res.json({
      success: true,
      recipients,
      groups
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipients',
      error: error.message
    });
  }
});

// Create new recipient
router.post('/events/:eventId/recipients', async (req, res) => {
  try {
    // Verify event belongs to user
    const event = await GiftEvent.findOne({
      _id: req.params.eventId,
      userId: req.user.id
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Gift event not found'
      });
    }

    const recipientData = {
      userId: req.user.id,
      eventId: req.params.eventId,
      name: req.body.name,
      group: req.body.group || 'Family',
      budget: req.body.budget || 0,
      notes: req.body.notes,
      avatar: req.body.avatar
    };

    const recipient = new GiftRecipient(recipientData);
    await recipient.save();

    // Update event recipient count
    await GiftEvent.findByIdAndUpdate(req.params.eventId, {
      $inc: { recipientCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Recipient added successfully',
      recipient
    });
  } catch (error) {
    console.error('Error creating recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recipient',
      error: error.message
    });
  }
});

// Update recipient
router.put('/recipients/:id', async (req, res) => {
  try {
    const recipient = await GiftRecipient.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    res.json({
      success: true,
      message: 'Recipient updated successfully',
      recipient
    });
  } catch (error) {
    console.error('Error updating recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recipient',
      error: error.message
    });
  }
});

// Delete recipient (and all their items)
router.delete('/recipients/:id', async (req, res) => {
  try {
    const recipient = await GiftRecipient.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Delete all items for this recipient
    await GiftItem.deleteMany({ 
      recipientId: req.params.id, 
      userId: req.user.id 
    });

    // Update event recipient count
    await GiftEvent.findByIdAndUpdate(recipient.eventId, {
      $inc: { recipientCount: -1 }
    });

    res.json({
      success: true,
      message: 'Recipient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipient',
      error: error.message
    });
  }
});

// ===== GIFT ITEMS =====

// Get items for a recipient
router.get('/recipients/:recipientId/items', async (req, res) => {
  try {
    // Verify recipient belongs to user
    const recipient = await GiftRecipient.findOne({
      _id: req.params.recipientId,
      userId: req.user.id
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const { type, status } = req.query;
    const query = {
      recipientId: req.params.recipientId,
      userId: req.user.id
    };

    if (type) query.type = type;
    if (status) query.status = status;

    const items = await GiftItem.find(query).sort({ 
      createdAt: -1 
    });

    // Calculate statistics
    const stats = {
      totalItems: items.length,
      ideas: items.filter(i => i.type === 'idea').length,
      purchases: items.filter(i => i.type === 'purchase').length,
      totalSpent: items
        .filter(i => i.type === 'purchase')
        .reduce((sum, i) => sum + (i.actualPrice || 0), 0),
      estimatedValue: items
        .filter(i => i.type === 'idea')
        .reduce((sum, i) => sum + (i.estimatedPrice || 0), 0)
    };

    res.json({
      success: true,
      items,
      stats
    });
  } catch (error) {
    console.error('Error fetching gift items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gift items',
      error: error.message
    });
  }
});

// Create new gift item
router.post('/recipients/:recipientId/items', async (req, res) => {
  try {
    // Verify recipient belongs to user
    const recipient = await GiftRecipient.findOne({
      _id: req.params.recipientId,
      userId: req.user.id
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const itemData = {
      userId: req.user.id,
      eventId: recipient.eventId,
      recipientId: req.params.recipientId,
      name: req.body.name,
      description: req.body.description,
      estimatedPrice: req.body.estimatedPrice || 0,
      actualPrice: req.body.actualPrice || 0,
      url: req.body.url,
      type: req.body.type || 'idea',
      status: req.body.status || 'idea',
      priority: req.body.priority || 'medium',
      category: req.body.category,
      store: req.body.store,
      notes: req.body.notes,
      imageUrl: req.body.imageUrl,
      purchaseDate: req.body.purchaseDate,
      orderNumber: req.body.orderNumber
    };

    const item = new GiftItem(itemData);
    await item.save();

    // Update recipient counts and totals
    const updateData = {};
    if (item.type === 'idea') {
      updateData.$inc = { ideaCount: 1 };
    } else if (item.type === 'purchase') {
      updateData.$inc = { 
        purchaseCount: 1,
        totalSpent: item.actualPrice || 0
      };
    }

    if (Object.keys(updateData).length > 0) {
      await GiftRecipient.findByIdAndUpdate(req.params.recipientId, updateData);

      // Update event total spent
      if (item.type === 'purchase') {
        await GiftEvent.findByIdAndUpdate(recipient.eventId, {
          $inc: { totalSpent: item.actualPrice || 0 }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Gift item created successfully',
      item
    });
  } catch (error) {
    console.error('Error creating gift item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gift item',
      error: error.message
    });
  }
});

// Update gift item
router.put('/items/:id', async (req, res) => {
  try {
    const oldItem = await GiftItem.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!oldItem) {
      return res.status(404).json({
        success: false,
        message: 'Gift item not found'
      });
    }

    const item = await GiftItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Update recipient and event totals if purchase amount changed
    if (item.type === 'purchase' && oldItem.actualPrice !== item.actualPrice) {
      const priceDifference = (item.actualPrice || 0) - (oldItem.actualPrice || 0);
      
      await GiftRecipient.findByIdAndUpdate(item.recipientId, {
        $inc: { totalSpent: priceDifference }
      });

      await GiftEvent.findByIdAndUpdate(item.eventId, {
        $inc: { totalSpent: priceDifference }
      });
    }

    res.json({
      success: true,
      message: 'Gift item updated successfully',
      item
    });
  } catch (error) {
    console.error('Error updating gift item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gift item',
      error: error.message
    });
  }
});

// Move item from idea to purchase
router.put('/items/:id/move-to-purchase', async (req, res) => {
  try {
    const item = await GiftItem.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gift item not found'
      });
    }

    if (item.type !== 'idea') {
      return res.status(400).json({
        success: false,
        message: 'Item is not an idea'
      });
    }

    // Update item
    item.type = 'purchase';
    item.status = 'to_buy';
    item.actualPrice = req.body.actualPrice || item.estimatedPrice;
    item.purchaseDate = req.body.purchaseDate;
    item.orderNumber = req.body.orderNumber;
    item.store = req.body.store || item.store;
    
    await item.save();

    // Update recipient counts
    await GiftRecipient.findByIdAndUpdate(item.recipientId, {
      $inc: { 
        ideaCount: -1,
        purchaseCount: 1,
        totalSpent: item.actualPrice || 0
      }
    });

    // Update event total
    await GiftEvent.findByIdAndUpdate(item.eventId, {
      $inc: { totalSpent: item.actualPrice || 0 }
    });

    res.json({
      success: true,
      message: 'Item moved to purchases successfully',
      item
    });
  } catch (error) {
    console.error('Error moving item to purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move item to purchase',
      error: error.message
    });
  }
});

// Delete gift item
router.delete('/items/:id', async (req, res) => {
  try {
    const item = await GiftItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gift item not found'
      });
    }

    // Update recipient counts and totals
    const updateData = { $inc: {} };
    
    if (item.type === 'idea') {
      updateData.$inc.ideaCount = -1;
    } else if (item.type === 'purchase') {
      updateData.$inc.purchaseCount = -1;
      updateData.$inc.totalSpent = -(item.actualPrice || 0);
    }

    await GiftRecipient.findByIdAndUpdate(item.recipientId, updateData);

    // Update event total spent
    if (item.type === 'purchase') {
      await GiftEvent.findByIdAndUpdate(item.eventId, {
        $inc: { totalSpent: -(item.actualPrice || 0) }
      });
    }

    res.json({
      success: true,
      message: 'Gift item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gift item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gift item',
      error: error.message
    });
  }
});

// Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Get all events
    const events = await GiftEvent.find({ 
      userId: req.user.id,
      isArchived: false 
    });

    // Get upcoming events (within next 60 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 60);
    
    const upcomingEvents = events.filter(event => 
      event.eventDate && event.eventDate <= upcomingDate
    );

    // Get recent items
    const recentItems = await GiftItem.find({ 
      userId: req.user.id 
    })
    .populate('recipientId', 'name')
    .populate('eventId', 'title')
    .sort({ createdAt: -1 })
    .limit(5);

    // Calculate overall stats
    const totalBudget = events.reduce((sum, e) => sum + (e.totalBudget || 0), 0);
    const totalSpent = events.reduce((sum, e) => sum + (e.totalSpent || 0), 0);
    const totalRecipients = events.reduce((sum, e) => sum + (e.recipientCount || 0), 0);

    const stats = {
      totalEvents: events.length,
      upcomingEvents: upcomingEvents.length,
      totalRecipients,
      totalBudget,
      totalSpent,
      remainingBudget: totalBudget - totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };

    res.json({
      success: true,
      stats,
      upcomingEvents: upcomingEvents.slice(0, 3),
      recentItems
    });
  } catch (error) {
    console.error('Error fetching gift tracking dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

module.exports = router;