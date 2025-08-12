const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { Pet, PetVaccine } = require('../models/Pet');
const { authenticateToken } = require('../middleware/auth');

// Get all pets for family
router.get('/', authenticateToken, async (req, res) => {
  try {
    const familyId = req.user.familyId;

    const pets = await Pet.find({ familyId, isActive: true })
      .sort({ name: 1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      pets: pets.map(pet => ({
        ...pet,
        id: pet._id
      }))
    });

  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pets',
      error: error.message 
    });
  }
});

// Create a new pet
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Pet name must be 1-50 characters'),
  body('type').isIn(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea_pig', 'ferret', 'reptile', 'fish', 'horse', 'other']).withMessage('Valid pet type required'),
  body('breed').optional().isLength({ max: 100 }),
  body('birthDate').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'unknown']),
  body('spayedNeutered').optional().isBoolean(),
  body('weight.value').optional().isNumeric(),
  body('weight.unit').optional().isIn(['lbs', 'kg', 'oz', 'g'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const petData = {
      ...req.body,
      familyId: req.user.familyId,
      addedBy: req.user._id
    };

    const pet = new Pet(petData);
    await pet.save();

    res.status(201).json({
      success: true,
      message: 'Pet added successfully',
      pet: {
        ...pet.toJSON(),
        id: pet._id
      }
    });

  } catch (error) {
    console.error('Error creating pet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add pet',
      error: error.message 
    });
  }
});

// Update a pet
router.put('/:petId', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1, max: 50 }),
  body('breed').optional().isLength({ max: 100 }),
  body('birthDate').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'unknown']),
  body('spayedNeutered').optional().isBoolean(),
  body('weight.value').optional().isNumeric(),
  body('weight.unit').optional().isIn(['lbs', 'kg', 'oz', 'g'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { petId } = req.params;
    const familyId = req.user.familyId;

    const pet = await Pet.findOne({ _id: petId, familyId });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key === 'weight' && req.body[key]) {
        pet.weight = {
          ...pet.weight.toObject(),
          ...req.body[key],
          lastUpdated: new Date()
        };
      } else {
        pet[key] = req.body[key];
      }
    });

    await pet.save();

    res.json({
      success: true,
      message: 'Pet updated successfully',
      pet: {
        ...pet.toJSON(),
        id: pet._id
      }
    });

  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update pet',
      error: error.message 
    });
  }
});

// Delete a pet
router.delete('/:petId', authenticateToken, async (req, res) => {
  try {
    const { petId } = req.params;
    const familyId = req.user.familyId;

    const pet = await Pet.findOne({ _id: petId, familyId });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }

    // Soft delete
    pet.isActive = false;
    await pet.save();

    res.json({
      success: true,
      message: 'Pet removed successfully'
    });

  } catch (error) {
    console.error('Error deleting pet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove pet',
      error: error.message 
    });
  }
});

// Get vaccines for a pet
router.get('/:petId/vaccines', authenticateToken, async (req, res) => {
  try {
    const { petId } = req.params;
    const familyId = req.user.familyId;

    // Verify pet belongs to family
    const pet = await Pet.findOne({ _id: petId, familyId, isActive: true });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }

    const vaccines = await PetVaccine.find({ petId, familyId })
      .sort({ nextDueDate: 1, administeredDate: -1 })
      .lean();

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    res.json({
      success: true,
      vaccines: vaccines.map(vaccine => ({
        ...vaccine,
        id: vaccine._id,
        status: now > vaccine.nextDueDate ? 'overdue' : 
                vaccine.nextDueDate <= thirtyDaysFromNow ? 'due_soon' : 'current',
        isOverdue: now > vaccine.nextDueDate,
        isDueSoon: vaccine.nextDueDate <= thirtyDaysFromNow && vaccine.nextDueDate >= now
      }))
    });

  } catch (error) {
    console.error('Error fetching pet vaccines:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch vaccines',
      error: error.message 
    });
  }
});

// Add a vaccine record
router.post('/:petId/vaccines', authenticateToken, [
  body('vaccineName').trim().isLength({ min: 1, max: 100 }).withMessage('Vaccine name required'),
  body('vaccineType').isIn([
    'rabies', 'dhpp', 'distemper', 'hepatitis', 'parvovirus', 'parainfluenza', 
    'adenovirus', 'bordetella', 'lyme', 'leptospirosis', 'fvrcp', 'panleukopenia', 
    'rhinotracheitis', 'calicivirus', 'felv', 'other'
  ]).withMessage('Valid vaccine type required'),
  body('administeredDate').isISO8601().withMessage('Valid administered date required'),
  body('expirationDate').isISO8601().withMessage('Valid expiration date required'),
  body('nextDueDate').isISO8601().withMessage('Valid next due date required'),
  body('isCore').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { petId } = req.params;
    const familyId = req.user.familyId;

    // Verify pet belongs to family
    const pet = await Pet.findOne({ _id: petId, familyId, isActive: true });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }

    const vaccineData = {
      ...req.body,
      petId,
      familyId,
      recordedBy: req.user._id
    };

    const vaccine = new PetVaccine(vaccineData);
    await vaccine.save();

    res.status(201).json({
      success: true,
      message: 'Vaccine record added successfully',
      vaccine: {
        ...vaccine.toJSON(),
        id: vaccine._id
      }
    });

  } catch (error) {
    console.error('Error creating vaccine record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add vaccine record',
      error: error.message 
    });
  }
});

// Update a vaccine record
router.put('/:petId/vaccines/:vaccineId', authenticateToken, [
  body('vaccineName').optional().trim().isLength({ min: 1, max: 100 }),
  body('administeredDate').optional().isISO8601(),
  body('expirationDate').optional().isISO8601(),
  body('nextDueDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { petId, vaccineId } = req.params;
    const familyId = req.user.familyId;

    const vaccine = await PetVaccine.findOne({ _id: vaccineId, petId, familyId });
    if (!vaccine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vaccine record not found' 
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      vaccine[key] = req.body[key];
    });

    await vaccine.save();

    res.json({
      success: true,
      message: 'Vaccine record updated successfully',
      vaccine: {
        ...vaccine.toJSON(),
        id: vaccine._id
      }
    });

  } catch (error) {
    console.error('Error updating vaccine record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update vaccine record',
      error: error.message 
    });
  }
});

// Delete a vaccine record
router.delete('/:petId/vaccines/:vaccineId', authenticateToken, async (req, res) => {
  try {
    const { petId, vaccineId } = req.params;
    const familyId = req.user.familyId;

    const vaccine = await PetVaccine.findOneAndDelete({ _id: vaccineId, petId, familyId });
    if (!vaccine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vaccine record not found' 
      });
    }

    res.json({
      success: true,
      message: 'Vaccine record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vaccine record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete vaccine record',
      error: error.message 
    });
  }
});

// Get upcoming vaccines for all family pets
router.get('/vaccines/upcoming', authenticateToken, [
  query('days').optional().isInt({ min: 1, max: 365 })
], async (req, res) => {
  try {
    const familyId = req.user.familyId;
    const days = parseInt(req.query.days) || 30;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const upcomingVaccines = await PetVaccine.aggregate([
      {
        $match: {
          familyId,
          nextDueDate: {
            $gte: new Date(),
            $lte: futureDate
          }
        }
      },
      {
        $lookup: {
          from: 'pets',
          localField: 'petId',
          foreignField: '_id',
          as: 'pet'
        }
      },
      {
        $unwind: '$pet'
      },
      {
        $match: {
          'pet.isActive': true
        }
      },
      {
        $sort: {
          nextDueDate: 1
        }
      }
    ]);

    res.json({
      success: true,
      vaccines: upcomingVaccines.map(vaccine => ({
        ...vaccine,
        id: vaccine._id,
        petName: vaccine.pet.name,
        petType: vaccine.pet.type
      }))
    });

  } catch (error) {
    console.error('Error fetching upcoming vaccines:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch upcoming vaccines',
      error: error.message 
    });
  }
});

// Get overdue vaccines for all family pets
router.get('/vaccines/overdue', authenticateToken, async (req, res) => {
  try {
    const familyId = req.user.familyId;

    const overdueVaccines = await PetVaccine.aggregate([
      {
        $match: {
          familyId,
          nextDueDate: {
            $lt: new Date()
          }
        }
      },
      {
        $lookup: {
          from: 'pets',
          localField: 'petId',
          foreignField: '_id',
          as: 'pet'
        }
      },
      {
        $unwind: '$pet'
      },
      {
        $match: {
          'pet.isActive': true
        }
      },
      {
        $sort: {
          nextDueDate: 1
        }
      }
    ]);

    res.json({
      success: true,
      vaccines: overdueVaccines.map(vaccine => ({
        ...vaccine,
        id: vaccine._id,
        petName: vaccine.pet.name,
        petType: vaccine.pet.type,
        daysOverdue: Math.floor((new Date() - vaccine.nextDueDate) / (1000 * 60 * 60 * 24))
      }))
    });

  } catch (error) {
    console.error('Error fetching overdue vaccines:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch overdue vaccines',
      error: error.message 
    });
  }
});

// Get vaccine statistics
router.get('/vaccines/stats', authenticateToken, async (req, res) => {
  try {
    const familyId = req.user.familyId;
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const stats = await PetVaccine.aggregate([
      {
        $lookup: {
          from: 'pets',
          localField: 'petId',
          foreignField: '_id',
          as: 'pet'
        }
      },
      {
        $unwind: '$pet'
      },
      {
        $match: {
          familyId,
          'pet.isActive': true
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          current: {
            $sum: {
              $cond: [{ $gt: ['$nextDueDate', thirtyDaysFromNow] }, 1, 0]
            }
          },
          due_soon: {
            $sum: {
              $cond: [
                { $and: [
                  { $gte: ['$nextDueDate', now] },
                  { $lte: ['$nextDueDate', thirtyDaysFromNow] }
                ]},
                1,
                0
              ]
            }
          },
          overdue: {
            $sum: {
              $cond: [{ $lt: ['$nextDueDate', now] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats.length > 0 ? stats[0] : {
        total: 0,
        current: 0,
        due_soon: 0,
        overdue: 0
      }
    });

  } catch (error) {
    console.error('Error fetching vaccine stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch vaccine stats',
      error: error.message 
    });
  }
});

module.exports = router;