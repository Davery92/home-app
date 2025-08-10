const express = require('express');
const { body, validationResult } = require('express-validator');
const Chore = require('../models/Chore');
const FamilyMember = require('../models/FamilyMember');
const Family = require('../models/Family');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all chores for the user's family
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: 'User is not part of any family' });
    }

    const chores = await Chore.find({ 
      family: user.familyId, 
      isActive: true 
    })
    .populate('assignedBy', 'profile')
    .sort({ createdAt: -1 });

    const formattedChores = chores.map(chore => ({
      id: chore._id,
      title: chore.title,
      description: chore.description,
      points: chore.points,
      isCompleted: chore.isCompleted,
      assignedTo: chore.assignedToName,
      assignedBy: chore.assignedByName,
      dueDate: chore.dueDate,
      completedAt: chore.completedAt,
      priority: chore.priority,
      category: chore.category,
      recurring: chore.recurring,
      createdAt: chore.createdAt,
      updatedAt: chore.updatedAt
    }));

    res.json({
      success: true,
      chores: formattedChores
    });

  } catch (error) {
    console.error('Error fetching chores:', error);
    res.status(500).json({ message: 'Failed to fetch chores' });
  }
});

// Create a new chore
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be 1-100 characters'),
  body('description').optional().isLength({ max: 500 }),
  body('points').isInt({ min: 1, max: 100 }).withMessage('Points must be between 1 and 100'),
  body('assignedTo').notEmpty().withMessage('Chore must be assigned to someone'),
  body('assignedToType').isIn(['user', 'member']).withMessage('Invalid assignment type'),
  body('dueDate').optional().isISO8601(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('category').optional().isIn(['cleaning', 'kitchen', 'yard', 'pets', 'personal', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: 'User is not part of any family' });
    }

    // Check if user has permission to manage chores
    const family = await Family.findById(user.familyId);
    if (!family.hasPermission(user._id, 'manageChores')) {
      return res.status(403).json({ message: 'Permission denied to manage chores' });
    }

    const {
      title,
      description = '',
      points,
      assignedTo,
      assignedToType,
      dueDate,
      priority = 'medium',
      category = 'other'
    } = req.body;

    let assignedToUser = null;
    let assignedToMember = null;
    let assignedToName = '';

    // Resolve assignment
    if (assignedToType === 'user') {
      const targetUser = await User.findById(assignedTo);
      if (!targetUser || targetUser.familyId?.toString() !== user.familyId.toString()) {
        return res.status(400).json({ message: 'Invalid user assignment' });
      }
      assignedToUser = assignedTo;
      assignedToName = `${targetUser.profile.firstName} ${targetUser.profile.lastName}`;
    } else {
      const targetMember = await FamilyMember.findOne({
        _id: assignedTo,
        family: user.familyId,
        isActive: true
      });
      if (!targetMember) {
        return res.status(400).json({ message: 'Invalid family member assignment' });
      }
      assignedToMember = assignedTo;
      assignedToName = targetMember.name;
    }

    const chore = new Chore({
      family: user.familyId,
      title: title.trim(),
      description,
      points,
      assignedToUser,
      assignedToMember,
      assignedToName,
      assignedBy: user._id,
      assignedByName: `${user.profile.firstName} ${user.profile.lastName}`,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      category
    });

    await chore.save();

    res.status(201).json({
      success: true,
      chore: {
        id: chore._id,
        title: chore.title,
        description: chore.description,
        points: chore.points,
        isCompleted: chore.isCompleted,
        assignedTo: chore.assignedToName,
        assignedBy: chore.assignedByName,
        dueDate: chore.dueDate,
        priority: chore.priority,
        category: chore.category,
        createdAt: chore.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating chore:', error);
    res.status(500).json({ message: 'Failed to create chore' });
  }
});

// Toggle chore completion
router.patch('/:choreId/toggle', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: 'User is not part of any family' });
    }

    const chore = await Chore.findOne({
      _id: req.params.choreId,
      family: user.familyId,
      isActive: true
    });

    if (!chore) {
      return res.status(404).json({ message: 'Chore not found' });
    }

    // Toggle completion status
    if (chore.isCompleted) {
      chore.markIncomplete();
      
      // Remove points from assignee
      if (chore.assignedToMember) {
        // Remove from family member (non-account holder)
        const member = await FamilyMember.findById(chore.assignedToMember);
        if (member) {
          member.removePoints(chore.points);
          await member.save();
        }
      } else if (chore.assignedToUser) {
        // Remove from user account
        const assignedUser = await User.findById(chore.assignedToUser);
        if (assignedUser) {
          assignedUser.removePoints(chore.points);
          await assignedUser.save();
        }
      }
    } else {
      chore.markCompleted(user._id);
      
      // Add points to assignee
      if (chore.assignedToMember) {
        // Add to family member (non-account holder)
        const member = await FamilyMember.findById(chore.assignedToMember);
        if (member) {
          member.addPoints(chore.points);
          await member.save();
        }
      } else if (chore.assignedToUser) {
        // Add to user account
        const assignedUser = await User.findById(chore.assignedToUser);
        if (assignedUser) {
          assignedUser.addPoints(chore.points);
          await assignedUser.save();
        }
      }
    }

    await chore.save();

    res.json({
      success: true,
      chore: {
        id: chore._id,
        title: chore.title,
        isCompleted: chore.isCompleted,
        completedAt: chore.completedAt,
        points: chore.points
      }
    });

  } catch (error) {
    console.error('Error toggling chore:', error);
    res.status(500).json({ message: 'Failed to toggle chore' });
  }
});

// Delete a chore
router.delete('/:choreId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: 'User is not part of any family' });
    }

    const chore = await Chore.findOne({
      _id: req.params.choreId,
      family: user.familyId,
      isActive: true
    });

    if (!chore) {
      return res.status(404).json({ message: 'Chore not found' });
    }

    // Check permissions - only admins or the person who assigned the chore can delete it
    const family = await Family.findById(user.familyId);
    if (!family.hasPermission(user._id, 'manageChores') && 
        chore.assignedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Permission denied to delete this chore' });
    }

    // Soft delete
    chore.isActive = false;
    await chore.save();

    res.json({
      success: true,
      message: 'Chore deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting chore:', error);
    res.status(500).json({ message: 'Failed to delete chore' });
  }
});

module.exports = router;