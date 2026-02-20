const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// GET all todos with optional filtering
router.get('/', async (req, res) => {
  try {
    const { completed, search } = req.query;
    let query = {};
    
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }
    
    if (search) {
      query.text = { $regex: search, $options: 'i' };
    }
    
    const todos = await Todo.find(query).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Error fetching todos', error: error.message });
  }
});

// GET single todo
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ message: 'Error fetching todo', error: error.message });
  }
});

// POST create a new todo
router.post('/', async (req, res) => {
  try {
    const { text, description, priority, dueDate } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Todo text is required' });
    }
    
    const todo = new Todo({
      text: text.trim(),
      description: description || '',
      priority: priority || 'medium',
      dueDate: dueDate || null
    });
    
    const newTodo = await todo.save();
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(400).json({ message: 'Error creating todo', error: error.message });
  }
});

// PUT update a todo
router.put('/:id', async (req, res) => {
  try {
    const { text, description, completed, priority, dueDate } = req.body;
    
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Update fields if provided
    if (text !== undefined) todo.text = text.trim();
    if (description !== undefined) todo.description = description;
    if (completed !== undefined) todo.completed = completed;
    if (priority !== undefined) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate;
    
    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(400).json({ message: 'Error updating todo', error: error.message });
  }
});

// PATCH update a todo (partial update)
router.patch('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Update only the fields that are provided in the request body
    const updates = Object.keys(req.body);
    const allowedUpdates = ['text', 'description', 'completed', 'priority', 'dueDate'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }
    
    updates.forEach(update => {
      if (update === 'text') {
        todo[update] = req.body[update].trim();
      } else {
        todo[update] = req.body[update];
      }
    });
    
    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(400).json({ message: 'Error updating todo', error: error.message });
  }
});

// DELETE a todo
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    await Todo.deleteOne({ _id: req.params.id });
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Error deleting todo', error: error.message });
  }
});

// DELETE multiple todos
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of todo IDs' });
    }
    
    const result = await Todo.deleteMany({ _id: { $in: ids } });
    res.json({ 
      message: `${result.deletedCount} todos deleted successfully`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting todos:', error);
    res.status(500).json({ message: 'Error deleting todos', error: error.message });
  }
});

module.exports = router;