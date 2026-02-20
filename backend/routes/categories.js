const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// GET all categories with statistics
router.get('/', async (req, res) => {
  try {
    const categories = ['personal', 'work', 'shopping', 'health', 'education', 'other'];
    const stats = await Promise.all(categories.map(async (category) => {
      const total = await Todo.countDocuments({ category });
      const completed = await Todo.countDocuments({ category, completed: true });
      const pending = total - completed;
      
      return {
        name: category,
        total,
        completed,
        pending,
        color: getCategoryColor(category)
      };
    }));
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET todos by category
router.get('/:category/todos', async (req, res) => {
  try {
    const { category } = req.params;
    const { completed, search } = req.query;
    
    let query = { category };
    
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }
    
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const todos = await Todo.find(query).sort({ priority: -1, dueDate: 1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET category statistics
router.get('/:category/stats', async (req, res) => {
  try {
    const { category } = req.params;
    
    const total = await Todo.countDocuments({ category });
    const completed = await Todo.countDocuments({ category, completed: true });
    const pending = total - completed;
    const overdue = await Todo.countDocuments({
      category,
      completed: false,
      dueDate: { $lt: new Date() }
    });
    
    const priorityStats = await Todo.aggregate([
      { $match: { category } },
      { $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }}
    ]);
    
    res.json({
      category,
      total,
      completed,
      pending,
      overdue,
      priorityStats,
      color: getCategoryColor(category)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET daily tasks
router.get('/daily/active', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyTasks = await Todo.find({
      isDaily: true,
      $or: [
        { dailyReset: false },
        { 
          dailyReset: true,
          $or: [
            { completed: false },
            { completedDates: { $not: { $elemMatch: { $gte: today } } } }
          ]
        }
      ]
    }).sort({ priority: -1 });
    
    // Reset daily tasks if needed
    for (const task of dailyTasks) {
      task.checkDailyReset();
      if (task.isModified()) {
        await task.save();
      }
    }
    
    res.json(dailyTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET task statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const total = await Todo.countDocuments();
    const completed = await Todo.countDocuments({ completed: true });
    const pending = total - completed;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueToday = await Todo.countDocuments({
      completed: false,
      dueDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    const overdue = await Todo.countDocuments({
      completed: false,
      dueDate: { $lt: today }
    });
    
    const dailyCompleted = await Todo.countDocuments({
      isDaily: true,
      completed: true,
      completedAt: { $gte: today }
    });
    
    const totalDaily = await Todo.countDocuments({ isDaily: true });
    
    res.json({
      total,
      completed,
      pending,
      dueToday,
      overdue,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      dailyProgress: totalDaily ? Math.round((dailyCompleted / totalDaily) * 100) : 0,
      dailyCompleted,
      totalDaily
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function for category colors
function getCategoryColor(category) {
  const colors = {
    personal: '#4CAF50',
    work: '#2196F3',
    shopping: '#FF9800',
    health: '#f44336',
    education: '#9C27B0',
    other: '#607D8B'
  };
  return colors[category] || '#607D8B';
}

module.exports = router;