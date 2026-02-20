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
    const { text, description, priority, category, dueDate, estimatedTime, isDaily, dailyReset, recurring, tags, subtasks } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Todo text is required' });
    }
    
    const todo = new Todo({
      text: text.trim(),
      description: description || '',
      priority: priority || 'medium',
      category: category || 'personal',
      dueDate: dueDate || null,
      estimatedTime: estimatedTime || null,
      isDaily: isDaily || false,
      dailyReset: dailyReset || false,
      recurring: recurring || 'none',
      tags: tags || [],
      subtasks: subtasks || []
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
    const { text, description, completed, priority, category, dueDate, estimatedTime, isDaily, dailyReset, recurring, tags, subtasks, progress, actualTime } = req.body;
    
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Update fields if provided
    if (text !== undefined) todo.text = text.trim();
    if (description !== undefined) todo.description = description;
    if (completed !== undefined) todo.completed = completed;
    if (priority !== undefined) todo.priority = priority;
    if (category !== undefined) todo.category = category;
    if (dueDate !== undefined) todo.dueDate = dueDate;
    if (estimatedTime !== undefined) todo.estimatedTime = estimatedTime;
    if (actualTime !== undefined) todo.actualTime = actualTime;
    if (isDaily !== undefined) todo.isDaily = isDaily;
    if (dailyReset !== undefined) todo.dailyReset = dailyReset;
    if (recurring !== undefined) todo.recurring = recurring;
    if (tags !== undefined) todo.tags = tags;
    if (subtasks !== undefined) todo.subtasks = subtasks;
    if (progress !== undefined) todo.progress = progress;
    
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
    const allowedUpdates = ['text', 'description', 'completed', 'priority', 'category', 'dueDate', 'estimatedTime', 'actualTime', 'isDaily', 'dailyReset', 'recurring', 'tags', 'subtasks', 'progress', 'notes'];
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

// POST add subtask to todo
router.post('/:id/subtasks', async (req, res) => {
  try {
    const { text } = req.body;
    const todo = await Todo.findById(req.params.id);
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Subtask text is required' });
    }
    
    todo.subtasks.push({ text: text.trim(), completed: false });
    await todo.save();
    
    res.json(todo);
  } catch (error) {
    console.error('Error adding subtask:', error);
    res.status(400).json({ message: 'Error adding subtask', error: error.message });
  }
});

// PATCH update subtask
router.patch('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const { completed, text } = req.body;
    const todo = await Todo.findById(req.params.id);
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    const subtask = todo.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }
    
    if (completed !== undefined) {
      subtask.completed = completed;
    }
    
    if (text !== undefined && text.trim()) {
      subtask.text = text.trim();
    }
    
    // Update main task progress based on subtasks
    const completedSubtasks = todo.subtasks.filter(st => st.completed).length;
    todo.progress = Math.round((completedSubtasks / todo.subtasks.length) * 100);
    
    await todo.save();
    res.json(todo);
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(400).json({ message: 'Error updating subtask', error: error.message });
  }
});

// DELETE subtask
router.delete('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    todo.subtasks = todo.subtasks.filter(st => st._id.toString() !== req.params.subtaskId);
    
    // Update progress
    if (todo.subtasks.length > 0) {
      const completedSubtasks = todo.subtasks.filter(st => st.completed).length;
      todo.progress = Math.round((completedSubtasks / todo.subtasks.length) * 100);
    } else {
      todo.progress = 0;
    }
    
    await todo.save();
    res.json(todo);
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(400).json({ message: 'Error deleting subtask', error: error.message });
  }
});

// POST add tag to todo
router.post('/:id/tags', async (req, res) => {
  try {
    const { tag } = req.body;
    const todo = await Todo.findById(req.params.id);
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    if (!tag || !tag.trim()) {
      return res.status(400).json({ message: 'Tag is required' });
    }
    
    const trimmedTag = tag.trim();
    if (!todo.tags.includes(trimmedTag)) {
      todo.tags.push(trimmedTag);
      await todo.save();
    }
    
    res.json(todo);
  } catch (error) {
    console.error('Error adding tag:', error);
    res.status(400).json({ message: 'Error adding tag', error: error.message });
  }
});

// DELETE tag from todo
router.delete('/:id/tags/:tag', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    todo.tags = todo.tags.filter(t => t !== req.params.tag);
    await todo.save();
    
    res.json(todo);
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(400).json({ message: 'Error deleting tag', error: error.message });
  }
});

// POST log time for todo
router.post('/:id/time', async (req, res) => {
  try {
    const { minutes } = req.body;
    const todo = await Todo.findById(req.params.id);
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    if (!minutes || minutes < 0) {
      return res.status(400).json({ message: 'Valid minutes are required' });
    }
    
    todo.actualTime = (todo.actualTime || 0) + minutes;
    await todo.save();
    
    res.json(todo);
  } catch (error) {
    console.error('Error logging time:', error);
    res.status(400).json({ message: 'Error logging time', error: error.message });
  }
});

module.exports = router;