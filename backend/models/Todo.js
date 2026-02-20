const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Todo text is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('Todo', todoSchema);