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
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['personal', 'work', 'shopping', 'health', 'education', 'other'],
    default: 'personal',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  dueDate: {
    type: Date,
    default: null
  },
  estimatedTime: {
    type: Number, // in minutes
    min: 0,
    default: null
  },
  actualTime: {
    type: Number, // in minutes
    min: 0,
    default: null
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isDaily: {
    type: Boolean,
    default: false
  },
  dailyReset: {
    type: Boolean,
    default: false // If true, task resets daily
  },
  recurring: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },
  completedDates: [{
    type: Date
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  subtasks: [{
    text: String,
    completed: { type: Boolean, default: false }
  }],
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
});

// Update the updatedAt timestamp on save
todoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set completedAt when task is marked complete
  if (this.completed && !this.completedAt) {
    this.completedAt = Date.now();
  } else if (!this.completed) {
    this.completedAt = null;
  }
  
  next();
});

// Method to check if daily task needs reset
todoSchema.methods.checkDailyReset = function() {
  if (this.isDaily && this.dailyReset) {
    const lastCompleted = this.completedDates[this.completedDates.length - 1];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (lastCompleted) {
      const lastCompletedDate = new Date(lastCompleted);
      lastCompletedDate.setHours(0, 0, 0, 0);
      
      // If last completed was before today, reset the task
      if (lastCompletedDate < today) {
        this.completed = false;
        this.progress = 0;
      }
    }
  }
  return this;
};

module.exports = mongoose.model('Todo', todoSchema);