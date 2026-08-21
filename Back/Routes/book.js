// Routes/book.js
const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  addRating,
} = require('../Controllers/book');
const { upload, optimiseImage } = require('../Middlewares/multer');
const auth = require('../Middlewares/auth');

// ── Public routes (no auth required) ────────────────────────────────
router.get('/', getBooks);
router.get('/:id', getBook);

// ── Protected routes (auth middleware runs first) ───────────────────
router.post('/', auth, upload.single('cover'), optimiseImage, createBook);
router.put('/:id', auth, upload.single('cover'), optimiseImage, updateBook);
router.delete('/:id', auth, deleteBook);

// ── Rating (protected) ──────────────────────────────────────────────
router.post('/:id/rating', auth, addRating);

module.exports = router;
