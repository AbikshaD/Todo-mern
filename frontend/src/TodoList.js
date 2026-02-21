import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TodoList.css';

const API_URL = 'http://localhost:5000/api';

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [formData, setFormData] = useState({
    text: '',
    description: '',
    priority: 'medium',
    category: 'personal',
    dueDate: '',
    estimatedTime: '',
    isDaily: false,
    dailyReset: false,
    recurring: 'none',
    tags: [],
    subtasks: []
  });
  
  // Filter states
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTodos, setSelectedTodos] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeView === 'category' && selectedCategory !== 'all') {
      fetchCategoryTodos(selectedCategory);
    }
  }, [activeView, selectedCategory]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [todosRes, categoriesRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/todos`),
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/categories/stats/overview`)
      ]);
      
      setTodos(todosRes.data);
      setCategories(categoriesRes.data);
      setStats(statsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryTodos = async (category) => {
    try {
      const response = await axios.get(`${API_URL}/categories/${category}/todos`, {
        params: { completed: filter !== 'all' ? filter === 'completed' : undefined }
      });
      setTodos(response.data);
    } catch (err) {
      setError('Failed to fetch category todos');
    }
  };

  const fetchDailyTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories/daily/active`);
      setTodos(response.data);
    } catch (err) {
      setError('Failed to fetch daily tasks');
    }
  };

  const handleToggle = async (id, completed) => {
    try {
      const response = await axios.patch(`${API_URL}/todos/${id}`, { 
        completed: !completed 
      });
      setTodos(todos.map(todo => 
        todo._id === id ? response.data : todo
      ));
      fetchAllData(); // Refresh stats
    } catch (err) {
      setError('Failed to update todo');
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;
    
    try {
      await axios.delete(`${API_URL}/todos/${id}`);
      setTodos(todos.filter(todo => todo._id !== id));
      fetchAllData(); // Refresh stats
    } catch (err) {
      setError('Failed to delete todo');
      console.error('Error:', err);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      text: todo.text,
      description: todo.description || '',
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate ? todo.dueDate.split('T')[0] : '',
      estimatedTime: todo.estimatedTime || '',
      isDaily: todo.isDaily || false,
      dailyReset: todo.dailyReset || false,
      recurring: todo.recurring || 'none',
      tags: todo.tags || [],
      subtasks: todo.subtasks || []
    });
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubtaskAdd = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      e.preventDefault();
      const newSubtask = {
        text: e.target.value.trim(),
        completed: false
      };
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, newSubtask]
      }));
      e.target.value = '';
    }
  };

  const removeSubtask = (index) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.text.trim()) {
      alert('Todo text is required');
      return;
    }

    try {
      if (editingTodo) {
        const response = await axios.put(`${API_URL}/todos/${editingTodo._id}`, formData);
        setTodos(todos.map(todo => 
          todo._id === editingTodo._id ? response.data : todo
        ));
      } else {
        const response = await axios.post(`${API_URL}/todos`, formData);
        setTodos([response.data, ...todos]);
      }
      
      resetForm();
      fetchAllData(); // Refresh stats
    } catch (err) {
      setError(`Failed to ${editingTodo ? 'update' : 'create'} todo`);
      console.error('Error:', err);
    }
  };

  const handleSubtaskToggle = async (todoId, subtaskId, completed) => {
    try {
      const response = await axios.patch(`${API_URL}/todos/${todoId}/subtasks/${subtaskId}`, {
        completed: !completed
      });
      setTodos(todos.map(todo => todo._id === todoId ? response.data : todo));
    } catch (err) {
      setError('Failed to update subtask');
    }
  };

  const handleTimeLog = async (todoId, minutes) => {
    try {
      const response = await axios.post(`${API_URL}/todos/${todoId}/time`, { minutes });
      setTodos(todos.map(todo => todo._id === todoId ? response.data : todo));
    } catch (err) {
      setError('Failed to log time');
    }
  };

  const resetForm = () => {
    setFormData({
      text: '',
      description: '',
      priority: 'medium',
      category: 'personal',
      dueDate: '',
      estimatedTime: '',
      isDaily: false,
      dailyReset: false,
      recurring: 'none',
      tags: [],
      subtasks: []
    });
    setEditingTodo(null);
    setShowForm(false);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#ff4444';
      case 'medium': return '#ffbb33';
      case 'low': return '#00C851';
      default: return '#33b5e5';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      personal: '#4CAF50',
      work: '#2196F3',
      shopping: '#FF9800',
      health: '#f44336',
      education: '#9C27B0',
      other: '#607D8B'
    };
    return colors[category] || '#607D8B';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // FIXED: Added completed parameter to check if todo is completed
  const isOverdue = (dueDate, completed) => {
    if (!dueDate || completed) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="todo-app">
      <header className="app-header">
        <h1>📋 TaskMaster Pro</h1>
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.dueToday}</span>
              <span className="stat-label">Due Today</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.overdue}</span>
              <span className="stat-label">Overdue</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.completionRate}%</span>
              <span className="stat-label">Completion Rate</span>
            </div>
          </div>
        )}
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="main-content">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Views</h3>
            <button 
              className={`view-btn ${activeView === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('all');
                fetchAllData();
              }}
            >
              📊 All Tasks
            </button>
            <button 
              className={`view-btn ${activeView === 'daily' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('daily');
                fetchDailyTasks();
              }}
            >
              🌅 Daily Tasks
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Categories</h3>
            {categories.map(cat => (
              <button
                key={cat.name}
                className={`category-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                style={{ borderLeftColor: cat.color }}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setActiveView('category');
                  fetchCategoryTodos(cat.name);
                }}
              >
                <span className="category-name">{cat.name}</span>
                <span className="category-count">{cat.pending}</span>
              </button>
            ))}
          </div>

          {stats && (
            <div className="sidebar-section">
              <h3>Daily Progress</h3>
              <div className="progress-circle">
                <svg viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth="3"
                    strokeDasharray={`${stats.dailyProgress}, 100`}
                  />
                  <text x="18" y="20.35" className="progress-text">
                    {stats.dailyProgress}%
                  </text>
                </svg>
              </div>
              <div className="daily-stats">
                <span>{stats.dailyCompleted}/{stats.totalDaily} done</span>
              </div>
            </div>
          )}
        </aside>

        <main className="todo-main">
          <div className="toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')}>✕</button>
              )}
            </div>

            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button 
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
            >
              {showForm ? 'Cancel' : '+ New Task'}
            </button>
          </div>

          {showForm && (
            <div className="task-form">
              <h3>{editingTodo ? 'Edit Task' : 'Create New Task'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <input
                    type="text"
                    name="text"
                    placeholder="Task title *"
                    value={formData.text}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <textarea
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="shopping">Shopping</option>
                    <option value="health">Health</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-row">
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                  />
                  <input
                    type="number"
                    name="estimatedTime"
                    placeholder="Est. time (min)"
                    value={formData.estimatedTime}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isDaily"
                      checked={formData.isDaily}
                      onChange={handleInputChange}
                    />
                    Daily Task
                  </label>

                  {formData.isDaily && (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="dailyReset"
                        checked={formData.dailyReset}
                        onChange={handleInputChange}
                      />
                      Reset Daily
                    </label>
                  )}
                </div>

                <div className="form-group">
                  <label>Tags (press Enter to add)</label>
                  <div className="tags-input">
                    <input
                      type="text"
                      placeholder="Add tags..."
                      onKeyDown={handleTagInput}
                    />
                  </div>
                  <div className="tags-list">
                    {formData.tags.map(tag => (
                      <span key={tag} className="tag">
                        {tag}
                        <button onClick={() => removeTag(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Subtasks (press Enter to add)</label>
                  <div className="subtasks-input">
                    <input
                      type="text"
                      placeholder="Add subtask..."
                      onKeyDown={handleSubtaskAdd}
                    />
                  </div>
                  <div className="subtasks-list">
                    {formData.subtasks.map((subtask, index) => (
                      <div key={index} className="subtask-item">
                        <span>{subtask.text}</span>
                        <button onClick={() => removeSubtask(index)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    {editingTodo ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="todo-list">
            {todos.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? 'No tasks match your search' : 'No tasks yet. Create one!'}
              </div>
            ) : (
              todos.map(todo => (
                <div key={todo._id} className={`todo-item priority-${todo.priority}`}>
                  <div className="todo-header">
                    <div className="todo-checkbox">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggle(todo._id, todo.completed)}
                      />
                    </div>
                    
                    <div className="todo-content">
                      <div className="todo-title-row">
                        <span className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                          {todo.text}
                        </span>
                        
                        <div className="todo-badges">
                          <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(todo.priority) }}
                          >
                            {todo.priority}
                          </span>
                          
                          <span 
                            className="category-badge"
                            style={{ backgroundColor: getCategoryColor(todo.category) }}
                          >
                            {todo.category}
                          </span>
                          
                          {todo.isDaily && (
                            <span className="daily-badge">Daily</span>
                          )}
                        </div>
                      </div>

                      {todo.description && (
                        <div className="todo-description">{todo.description}</div>
                      )}

                      {todo.tags && todo.tags.length > 0 && (
                        <div className="todo-tags">
                          {todo.tags.map(tag => (
                            <span key={tag} className="tag">#{tag}</span>
                          ))}
                        </div>
                      )}

                      {todo.subtasks && todo.subtasks.length > 0 && (
                        <div className="todo-subtasks">
                          {todo.subtasks.map((subtask, index) => (
                            <div key={index} className="subtask">
                              <input
                                type="checkbox"
                                checked={subtask.completed}
                                onChange={() => handleSubtaskToggle(todo._id, subtask._id, subtask.completed)}
                              />
                              <span className={subtask.completed ? 'completed' : ''}>
                                {subtask.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="todo-meta">
                        {todo.dueDate && (
                          // FIXED: Pass both dueDate and completed to isOverdue
                          <span className={`due-date ${isOverdue(todo.dueDate, todo.completed) ? 'overdue' : ''}`}>
                            📅 Due: {formatDate(todo.dueDate)}
                          </span>
                        )}
                        
                        {todo.estimatedTime && (
                          <span className="estimated-time">
                            ⏱️ Est: {todo.estimatedTime}min
                          </span>
                        )}
                        
                        {todo.actualTime > 0 && (
                          <span className="actual-time">
                            ⌛ Actual: {todo.actualTime}min
                          </span>
                        )}

                        {todo.progress > 0 && (
                          <span className="progress">
                            Progress: {todo.progress}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="todo-actions">
                      {!todo.completed && (
                        <button
                          onClick={() => handleTimeLog(todo._id, 15)}
                          className="time-btn"
                          title="Log 15 minutes"
                        >
                          ⏱️ +15
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(todo)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(todo._id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default TodoList;