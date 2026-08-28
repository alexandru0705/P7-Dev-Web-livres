// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
// ── 1. Connect to MongoDB BEFORE anything else ──────────────────────
// Only start accepting traffic once the DB connection is ready
const connectDB = require('./Config/db');

const app = express();

// ── 2. Global middleware ────────────────────────────────────────────
// CORS: allows Kévin's React front-end (different origin) to call our API
app.use(cors());

// Parse JSON bodies (for POST/PUT with JSON payloads)
app.use(express.json());

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// ── 3. Serve uploaded images statically ─────────────────────────────
// When a user uploads a book cover, we store it in ./Images.
// This line makes GET /images/cover123.jpg return the file.
app.use('/images', express.static(path.join(__dirname, 'Images')));

// ── 4. Routes ───────────────────────────────────────────────────────
const userRoutes = require('./Routes/user');
const bookRoutes = require('./Routes/book');

app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);

// ── 5. Health-check endpoint (useful for monitoring) ────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Mon Vieux Grimoire API is running 📚' });
});

// ── 6. 404 catch-all ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── 7. Centralised error handler (MUST be 4 args for Express to catch it) ──
app.use((err, req, res, next) => {
  // Multer errors (e.g. rejected file type, size limit)
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = { app, connectDB };
