const mongoose = require('mongoose');
const crypto = require('crypto');

const familySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200,
    default: ''
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'parent', 'child', 'guardian'],
      default: 'parent'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      manageFamily: { type: Boolean, default: false },
      manageCalendar: { type: Boolean, default: true },
      manageGrocery: { type: Boolean, default: true },
      manageChores: { type: Boolean, default: true },
      manageMeals: { type: Boolean, default: true },
      inviteMembers: { type: Boolean, default: false }
    }
  }],
  settings: {
    allowChildrenToInvite: { type: Boolean, default: false },
    requireApprovalForJoining: { type: Boolean, default: true },
    shareCalendarWithAll: { type: Boolean, default: true },
    allowAnonymousChores: { type: Boolean, default: false },
    maxMembers: { type: Number, default: 10, min: 2, max: 20 }
  },
  statistics: {
    totalChoresCompleted: { type: Number, default: 0 },
    totalMealsPlanned: { type: Number, default: 0 },
    totalGroceryItems: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
familySchema.index({ inviteCode: 1 });
familySchema.index({ 'members.userId': 1 });
familySchema.index({ createdBy: 1 });

// Generate unique invite code before saving
familySchema.pre('save', async function(next) {
  if (this.isNew && !this.inviteCode) {
    let inviteCode;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Generate unique invite code
    do {
      inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.constructor.findOne({ inviteCode });
      if (!existing) {
        this.inviteCode = inviteCode;
        break;
      }
      attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts === maxAttempts) {
      return next(new Error('Failed to generate unique invite code'));
    }
  }
  next();
});

// Virtual for member count
familySchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to check if user is admin
familySchema.methods.isAdmin = function(userId) {
  const member = this.members.find(m => m.userId.toString() === userId.toString());
  return member && (member.role === 'admin' || this.createdBy.toString() === userId.toString());
};

// Method to check if user has permission
familySchema.methods.hasPermission = function(userId, permission) {
  if (this.createdBy.toString() === userId.toString()) return true;
  
  const member = this.members.find(m => m.userId.toString() === userId.toString());
  return member && member.permissions[permission];
};

// Method to add member
familySchema.methods.addMember = function(userId, role = 'parent') {
  // Check if user is already a member
  const existingMember = this.members.find(m => m.userId.toString() === userId.toString());
  if (existingMember) {
    throw new Error('User is already a member of this family');
  }

  // Check member limit
  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('Family has reached maximum member limit');
  }

  const permissions = {
    manageFamily: role === 'admin',
    manageCalendar: ['admin', 'parent', 'guardian'].includes(role),
    manageGrocery: ['admin', 'parent', 'guardian'].includes(role),
    manageChores: ['admin', 'parent', 'guardian'].includes(role),
    manageMeals: ['admin', 'parent', 'guardian'].includes(role),
    inviteMembers: role === 'admin' || (role === 'parent' && this.settings.allowChildrenToInvite)
  };

  this.members.push({
    userId,
    role,
    permissions,
    joinedAt: new Date()
  });

  return this;
};

// Method to remove member
familySchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(m => m.userId.toString() !== userId.toString());
  return this;
};

module.exports = mongoose.model('Family', familySchema);