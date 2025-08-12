const mongoose = require('mongoose');

const cleaningTaskSchema = new mongoose.Schema({
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
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  assignedToType: {
    type: String,
    enum: ['user', 'member'],
    required: true
  },
  assignedToName: {
    type: String,
    required: true
  },
  room: {
    type: String,
    enum: ['kitchen', 'bathroom', 'living_room', 'bedroom', 'laundry', 'garage', 'outdoor', 'office', 'dining_room', 'other'],
    default: 'other'
  },
  category: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'seasonal', 'deep_clean', 'maintenance'],
    default: 'weekly'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  estimatedMinutes: {
    type: Number,
    min: 5,
    max: 480, // 8 hours max
    default: 30
  },
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'],
      default: 'weekly'
    },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    },
    nextDueDate: {
      type: Date
    }
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedByName: {
    type: String
  },
  completed: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxLength: 500
  },
  supplies: [{
    name: {
      type: String,
      required: true,
      maxLength: 100
    },
    optional: {
      type: Boolean,
      default: false
    }
  }],
  lastCompleted: {
    type: Date
  },
  completionHistory: [{
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedByName: String,
    notes: String,
    timeSpent: Number // minutes
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
cleaningTaskSchema.index({ familyId: 1, completed: 1, dueDate: 1 });
cleaningTaskSchema.index({ assignedTo: 1, assignedToType: 1 });
cleaningTaskSchema.index({ 'recurring.nextDueDate': 1 });
cleaningTaskSchema.index({ room: 1, category: 1 });

// Virtual for overdue status
cleaningTaskSchema.virtual('isOverdue').get(function() {
  return !this.completed && this.dueDate && new Date() > this.dueDate;
});

// Pre-save middleware to set next due date for recurring tasks
cleaningTaskSchema.pre('save', function(next) {
  if (this.recurring.enabled && this.completed && this.isModified('completed')) {
    this.calculateNextDueDate();
  }
  next();
});

// Method to calculate next due date for recurring tasks
cleaningTaskSchema.methods.calculateNextDueDate = function() {
  if (!this.recurring.enabled) return;
  
  const now = new Date();
  let nextDate = new Date(this.completedAt || now);
  
  switch (this.recurring.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
  }
  
  this.recurring.nextDueDate = nextDate;
  this.dueDate = nextDate;
};

// Method to create next recurring instance
cleaningTaskSchema.methods.createNextInstance = async function() {
  if (!this.recurring.enabled) return null;
  
  this.calculateNextDueDate();
  
  const NextTask = this.constructor;
  const nextTask = new NextTask({
    title: this.title,
    description: this.description,
    familyId: this.familyId,
    createdBy: this.createdBy,
    assignedTo: this.assignedTo,
    assignedToType: this.assignedToType,
    assignedToName: this.assignedToName,
    room: this.room,
    category: this.category,
    priority: this.priority,
    estimatedMinutes: this.estimatedMinutes,
    recurring: this.recurring,
    dueDate: this.recurring.nextDueDate,
    supplies: this.supplies,
    notes: this.notes
  });
  
  return await nextTask.save();
};

// Ensure virtual fields are serialized
cleaningTaskSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('CleaningTask', cleaningTaskSchema);