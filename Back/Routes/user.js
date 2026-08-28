// Routes/user.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../Controllers/user');

// The front-end calls /api/auth/signup and /api/auth/login,
// so this router is mounted at /api/auth (see app.js).
router.post('/signup', register);
router.post('/login', login);

module.exports = router;