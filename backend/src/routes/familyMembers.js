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
    const family = await Family.findById(user.familyId._id).populate('members.userId', 'profile email');
    const accountHolders = family.members.map(member => ({
      id: member.userId._id,
      name: `${member.userId.profile.firstName} ${member.userId.profile.lastName}`,
      avatar: '👤',
      totalPoints: 0, // TODO: Calculate from completed chores
      completedToday: 0, // TODO: Calculate from today's completed chores
      color: 'from-blue-400 to-indigo-400',
      hasAccount: true,
      role: member.role,
      joinedAt: member.joinedAt
    }));

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

module.exports = router;