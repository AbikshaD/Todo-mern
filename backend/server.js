const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow React app to connect
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/todo-app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📦 Database:', mongoose.connection.name);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Routes
app.use('/api/todos', require('./routes/todos'));
app.use('/api/categories', require('./routes/categories'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Todo API is running',
    endpoints: {
      getAllTodos: 'GET /api/todos',
      getTodoById: 'GET /api/todos/:id',
      createTodo: 'POST /api/todos',
      updateTodo: 'PUT /api/todos/:id',
      patchTodo: 'PATCH /api/todos/:id',
      deleteTodo: 'DELETE /api/todos/:id',
      bulkDelete: 'DELETE /api/todos',
      test: 'GET /api/test',
      todos: 'GET /api/todos',
      categories: 'GET /api/categories',
      daily: 'GET /api/categories/daily/active',
      stats: 'GET /api/categories/stats/overview'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});