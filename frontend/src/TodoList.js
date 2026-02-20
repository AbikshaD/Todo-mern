import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/todos';

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [formData, setFormData] = useState({
    text: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });
  
  // Filter states
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTodos, setSelectedTodos] = useState([]);

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    filterTodos();
  }, [todos, filter, searchTerm]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setTodos(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch todos');
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTodos = () => {
    let filtered = [...todos];
    
    // Apply completion filter
    if (filter === 'active') {
      filtered = filtered.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(todo => todo.completed);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(todo => 
        todo.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        todo.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTodos(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      text: '',
      description: '',
      priority: 'medium',
      dueDate: ''
    });
    setEditingTodo(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.text.trim()) {
      alert('Todo text is required');
      return;
    }

    try {
      if (editingTodo) {
        // Update todo
        const response = await axios.put(`${API_URL}/${editingTodo._id}`, formData);
        setTodos(todos.map(todo => 
          todo._id === editingTodo._id ? response.data : todo
        ));
      } else {
        // Create todo
        const response = await axios.post(API_URL, formData);
        setTodos([response.data, ...todos]);
      }
      
      resetForm();
    } catch (err) {
      setError(`Failed to ${editingTodo ? 'update' : 'create'} todo`);
      console.error('Error:', err);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      text: todo.text,
      description: todo.description || '',
      priority: todo.priority,
      dueDate: todo.dueDate ? todo.dueDate.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleToggle = async (id, completed) => {
    try {
      const response = await axios.patch(`${API_URL}/${id}`, { 
        completed: !completed 
      });
      setTodos(todos.map(todo => 
        todo._id === id ? response.data : todo
      ));
    } catch (err) {
      setError('Failed to update todo');
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;
    
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTodos(todos.filter(todo => todo._id !== id));
      setSelectedTodos(selectedTodos.filter(todoId => todoId !== id));
    } catch (err) {
      setError('Failed to delete todo');
      console.error('Error:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTodos.length === 0) return;
    
    if (!window.confirm(`Delete ${selectedTodos.length} selected todos?`)) return;
    
    try {
      await axios.delete(API_URL, { data: { ids: selectedTodos } });
      setTodos(todos.filter(todo => !selectedTodos.includes(todo._id)));
      setSelectedTodos([]);
    } catch (err) {
      setError('Failed to delete selected todos');
      console.error('Error:', err);
    }
  };

  const handleSelectAll = () => {
    if (selectedTodos.length === filteredTodos.length) {
      setSelectedTodos([]);
    } else {
      setSelectedTodos(filteredTodos.map(todo => todo._id));
    }
  };

  const handleSelectTodo = (id) => {
    setSelectedTodos(prev => 
      prev.includes(id) 
        ? prev.filter(todoId => todoId !== id)
        : [...prev, id]
    );
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffbb33';
      case 'low': return '#00C851';
      default: return '#33b5e5';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading todos...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>📝 Todo List Manager</h1>
      
      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError('')} style={styles.errorClose}>×</button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Search todos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          {showForm ? 'Cancel' : '+ New Todo'}
        </button>
        
        {selectedTodos.length > 0 && (
          <button 
            onClick={handleBulkDelete}
            style={styles.bulkDeleteButton}
          >
            Delete Selected ({selectedTodos.length})
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={styles.formContainer}>
          <h3>{editingTodo ? 'Edit Todo' : 'Create New Todo'}</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              name="text"
              placeholder="Todo title *"
              value={formData.text}
              onChange={handleInputChange}
              style={styles.formInput}
              required
            />
            
            <textarea
              name="description"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={handleInputChange}
              style={styles.formTextarea}
              rows="3"
            />
            
            <div style={styles.formRow}>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                style={styles.formSelect}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                style={styles.formDate}
              />
            </div>
            
            <div style={styles.formButtons}>
              <button type="submit" style={styles.submitButton}>
                {editingTodo ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Todo List */}
      <div style={styles.listContainer}>
        {filteredTodos.length === 0 ? (
          <div style={styles.emptyState}>
            {searchTerm ? 'No todos match your search' : 'No todos yet. Create one!'}
          </div>
        ) : (
          <>
            {/* Select All */}
            <div style={styles.selectAll}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedTodos.length === filteredTodos.length && filteredTodos.length > 0}
                  onChange={handleSelectAll}
                />
                <span style={{ marginLeft: '8px' }}>Select All</span>
              </label>
              <span style={styles.todoCount}>
                {filteredTodos.length} todo{filteredTodos.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Todo Items */}
            {filteredTodos.map(todo => (
              <div key={todo._id} style={styles.todoItem}>
                <div style={styles.todoCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedTodos.includes(todo._id)}
                    onChange={() => handleSelectTodo(todo._id)}
                  />
                </div>
                
                <div style={styles.todoContent}>
                  <div style={styles.todoHeader}>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo._id, todo.completed)}
                      style={styles.completeCheckbox}
                    />
                    <span style={{
                      ...styles.todoText,
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      opacity: todo.completed ? 0.7 : 1
                    }}>
                      {todo.text}
                    </span>
                    <span style={{
                      ...styles.priorityBadge,
                      backgroundColor: getPriorityColor(todo.priority)
                    }}>
                      {todo.priority}
                    </span>
                  </div>
                  
                  {todo.description && (
                    <div style={styles.todoDescription}>
                      {todo.description}
                    </div>
                  )}
                  
                  <div style={styles.todoMeta}>
                    {todo.dueDate && (
                      <span style={styles.dueDate}>
                        Due: {new Date(todo.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <span style={styles.createdDate}>
                      Created: {new Date(todo.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div style={styles.todoActions}>
                  <button 
                    onClick={() => handleEdit(todo)}
                    style={styles.editButton}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(todo._id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    color: '#333',
    borderBottom: '2px solid #007bff',
    paddingBottom: '10px'
  },
  error: {
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    position: 'relative'
  },
  errorClose: {
    position: 'absolute',
    right: '10px',
    top: '5px',
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer'
  },
  toolbar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: '1',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    minWidth: '120px'
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  bulkDeleteButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  formContainer: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formInput: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  formTextarea: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'vertical'
  },
  formRow: {
    display: 'flex',
    gap: '10px'
  },
  formSelect: {
    flex: '1',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  formDate: {
    flex: '1',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  formButtons: {
    display: 'flex',
    gap: '10px'
  },
  submitButton: {
    flex: '1',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cancelButton: {
    flex: '1',
    padding: '12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  listContainer: {
    backgroundColor: 'white',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#6c757d'
  },
  selectAll: {
    padding: '10px 15px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  todoCount: {
    color: '#6c757d',
    fontSize: '14px'
  },
  todoItem: {
    display: 'flex',
    padding: '15px',
    borderBottom: '1px solid #eee',
    gap: '15px',
    alignItems: 'flex-start'
  },
  todoCheckbox: {
    paddingTop: '3px'
  },
  todoContent: {
    flex: '1'
  },
  todoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
    flexWrap: 'wrap'
  },
  completeCheckbox: {
    cursor: 'pointer'
  },
  todoText: {
    fontWeight: '500'
  },
  priorityBadge: {
    padding: '3px 8px',
    borderRadius: '3px',
    color: 'white',
    fontSize: '12px',
    textTransform: 'uppercase'
  },
  todoDescription: {
    color: '#6c757d',
    fontSize: '14px',
    marginBottom: '8px',
    marginLeft: '28px'
  },
  todoMeta: {
    display: 'flex',
    gap: '15px',
    fontSize: '12px',
    color: '#999',
    marginLeft: '28px'
  },
  dueDate: {
    color: '#dc3545'
  },
  createdDate: {
    color: '#6c757d'
  },
  todoActions: {
    display: 'flex',
    gap: '5px'
  },
  editButton: {
    padding: '5px 10px',
    backgroundColor: '#ffc107',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer'
  },
  deleteButton: {
    padding: '5px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#007bff'
  }
};

export default TodoList;