// Routes/user.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../Controllers/user');

// POST /api/users/register
router.post('/register', register);

// POST /api/users/login
router.post('/login', login);

module.exports = router;
