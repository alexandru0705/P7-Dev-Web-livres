// Routes/book.js
const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBook,
  getBestRatedBooks,
  createBook,
  updateBook,
  deleteBook,
  addRating,
} = require('../Controllers/book');
const { upload, optimiseImage } = require('../Middlewares/multer');
const auth = require('../Middlewares/auth');

// ── Public routes (no auth required) ────────────────────────────────
router.get('/', getBooks);
// NB: "bestrating" is a static route and MUST be declared before "/:id",
// otherwise Express would match it as a book id and 404.
router.get('/bestrating', getBestRatedBooks);
router.get('/:id', getBook);

// ── Protected routes (auth middleware runs first) ───────────────────
router.post('/', auth, upload.single('image'), optimiseImage, createBook);
router.put('/:id', auth, upload.single('image'), optimiseImage, updateBook);
router.delete('/:id', auth, deleteBook);

// ── Rating (protected) ──────────────────────────────────────────────
router.post('/:id/rating', auth, addRating);

module.exports = router;
