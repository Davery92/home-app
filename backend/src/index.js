const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const familyRoutes = require('./routes/families');
const familyMemberRoutes = require('./routes/familyMembers');
const calendarRoutes = require('./routes/calendar');
const groceryRoutes = require('./routes/grocery');
const choreRoutes = require('./routes/chores');
const mealRoutes = require('./routes/meals');
const todoRoutes = require('./routes/todos');
const reminderRoutes = require('./routes/reminders');
const personalReminderRoutes = require('./routes/personalReminders');
const cleaningRoutes = require('./routes/cleaning');
const petRoutes = require('./routes/pets');
const giftTrackingRoutes = require('./routes/giftTracking');
const aiRoutes = require('./routes/ai');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://kinnect.avery.cloud', 'http://kinnect.avery.cloud']
    : ['http://localhost:3000', 'http://10.185.1.174:3000', 'https://kinnect.avery.cloud', 'http://kinnect.avery.cloud'],
  credentials: true
}));

// Rate limiting - more generous for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests in dev, 100 in prod
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/family-members', familyMemberRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/grocery', groceryRoutes);
app.use('/api/chores', choreRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/personal-reminders', personalReminderRoutes);
app.use('/api/cleaning', cleaningRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/gift-tracking', giftTrackingRoutes);
app.use('/api/ai', aiRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;