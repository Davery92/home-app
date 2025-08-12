const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea_pig', 'ferret', 'reptile', 'fish', 'horse', 'other'],
    required: true
  },
  breed: {
    type: String,
    maxLength: 100
  },
  birthDate: {
    type: Date
  },
  weight: {
    value: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['lbs', 'kg', 'oz', 'g'],
      default: 'lbs'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown'
  },
  spayedNeutered: {
    type: Boolean,
    default: false
  },
  microchipId: {
    type: String,
    maxLength: 50
  },
  veterinarian: {
    name: {
      type: String,
      maxLength: 100
    },
    clinic: {
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
    },
    address: {
      type: String,
      maxLength: 200
    }
  },
  emergencyContact: {
    name: {
      type: String,
      maxLength: 100
    },
    phone: {
      type: String,
      maxLength: 20
    },
    relationship: {
      type: String,
      maxLength: 50
    }
  },
  medicalConditions: [{
    condition: {
      type: String,
      required: true,
      maxLength: 100
    },
    diagnosedDate: {
      type: Date
    },
    notes: {
      type: String,
      maxLength: 500
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  allergies: [{
    allergen: {
      type: String,
      required: true,
      maxLength: 100
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'moderate'
    },
    notes: {
      type: String,
      maxLength: 300
    }
  }],
  medications: [{
    name: {
      type: String,
      required: true,
      maxLength: 100
    },
    dosage: {
      type: String,
      maxLength: 50
    },
    frequency: {
      type: String,
      maxLength: 50
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    prescribedBy: {
      type: String,
      maxLength: 100
    },
    notes: {
      type: String,
      maxLength: 300
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  photo: {
    type: String, // URL to photo
    maxLength: 500
  },
  notes: {
    type: String,
    maxLength: 1000
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pet Vaccine Record Schema
const petVaccineSchema = new mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vaccineName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  vaccineType: {
    type: String,
    enum: [
      // Dogs
      'rabies', 'dhpp', 'distemper', 'hepatitis', 'parvovirus', 'parainfluenza', 
      'adenovirus', 'bordetella', 'lyme', 'leptospirosis',
      // Cats  
      'fvrcp', 'panleukopenia', 'rhinotracheitis', 'calicivirus', 'felv',
      // Universal
      'other'
    ],
    required: true
  },
  administeredDate: {
    type: Date,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  veterinarian: {
    name: {
      type: String,
      maxLength: 100
    },
    clinic: {
      type: String,
      maxLength: 100
    },
    phone: {
      type: String,
      maxLength: 20
    },
    licenseNumber: {
      type: String,
      maxLength: 50
    }
  },
  batchLotNumber: {
    type: String,
    maxLength: 50
  },
  manufacturer: {
    type: String,
    maxLength: 100
  },
  administrationSite: {
    type: String,
    enum: ['left_shoulder', 'right_shoulder', 'left_rear_leg', 'right_rear_leg', 'scruff', 'other'],
    default: 'other'
  },
  reactions: [{
    type: {
      type: String,
      enum: ['swelling', 'lethargy', 'loss_of_appetite', 'vomiting', 'diarrhea', 'fever', 'allergic_reaction', 'other'],
      required: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      required: true
    },
    notes: {
      type: String,
      maxLength: 300
    },
    resolvedDate: {
      type: Date
    }
  }],
  notes: {
    type: String,
    maxLength: 500
  },
  remindersSent: [{
    sentDate: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['upcoming', 'due', 'overdue'],
      required: true
    },
    daysInAdvance: {
      type: Number
    }
  }],
  certificate: {
    url: {
      type: String,
      maxLength: 500
    },
    filename: {
      type: String,
      maxLength: 100
    }
  },
  isCore: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
petSchema.index({ familyId: 1, isActive: 1 });
petSchema.index({ type: 1 });
petVaccineSchema.index({ petId: 1, nextDueDate: 1 });
petVaccineSchema.index({ familyId: 1, nextDueDate: 1 });
petVaccineSchema.index({ vaccineType: 1, expirationDate: 1 });

// Virtual for pet age
petSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  
  const today = new Date();
  const birth = new Date(this.birthDate);
  const diffTime = Math.abs(today - birth);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `, ${months} month${months > 1 ? 's' : ''}` : ''}`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }
});

// Virtual for overdue vaccines
petVaccineSchema.virtual('isOverdue').get(function() {
  return new Date() > this.nextDueDate;
});

// Virtual for upcoming vaccines (due within 30 days)
petVaccineSchema.virtual('isDueSoon').get(function() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.nextDueDate <= thirtyDaysFromNow && this.nextDueDate >= new Date();
});

// Method to get vaccine status
petVaccineSchema.methods.getStatus = function() {
  if (this.isOverdue) return 'overdue';
  if (this.isDueSoon) return 'due_soon';
  return 'current';
};

// Ensure virtual fields are serialized
petSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

petVaccineSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Pet = mongoose.model('Pet', petSchema);
const PetVaccine = mongoose.model('PetVaccine', petVaccineSchema);

module.exports = { Pet, PetVaccine };