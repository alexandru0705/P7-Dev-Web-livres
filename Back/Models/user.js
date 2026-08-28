// Models/user.js
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  // Plaintext email kept for display (password is never exposed by the API)
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  // Hashed by bcrypt before being persisted — never stored in plaintext
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
});

module.exports = mongoose.model('User', userSchema);