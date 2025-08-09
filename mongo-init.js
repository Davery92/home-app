// MongoDB initialization script
db = db.getSiblingDB('homeapp');

// Create collections with indexes
db.createCollection('users');
db.createCollection('families');
db.createCollection('calendar_events');
db.createCollection('grocery_lists');
db.createCollection('chore_boards');
db.createCollection('meal_plans');
db.createCollection('todos');
db.createCollection('cleaning_schedules');
db.createCollection('reminders');
db.createCollection('medications');
db.createCollection('water_tracking');
db.createCollection('gift_ideas');
db.createCollection('dog_vaccines');

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ familyId: 1 });
db.families.createIndex({ inviteCode: 1 }, { unique: true });
db.calendar_events.createIndex({ familyId: 1, date: 1 });
db.grocery_lists.createIndex({ familyId: 1 });
db.chore_boards.createIndex({ familyId: 1 });
db.meal_plans.createIndex({ familyId: 1, date: 1 });
db.todos.createIndex({ userId: 1 });
db.cleaning_schedules.createIndex({ userId: 1 });
db.reminders.createIndex({ userId: 1, datetime: 1 });
db.medications.createIndex({ userId: 1 });
db.water_tracking.createIndex({ userId: 1, date: 1 });
db.gift_ideas.createIndex({ userId: 1 });
db.dog_vaccines.createIndex({ userId: 1 });

print('Database initialized successfully!');