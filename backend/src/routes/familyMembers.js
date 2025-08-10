const express = require('express');
const { body, validationResult } = require('express-validator');
const FamilyMember = require('../models/FamilyMember');
const Family = require('../models/Family');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all family members for the user's family
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('familyId');
    if (!user || !user.familyId) {
      return res.status(400).json({ message: 'User is not part of any family' });
    }

    // Get family members (non-account holders)
    const familyMembers = await FamilyMember.find({ 
      family: user.familyId._id, 
      isActive: true 
    }).sort({ createdAt: 1 });

    // Get family account holders
    const family = await Family.findById(user.familyId._id).populate('members.userId');
    
    const accountHolders = family.members.map(member => {
      // Access user data directly from populated member
      const userDoc = member.userId;
      
      return {
        id: userDoc._id,
        name: `${userDoc.profile.firstName} ${userDoc.profile.lastName}`,
        avatar: '👤',
        totalPoints: userDoc.points?.total || 0,
        completedToday: userDoc.points?.completedToday || 0,
        color: 'from-blue-400 to-indigo-400',
        hasAccount: true,
        role: member.role,
        joinedAt: member.joinedAt
      };
    });

    // Combine both types
    const allMembers = [
      ...accountHolders,
      ...familyMembers.map(member => ({
        id: member._id,
        name: member.name,
        avatar: member.avatar,
        totalPoints: member.totalPoints,
        completedToday: member.completedToday,
        color: member.color,
        hasAccount: false,
        createdAt: member.createdAt
      }))
    ];

    res.json({
      success: true,
      members: allMembers,
      familyName: family.name,
      familyId: family._id
    });

  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ message: 'Failed to fetch family members' });
  }
});

// Create a new family member (non-account holder)
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Name must be 1-50 characters'),
  body('avatar').optional().isLength({ max: 10 }),
  body('color').optional().isLength({ max: 100 })
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

    // Check if user has permission to manage family members
    const family = await Family.findById(user.familyId);
    if (!family.hasPermission(user._id, 'manageFamily') && !family.isAdmin(user._id)) {
      return res.status(403).json({ message: 'Permission denied to manage family members' });
    }

    const { name, avatar = '👤', color = 'from-blue-400 to-indigo-400' } = req.body;

    // Check if member name already exists in this family
    const existingMember = await FamilyMember.findOne({ 
      family: user.familyId, 
      name: name.trim(), 
      isActive: true 
    });
    
    if (existingMember) {
      return res.status(409).json({ message: 'A family member with this name already exists' });
    }

    const familyMember = new FamilyMember({
      family: user.familyId,
      name: name.trim(),
      avatar,
      color,
      createdBy: user._id
    });

    await familyMember.save();

    res.status(201).json({
      success: true,
      member: {
        id: familyMember._id,
        name: familyMember.name,
        avatar: familyMember.avatar,
        totalPoints: familyMember.totalPoints,
        completedToday: familyMember.completedToday,
        color: familyMember.color,
        hasAccount: false,
        createdAt: familyMember.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating family member:', error);
    res.status(500).json({ message: 'Failed to create family member' });
  }
});

// Update a family member
router.put('/:memberId', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1, max: 50 }),
  body('avatar').optional().isLength({ max: 10 }),
  body('color').optional().isLength({ max: 100 })
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

    const familyMember = await FamilyMember.findOne({
      _id: req.params.memberId,
      family: user.familyId,
      isActive: true
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Check permissions
    const family = await Family.findById(user.familyId);
    if (!family.hasPermission(user._id, 'manageFamily') && 
        !family.isAdmin(user._id) && 
        familyMember.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Permission denied to update this family member' });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name.trim();
    if (req.body.avatar) updates.avatar = req.body.avatar;
    if (req.body.color) updates.color = req.body.color;

    Object.assign(familyMember, updates);
    await familyMember.save();

    res.json({
      success: true,
      member: {
        id: familyMember._id,
        name: familyMember.name,
        avatar: familyMember.avatar,
        totalPoints: familyMember.totalPoints,
        completedToday: familyMember.completedToday,
        color: familyMember.color,
        hasAccount: false,
        updatedAt: familyMember.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating family member:', error);
    res.status(500).json({ message: 'Failed to update family member' });
  }
});

// Delete a family member
router.delete('/:memberId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: 'User is not part of any family' });
    }

    const familyMember = await FamilyMember.findOne({
      _id: req.params.memberId,
      family: user.familyId,
      isActive: true
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Check permissions
    const family = await Family.findById(user.familyId);
    if (!family.hasPermission(user._id, 'manageFamily') && 
        !family.isAdmin(user._id) && 
        familyMember.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Permission denied to delete this family member' });
    }

    // Soft delete
    familyMember.isActive = false;
    await familyMember.save();

    // TODO: Reassign any chores assigned to this member

    res.json({
      success: true,
      message: 'Family member deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting family member:', error);
    res.status(500).json({ message: 'Failed to delete family member' });
  }
});

// Clear points for a specific family member
router.patch('/:memberId/clear-points', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: 'User is not part of any family' });
    }

    const { memberId } = req.params;

    // Check if it's a user account or family member
    if (memberId.length === 24) { // MongoDB ObjectId length
      // Try to find as user account first
      const targetUser = await User.findOne({ _id: memberId, familyId: user.familyId });
      if (targetUser) {
        targetUser.clearPoints();
        await targetUser.save();
        
        return res.json({
          success: true,
          message: 'User points cleared successfully',
          member: {
            id: targetUser._id,
            name: `${targetUser.profile.firstName} ${targetUser.profile.lastName}`,
            totalPoints: 0,
            completedToday: 0,
            hasAccount: true
          }
        });
      }

      // Try to find as family member
      const familyMember = await FamilyMember.findOne({
        _id: memberId,
        family: user.familyId,
        isActive: true
      });

      if (familyMember) {
        familyMember.clearPoints();
        await familyMember.save();
        
        return res.json({
          success: true,
          message: 'Family member points cleared successfully',
          member: {
            id: familyMember._id,
            name: familyMember.name,
            totalPoints: 0,
            completedToday: 0,
            hasAccount: false
          }
        });
      }
    }

    res.status(404).json({ message: 'Family member not found' });

  } catch (error) {
    console.error('Error clearing member points:', error);
    res.status(500).json({ message: 'Failed to clear points' });
  }
});

// Clear points for all family members
router.patch('/clear-all-points', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: 'User is not part of any family' });
    }

    // Clear points for all family members (non-account)
    await FamilyMember.updateMany(
      { family: user.familyId, isActive: true },
      { $set: { totalPoints: 0, completedToday: 0 } }
    );

    // Clear points for all users in the family
    const family = await Family.findById(user.familyId);
    const userIds = family.members.map(m => m.userId);
    
    await User.updateMany(
      { _id: { $in: userIds } },
      { 
        $set: { 
          'points.total': 0, 
          'points.completedToday': 0,
          'points.lastResetDate': new Date()
        } 
      }
    );

    res.json({
      success: true,
      message: 'All family points cleared successfully',
      clearedMembers: userIds.length + await FamilyMember.countDocuments({
        family: user.familyId,
        isActive: true
      })
    });

  } catch (error) {
    console.error('Error clearing all points:', error);
    res.status(500).json({ message: 'Failed to clear all points' });
  }
});

module.exports = router;