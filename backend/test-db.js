const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/todo-app';

console.log('Testing MongoDB connection...');
console.log('URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  console.log('Database:', mongoose.connection.name);
  
  // List all collections
  return mongoose.connection.db.listCollections().toArray();
})
.then((collections) => {
  console.log('Collections:', collections.map(c => c.name));
  process.exit(0);
})
.catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});