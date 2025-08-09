const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const users = [];

const mongoUri = process.env.MONGODB_URI || 'mongodb://mongo:27017/homeapp';
if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

const ItemSchema = new mongoose.Schema({ name: String });
const Item = mongoose.model('Item', ItemSchema);

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const existing = users.find(u => u.username === username);
  if (existing) {
    return res.status(400).json({ error: 'User exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ username, passwordHash });
  res.status(201).json({ message: 'User registered' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/api/items', authenticateToken, async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

app.post('/api/items', authenticateToken, async (req, res) => {
  const item = new Item({ name: req.body.name });
  await item.save();
  res.status(201).json(item);
});

app.get('/dashboard.html', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/dashboard.html'));
});

app.get('/app-drawer.html', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/app-drawer.html'));
});

app.get('/screen-saver.html', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/screen-saver.html'));
});

app.get('/help.html', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/help.html'));
});

app.get('/', (req, res) => {
  res.send('OK');
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
