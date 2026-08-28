// Controllers/user.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/user');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '2h';

// Shared: build the token + response payload for a user
function signToken(user) {
  return jwt.sign({ userId: user._id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
}

// ── POST /api/auth/signup ───────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: 'An account with this email already exists.' });
    }

    // Hash the password (10 salt rounds) — never store plaintext
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
    });

    const token = signToken(user);

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/login ────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Compare plain password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signToken(user);

    res.json({
      message: 'Login successful.',
      token,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};