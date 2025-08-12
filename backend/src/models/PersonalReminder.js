const mongoose = require('mongoose');

const personalReminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    maxLength: 1000
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['medication', 'appointment', 'task', 'bill', 'call', 'event', 'personal', 'work', 'other'],
    default: 'personal'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: true
  },
  reminderTime: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
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
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    methods: [{
      type: String,
      enum: ['push', 'email', 'sms'],
      default: 'push'
    }],
    advance: [{
      value: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days', 'weeks'],
        required: true
      }
    }]
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  snoozedUntil: {
    type: Date
  },
  location: {
    type: String,
    maxLength: 200
  },
  contact: {
    name: {
      type: String,
      maxLength: 100
    },
    phone: {
      type: String,
      maxLength: 20
    },
    email: {
      type: String,
      maxLength: 100
    }
  },
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'document', 'link', 'other'],
      default: 'other'
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxLength: 30
  }],
  category: {
    type: String,
    maxLength: 50
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  sentNotifications: [{
    sentAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['push', 'email', 'sms']
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
personalReminderSchema.index({ userId: 1, completed: 1, dueDate: 1 });
personalReminderSchema.index({ userId: 1, reminderTime: 1 });
personalReminderSchema.index({ 'notifications.enabled': 1, reminderTime: 1 });
personalReminderSchema.index({ type: 1, priority: 1 });
personalReminderSchema.index({ tags: 1 });

// Virtual for overdue status
personalReminderSchema.virtual('isOverdue').get(function() {
  return !this.completed && new Date() > this.dueDate;
});

// Virtual for upcoming status (within next 24 hours)
personalReminderSchema.virtual('isUpcoming').get(function() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return !this.completed && this.dueDate <= tomorrow && this.dueDate >= new Date();
});

// Virtual for snooze status
personalReminderSchema.virtual('isSnoozed').get(function() {
  return this.snoozedUntil && new Date() < this.snoozedUntil;
});

// Method to calculate notification times
personalReminderSchema.methods.getNotificationTimes = function() {
  if (!this.notifications.enabled || !this.notifications.advance.length) {
    return [this.reminderTime];
  }
  
  const notificationTimes = [];
  
  this.notifications.advance.forEach(advance => {
    const notifyTime = new Date(this.reminderTime);
    
    switch (advance.unit) {
      case 'minutes':
        notifyTime.setMinutes(notifyTime.getMinutes() - advance.value);
        break;
      case 'hours':
        notifyTime.setHours(notifyTime.getHours() - advance.value);
        break;
      case 'days':
        notifyTime.setDate(notifyTime.getDate() - advance.value);
        break;
      case 'weeks':
        notifyTime.setDate(notifyTime.getDate() - (advance.value * 7));
        break;
    }
    
    notificationTimes.push(notifyTime);
  });
  
  // Add the main reminder time
  notificationTimes.push(this.reminderTime);
  
  return notificationTimes.sort((a, b) => a - b);
};

// Method to snooze reminder
personalReminderSchema.methods.snooze = function(minutes = 15) {
  const snoozeUntil = new Date();
  snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);
  this.snoozedUntil = snoozeUntil;
  return this.save();
};

// Method to create recurring instance
personalReminderSchema.methods.createNextInstance = async function() {
  if (!this.recurring.enabled) return null;
  
  const nextDate = new Date(this.dueDate);
  
  switch (this.recurring.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + this.recurring.interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * this.recurring.interval));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + this.recurring.interval);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + this.recurring.interval);
      break;
  }
  
  // Check if we've passed the end date
  if (this.recurring.endDate && nextDate > this.recurring.endDate) {
    return null;
  }
  
  const NextReminder = this.constructor;
  const nextReminder = new NextReminder({
    title: this.title,
    description: this.description,
    userId: this.userId,
    type: this.type,
    priority: this.priority,
    dueDate: nextDate,
    reminderTime: nextDate,
    allDay: this.allDay,
    recurring: this.recurring,
    notifications: this.notifications,
    location: this.location,
    contact: this.contact,
    tags: this.tags,
    category: this.category
  });
  
  return await nextReminder.save();
};

// Ensure virtual fields are serialized
personalReminderSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('PersonalReminder', personalReminderSchema);