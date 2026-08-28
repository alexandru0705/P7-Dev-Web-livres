// Controllers/book.js
const mongoose = require('mongoose');
const Book = require('../Models/book');

const ObjectId = mongoose.Types.ObjectId;

// ─────────────────────────────────────────────────────────────────────
//  GET    /api/books                → list all books (public)
//  GET    /api/books/bestrating     → top-rated books (public)
//  GET    /api/books/:id            → get one book (public)
//  POST   /api/books                → create a book (authenticated)
//  PUT    /api/books/:id            → update a book (authenticated, owner only)
//  DELETE /api/books/:id            → delete a book (authenticated, owner only)
//  POST   /api/books/:id/rating     → add a rating (authenticated)
// ─────────────────────────────────────────────────────────────────────

// The front-end sends the book fields in a JSON string under the "book"
// form field (see Front/src/lib/common.js).
function parseBookPayload(req) {
  let payload = {};
  if (req.body && typeof req.body.book === 'string') {
    try {
      payload = JSON.parse(req.body.book);
    } catch (e) {
      payload = {};
    }
  } else if (req.body && typeof req.body === 'object') {
    payload = req.body; // fallback: plain JSON body
  }
  return payload;
}

function isValidObjectId(value) {
  return ObjectId.isValid(value);
}

// ── GET /api/books ──────────────────────────────────────────────────
exports.getBooks = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    next(error);
  }
};

// ── GET /api/books/bestrating ───────────────────────────────────────
exports.getBestRatedBooks = async (req, res, next) => {
  try {
    const books = await Book.find({ averageRating: { $gt: 0 } })
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(3);
    res.json(books);
  } catch (error) {
    next(error);
  }
};

// ── GET /api/books/:id ──────────────────────────────────────────────
exports.getBook = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Book not found.' });
    }
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }
    res.json(book);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/books ─────────────────────────────────────────────────
exports.createBook = async (req, res, next) => {
  try {
    const { title, author, year, genre, description } = parseBookPayload(req);

    if (!title || !author) {
      return res
        .status(400)
        .json({ error: 'Title and author are required.' });
    }

    // Cover path if an image was uploaded (already optimised by Sharp)
    let cover = '';
    if (req.file) {
      cover = `/images/${req.file.filename}`;
    }

    // If the creator also rated the book in the same form, store it
    const book = await Book.create({
      userId: req.auth.userId,
      title,
      author,
      year: year ? Number(year) : undefined,
      genre: genre || undefined,
      description: description || undefined,
      cover,
      ratings: [],
      averageRating: 0,
    });

    // Seed an initial rating when the publish form includes one.
    // The front-end sends it inside the "book" JSON as
    // { ratings: [{ userId, grade }], averageRating }.
    const payload = parseBookPayload(req);
    const initialGrade =
      payload.ratings && payload.ratings[0]
        ? payload.ratings[0].grade
        : payload.rating;
    if (initialGrade && Number(initialGrade) >= 1 && Number(initialGrade) <= 5) {
      book.ratings.push({ userId: req.auth.userId, grade: Number(initialGrade) });
      book.averageRating = Number(initialGrade);
      await book.save();
    }

    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/books/:id ──────────────────────────────────────────────
exports.updateBook = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    // Only the owner may modify a book
    if (book.userId.toString() !== req.auth.userId) {
      return res
        .status(403)
        .json({ error: 'You are not allowed to modify this book.' });
    }

    const { title, author, year, genre, description } = parseBookPayload(req);

    if (title) book.title = title;
    if (author) book.author = author;
    if (year) book.year = Number(year);
    if (genre !== undefined) book.genre = genre;
    if (description !== undefined) book.description = description;
    if (req.file) {
      // Delete the previous image file if it existed locally
      book.cover = `/images/${req.file.filename}`;
    }

    await book.save({ runValidators: true });
    res.json(book);
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/books/:id ───────────────────────────────────────────
exports.deleteBook = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    // Only the owner may delete a book
    if (book.userId.toString() !== req.auth.userId) {
      return res
        .status(403)
        .json({ error: 'You are not allowed to delete this book.' });
    }

    await book.deleteOne();
    res.json({ message: 'Book deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/books/:id/rating ──────────────────────────────────────
exports.addRating = async (req, res, next) => {
  try {
    const { rating } = req.body;
    const userId = req.auth.userId;

    // Validate rating value (front sends it as a number 1-5)
    if (rating === undefined || rating === null || Number(rating) < 1 || Number(rating) > 5) {
      return res
        .status(400)
        .json({ error: 'Rating must be a number between 1 and 5.' });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    // ── Prevent duplicate rating from the same user ────────────────
    const existing = book.ratings.find(
      (r) => r.userId.toString() === userId
    );
    if (existing) {
      return res
        .status(409)
        .json({ error: 'You have already rated this book.' });
    }

    // ── Add the new rating to the array ────────────────────────────
    book.ratings.push({ userId, grade: Number(rating) });

    // ── Recalculate the average (rounded to 1 decimal) ─────────────
    const total = book.ratings.reduce((sum, r) => sum + r.grade, 0);
    book.averageRating =
      Math.round((total / book.ratings.length) * 10) / 10;

    await book.save();

    // Return the updated book so the front-end can refresh the display
    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
};
