const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Family = require('../models/Family');
const { authenticateToken, requireFamily, requireFamilyAdmin } = require('../middleware/auth');

const router = express.Router();

// Create a new family
router.post('/create', authenticateToken, [
  body('name').trim().isLength({ min: 1, max: 50 }),
  body('description').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already belongs to a family
    if (req.user.familyId) {
      return res.status(409).json({ 
        message: 'You already belong to a family. Leave your current family first.' 
      });
    }

    const { name, description } = req.body;

    // Create family
    const family = new Family({
      name,
      description: description || '',
      createdBy: req.user._id,
      members: [{
        userId: req.user._id,
        role: 'admin',
        permissions: {
          manageFamily: true,
          manageCalendar: true,
          manageGrocery: true,
          manageChores: true,
          manageMeals: true,
          inviteMembers: true
        }
      }]
    });

    await family.save();

    // Update user's familyId
    await User.findByIdAndUpdate(req.user._id, { familyId: family._id });

    res.status(201).json({
      message: 'Family created successfully',
      family: {
        _id: family._id,
        name: family.name,
        description: family.description,
        inviteCode: family.inviteCode,
        memberCount: family.memberCount,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Family creation error:', error);
    res.status(500).json({ message: 'Failed to create family' });
  }
});

// Join a family using invite code
router.post('/join', authenticateToken, [
  body('inviteCode').trim().isLength({ min: 8, max: 8 }).toUpperCase()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already belongs to a family
    if (req.user.familyId) {
      return res.status(409).json({ 
        message: 'You already belong to a family. Leave your current family first.' 
      });
    }

    const { inviteCode } = req.body;

    // Find family by invite code
    const family = await Family.findOne({ inviteCode, isActive: true });
    if (!family) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Add member to family
    try {
      family.addMember(req.user._id, 'parent');
      await family.save();
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    // Update user's familyId
    await User.findByIdAndUpdate(req.user._id, { familyId: family._id });

    res.json({
      message: 'Successfully joined family',
      family: {
        _id: family._id,
        name: family.name,
        description: family.description,
        memberCount: family.memberCount,
        role: 'parent'
      }
    });

  } catch (error) {
    console.error('Family join error:', error);
    res.status(500).json({ message: 'Failed to join family' });
  }
});

// Get family details
router.get('/', authenticateToken, requireFamily, async (req, res) => {
  try {
    const family = await Family.findById(req.family._id)
      .populate('members.userId', 'profile email')
      .populate('createdBy', 'profile email');

    const userMember = family.members.find(m => 
      m.userId._id.toString() === req.user._id.toString()
    );

    res.json({
      family: {
        _id: family._id,
        name: family.name,
        description: family.description,
        inviteCode: family.inviteCode,
        memberCount: family.memberCount,
        members: family.members.map(member => ({
          _id: member.userId._id,
          name: member.userId.profile.fullName,
          email: member.userId.email,
          role: member.role,
          joinedAt: member.joinedAt,
          permissions: member.permissions
        })),
        settings: family.settings,
        statistics: family.statistics,
        createdAt: family.createdAt,
        userRole: userMember?.role,
        userPermissions: userMember?.permissions
      }
    });

  } catch (error) {
    console.error('Family details error:', error);
    res.status(500).json({ message: 'Failed to fetch family details' });
  }
});

// Update family settings
router.put('/settings', authenticateToken, requireFamily, requireFamilyAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    
    const family = await Family.findByIdAndUpdate(
      req.family._id,
      { $set: { 'settings': { ...req.family.settings, ...settings } } },
      { new: true }
    );

    res.json({
      message: 'Family settings updated',
      settings: family.settings
    });

  } catch (error) {
    console.error('Family settings update error:', error);
    res.status(500).json({ message: 'Failed to update family settings' });
  }
});

// Update member permissions
router.put('/members/:memberId/permissions', 
  authenticateToken, 
  requireFamily, 
  requireFamilyAdmin, 
  async (req, res) => {
    try {
      const { memberId } = req.params;
      const { permissions, role } = req.body;

      const family = await Family.findById(req.family._id);
      const memberIndex = family.members.findIndex(m => 
        m.userId.toString() === memberId
      );

      if (memberIndex === -1) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Prevent admin from changing their own permissions
      if (memberId === req.user._id.toString()) {
        return res.status(403).json({ message: 'Cannot modify your own permissions' });
      }

      if (permissions) {
        family.members[memberIndex].permissions = { 
          ...family.members[memberIndex].permissions, 
          ...permissions 
        };
      }

      if (role) {
        family.members[memberIndex].role = role;
      }

      await family.save();

      res.json({
        message: 'Member permissions updated',
        member: family.members[memberIndex]
      });

    } catch (error) {
      console.error('Member permissions update error:', error);
      res.status(500).json({ message: 'Failed to update member permissions' });
    }
  }
);

// Remove member from family
router.delete('/members/:memberId', 
  authenticateToken, 
  requireFamily, 
  requireFamilyAdmin, 
  async (req, res) => {
    try {
      const { memberId } = req.params;

      // Prevent admin from removing themselves
      if (memberId === req.user._id.toString()) {
        return res.status(403).json({ message: 'Cannot remove yourself from the family' });
      }

      const family = await Family.findById(req.family._id);
      family.removeMember(memberId);
      await family.save();

      // Remove familyId from user
      await User.findByIdAndUpdate(memberId, { familyId: null });

      res.json({ message: 'Member removed from family' });

    } catch (error) {
      console.error('Member removal error:', error);
      res.status(500).json({ message: 'Failed to remove member' });
    }
  }
);

// Leave family
router.post('/leave', authenticateToken, requireFamily, async (req, res) => {
  try {
    const family = await Family.findById(req.family._id);

    // If user is the creator and there are other members, transfer ownership
    if (family.createdBy.toString() === req.user._id.toString() && family.members.length > 1) {
      return res.status(400).json({ 
        message: 'Transfer family ownership before leaving, or delete the family if no other members should remain' 
      });
    }

    // Remove user from family
    family.removeMember(req.user._id);

    // If no members left, deactivate family
    if (family.members.length === 0) {
      family.isActive = false;
    }

    await family.save();

    // Remove familyId from user
    await User.findByIdAndUpdate(req.user._id, { familyId: null });

    res.json({ message: 'Successfully left the family' });

  } catch (error) {
    console.error('Leave family error:', error);
    res.status(500).json({ message: 'Failed to leave family' });
  }
});

module.exports = router;