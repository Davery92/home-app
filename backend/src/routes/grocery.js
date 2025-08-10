const express = require('express');
const { body, query, validationResult } = require('express-validator');
const GroceryItem = require('../models/GroceryItem');
const { authenticateToken, requireFamily, requireFamilyPermission } = require('../middleware/auth');

const router = express.Router();

// Get all grocery items
router.get('/', authenticateToken, requireFamily, [
  query('category').optional().isIn(['produce', 'dairy', 'meat', 'seafood', 'bakery', 'frozen', 'pantry', 'beverages', 'snacks', 'household', 'personal', 'pharmacy', 'other']),
  query('isPurchased').optional().isBoolean(),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, isPurchased, priority } = req.query;
    let query = {
      family: req.family._id,
      isActive: true
    };

    // Add filters
    if (category) query.category = category;
    if (isPurchased !== undefined) query.isPurchased = isPurchased === 'true';
    if (priority) query.priority = priority;

    const items = await GroceryItem.find(query)
      .populate('addedBy', 'profile email')
      .populate('purchasedBy', 'profile email')
      .populate('assignedTo', 'profile email')
      .sort({ isPurchased: 1, priority: -1, category: 1, name: 1 });

    res.json({
      success: true,
      items: items.map(item => ({
        id: item._id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        priority: item.priority,
        notes: item.notes,
        brand: item.brand,
        store: item.store,
        estimatedPrice: item.estimatedPrice,
        actualPrice: item.actualPrice,
        isPurchased: item.isPurchased,
        purchasedAt: item.purchasedAt,
        purchasedBy: item.purchasedBy ? {
          id: item.purchasedBy._id,
          name: `${item.purchasedBy.profile.firstName} ${item.purchasedBy.profile.lastName}`
        } : null,
        addedBy: {
          id: item.addedBy._id,
          name: `${item.addedBy.profile.firstName} ${item.addedBy.profile.lastName}`
        },
        assignedTo: item.assignedTo ? {
          id: item.assignedTo._id,
          name: `${item.assignedTo.profile.firstName} ${item.assignedTo.profile.lastName}`
        } : null,
        recurring: item.recurring,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      total: items.length
    });

  } catch (error) {
    console.error('Error fetching grocery items:', error);
    res.status(500).json({ message: 'Failed to fetch grocery items' });
  }
});

// Get active (unpurchased) items
router.get('/active', authenticateToken, requireFamily, async (req, res) => {
  try {
    const items = await GroceryItem.findActiveItems(req.family._id)
      .populate('addedBy', 'profile email')
      .populate('assignedTo', 'profile email');

    // Group by category
    const groupedItems = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push({
        id: item._id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        priority: item.priority,
        notes: item.notes,
        brand: item.brand,
        store: item.store,
        estimatedPrice: item.estimatedPrice,
        addedBy: {
          id: item.addedBy._id,
          name: `${item.addedBy.profile.firstName} ${item.addedBy.profile.lastName}`
        },
        assignedTo: item.assignedTo ? {
          id: item.assignedTo._id,
          name: `${item.assignedTo.profile.firstName} ${item.assignedTo.profile.lastName}`
        } : null
      });
      return acc;
    }, {});

    res.json({
      success: true,
      items: groupedItems,
      totalItems: items.length
    });

  } catch (error) {
    console.error('Error fetching active grocery items:', error);
    res.status(500).json({ message: 'Failed to fetch active grocery items' });
  }
});

// Get purchased items
router.get('/purchased', authenticateToken, requireFamily, [
  query('days').optional().isInt({ min: 1, max: 30 })
], async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const items = await GroceryItem.findPurchasedItems(req.family._id, days)
      .populate('purchasedBy', 'profile email');

    res.json({
      success: true,
      items: items.map(item => ({
        id: item._id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        actualPrice: item.actualPrice,
        purchasedAt: item.purchasedAt,
        purchasedBy: {
          id: item.purchasedBy._id,
          name: `${item.purchasedBy.profile.firstName} ${item.purchasedBy.profile.lastName}`
        }
      })),
      totalItems: items.length,
      totalSpent: items.reduce((sum, item) => sum + (item.actualPrice || 0), 0)
    });

  } catch (error) {
    console.error('Error fetching purchased items:', error);
    res.status(500).json({ message: 'Failed to fetch purchased items' });
  }
});

// Create a new grocery item
router.post('/', authenticateToken, requireFamily, requireFamilyPermission('manageGrocery'), [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('unit').optional().isLength({ max: 20 }).withMessage('Unit must be less than 20 characters'),
  body('category').optional().isIn(['produce', 'dairy', 'meat', 'seafood', 'bakery', 'frozen', 'pantry', 'beverages', 'snacks', 'household', 'personal', 'pharmacy', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('notes').optional().isLength({ max: 200 }).withMessage('Notes must be less than 200 characters'),
  body('brand').optional().isLength({ max: 50 }).withMessage('Brand must be less than 50 characters'),
  body('store').optional().isLength({ max: 50 }).withMessage('Store must be less than 50 characters'),
  body('estimatedPrice').optional().isFloat({ min: 0 }).withMessage('Estimated price must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      quantity = 1,
      unit = '',
      category = 'other',
      priority = 'medium',
      notes,
      brand,
      store,
      estimatedPrice,
      assignedTo,
      recurring
    } = req.body;

    // Check for duplicate item
    const existingItem = await GroceryItem.findOne({
      family: req.family._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true,
      isPurchased: false
    });

    if (existingItem) {
      // Update quantity instead of creating duplicate
      existingItem.quantity += quantity;
      await existingItem.save();
      
      return res.json({
        success: true,
        message: 'Item quantity updated',
        item: existingItem
      });
    }

    const groceryItem = new GroceryItem({
      family: req.family._id,
      name: name.trim(),
      quantity,
      unit: unit?.trim(),
      category,
      priority,
      notes: notes?.trim(),
      brand: brand?.trim(),
      store: store?.trim(),
      estimatedPrice,
      addedBy: req.user._id,
      assignedTo,
      recurring: recurring || { enabled: false }
    });

    await groceryItem.save();
    await groceryItem.populate('addedBy', 'profile email');

    res.status(201).json({
      success: true,
      message: 'Grocery item added successfully',
      item: {
        id: groceryItem._id,
        name: groceryItem.name,
        quantity: groceryItem.quantity,
        unit: groceryItem.unit,
        category: groceryItem.category,
        priority: groceryItem.priority,
        notes: groceryItem.notes,
        brand: groceryItem.brand,
        store: groceryItem.store,
        estimatedPrice: groceryItem.estimatedPrice,
        isPurchased: groceryItem.isPurchased,
        addedBy: {
          id: groceryItem.addedBy._id,
          name: `${groceryItem.addedBy.profile.firstName} ${groceryItem.addedBy.profile.lastName}`
        },
        createdAt: groceryItem.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating grocery item:', error);
    res.status(500).json({ message: 'Failed to create grocery item' });
  }
});

// Update a grocery item
router.put('/:itemId', authenticateToken, requireFamily, requireFamilyPermission('manageGrocery'), [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('quantity').optional().isInt({ min: 1 }),
  body('unit').optional().isLength({ max: 20 }),
  body('category').optional().isIn(['produce', 'dairy', 'meat', 'seafood', 'bakery', 'frozen', 'pantry', 'beverages', 'snacks', 'household', 'personal', 'pharmacy', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('notes').optional().isLength({ max: 200 }),
  body('brand').optional().isLength({ max: 50 }),
  body('store').optional().isLength({ max: 50 }),
  body('estimatedPrice').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId } = req.params;
    const updates = req.body;

    const item = await GroceryItem.findOne({
      _id: itemId,
      family: req.family._id,
      isActive: true
    });

    if (!item) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }

    Object.assign(item, updates);
    await item.save();

    res.json({
      success: true,
      message: 'Grocery item updated successfully',
      item: {
        id: item._id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        priority: item.priority,
        notes: item.notes,
        brand: item.brand,
        store: item.store,
        estimatedPrice: item.estimatedPrice,
        updatedAt: item.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating grocery item:', error);
    res.status(500).json({ message: 'Failed to update grocery item' });
  }
});

// Mark item as purchased
router.patch('/:itemId/purchase', authenticateToken, requireFamily, [
  body('actualPrice').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const { itemId } = req.params;
    const { actualPrice } = req.body;

    const item = await GroceryItem.findOne({
      _id: itemId,
      family: req.family._id,
      isActive: true
    });

    if (!item) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }

    item.markPurchased(req.user._id, actualPrice);
    await item.save();

    await item.populate('purchasedBy', 'profile email');

    res.json({
      success: true,
      message: 'Item marked as purchased',
      item: {
        id: item._id,
        isPurchased: item.isPurchased,
        purchasedAt: item.purchasedAt,
        purchasedBy: {
          id: item.purchasedBy._id,
          name: `${item.purchasedBy.profile.firstName} ${item.purchasedBy.profile.lastName}`
        },
        actualPrice: item.actualPrice
      }
    });

  } catch (error) {
    console.error('Error marking item as purchased:', error);
    res.status(500).json({ message: 'Failed to mark item as purchased' });
  }
});

// Mark item as unpurchased
router.patch('/:itemId/unpurchase', authenticateToken, requireFamily, async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await GroceryItem.findOne({
      _id: itemId,
      family: req.family._id,
      isActive: true
    });

    if (!item) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }

    item.markUnpurchased();
    await item.save();

    res.json({
      success: true,
      message: 'Item marked as unpurchased',
      item: {
        id: item._id,
        isPurchased: item.isPurchased
      }
    });

  } catch (error) {
    console.error('Error marking item as unpurchased:', error);
    res.status(500).json({ message: 'Failed to mark item as unpurchased' });
  }
});

// Delete a grocery item
router.delete('/:itemId', authenticateToken, requireFamily, requireFamilyPermission('manageGrocery'), async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await GroceryItem.findOne({
      _id: itemId,
      family: req.family._id,
      isActive: true
    });

    if (!item) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }

    // Soft delete
    item.isActive = false;
    await item.save();

    res.json({
      success: true,
      message: 'Grocery item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting grocery item:', error);
    res.status(500).json({ message: 'Failed to delete grocery item' });
  }
});

// Clear all purchased items
router.delete('/purchased/clear', authenticateToken, requireFamily, requireFamilyPermission('manageGrocery'), async (req, res) => {
  try {
    const result = await GroceryItem.clearPurchased(req.family._id);

    res.json({
      success: true,
      message: 'Purchased items cleared successfully',
      itemsCleared: result.modifiedCount
    });

  } catch (error) {
    console.error('Error clearing purchased items:', error);
    res.status(500).json({ message: 'Failed to clear purchased items' });
  }
});

// Get grocery statistics
router.get('/stats', authenticateToken, requireFamily, async (req, res) => {
  try {
    const stats = await GroceryItem.getStats(req.family._id);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching grocery stats:', error);
    res.status(500).json({ message: 'Failed to fetch grocery statistics' });
  }
});

module.exports = router;