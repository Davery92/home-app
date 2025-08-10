const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    enum: ['personal', 'work', 'health', 'school', 'family', 'social', 'holiday', 'birthday', 'other'],
    default: 'family'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  color: {
    type: String,
    enum: [
      'blue', 'green', 'red', 'yellow', 'purple', 'pink', 
      'indigo', 'teal', 'orange', 'gray'
    ],
    default: 'blue'
  },
  // Event creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Assigned family members (can be users or family members)
  assignedTo: [{
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    memberType: {
      type: String,
      enum: ['user', 'familyMember'],
      required: true
    },
    name: {
      type: String,
      required: true
    }
  }],
  // Recurrence settings
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: {
      type: Date
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    monthlyType: {
      type: String,
      enum: ['date', 'day'], // date = same date each month, day = same day of week
      default: 'date'
    }
  },
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['notification', 'email'],
      default: 'notification'
    },
    time: {
      type: Number, // minutes before event
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
calendarEventSchema.index({ family: 1, startDate: 1 });
calendarEventSchema.index({ family: 1, endDate: 1 });
calendarEventSchema.index({ family: 1, category: 1 });
calendarEventSchema.index({ family: 1, createdBy: 1 });
calendarEventSchema.index({ 'assignedTo.memberId': 1 });
calendarEventSchema.index({ startDate: 1, endDate: 1 });

// Virtual for duration
calendarEventSchema.virtual('duration').get(function() {
  return this.endDate - this.startDate;
});

// Method to check if event is happening today
calendarEventSchema.methods.isToday = function() {
  const today = new Date();
  const eventDate = new Date(this.startDate);
  
  return today.getDate() === eventDate.getDate() &&
         today.getMonth() === eventDate.getMonth() &&
         today.getFullYear() === eventDate.getFullYear();
};

// Method to check if event is upcoming (within next 7 days)
calendarEventSchema.methods.isUpcoming = function() {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);
  
  return this.startDate >= now && this.startDate <= sevenDaysFromNow;
};

// Method to check if event conflicts with another event
calendarEventSchema.methods.conflictsWith = function(otherEvent) {
  return (this.startDate < otherEvent.endDate && this.endDate > otherEvent.startDate);
};

// Method to mark event as completed
calendarEventSchema.methods.markCompleted = function(userId) {
  this.isCompleted = true;
  this.completedAt = new Date();
  this.completedBy = userId;
  return this;
};

// Static method to find events for a specific date range
calendarEventSchema.statics.findByDateRange = function(familyId, startDate, endDate) {
  return this.find({
    family: familyId,
    isActive: true,
    $or: [
      // Event starts within range
      { startDate: { $gte: startDate, $lte: endDate } },
      // Event ends within range
      { endDate: { $gte: startDate, $lte: endDate } },
      // Event spans the entire range
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ]
  }).sort({ startDate: 1 });
};

// Static method to find events for today
calendarEventSchema.statics.findForToday = function(familyId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.findByDateRange(familyId, startOfDay, endOfDay);
};

// Static method to find upcoming events
calendarEventSchema.statics.findUpcoming = function(familyId, days = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);
  
  return this.find({
    family: familyId,
    isActive: true,
    startDate: { $gte: now, $lte: futureDate }
  }).sort({ startDate: 1 });
};

// Pre-save validation
calendarEventSchema.pre('save', function(next) {
  // Ensure end date is after start date
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  
  // Set default end date for all-day events
  if (this.allDay && this.startDate.getTime() === this.endDate.getTime()) {
    const endOfDay = new Date(this.startDate);
    endOfDay.setHours(23, 59, 59, 999);
    this.endDate = endOfDay;
  }
  
  next();
});

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);