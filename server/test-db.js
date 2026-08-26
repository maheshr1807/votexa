const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Connection to:', process.env.MONGODB_URI ? 'URI exists' : 'URI missing');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
