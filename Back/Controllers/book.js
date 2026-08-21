// Controllers/book.js
const Book = require('../Models/book');

// ─────────────────────────────────────────────────────────────────────
//  GET /api/books              → list all books (public)
//  GET /api/books/:id          → get one book (public)
//  POST /api/books             → create a book (authenticated)
//  PUT /api/books/:id          → update a book (authenticated)
//  DELETE /api/books/:id       → delete a book (authenticated)
//  POST /api/books/:id/rating  → add a rating (authenticated)
// ─────────────────────────────────────────────────────────────────────

// ── GET all books ───────────────────────────────────────────────────
exports.getBooks = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    next(error);
  }
};

// ── GET one book ────────────────────────────────────────────────────
exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }
    res.json(book);
  } catch (error) {
    next(error);
  }
};

// ── POST create book ────────────────────────────────────────────────
exports.createBook = async (req, res, next) => {
  try {
    const { title, author, description } = req.body;

    // Build the cover path if an image was uploaded
    let cover = '';
    if (req.file) {
      cover = `/images/${req.file.filename}`;
    }

    const book = await Book.create({
      title,
      author,
      description,
      cover,
      ratings: [],
      averageRating: 0,
    });

    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
};

// ── PUT update book ─────────────────────────────────────────────────
exports.updateBook = async (req, res, next) => {
  try {
    const { title, author, description } = req.body;

    let cover;
    if (req.file) {
      cover = `/images/${req.file.filename}`;
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(author && { author }),
        ...(description !== undefined && { description }),
        ...(cover && { cover }),
      },
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    res.json(book);
  } catch (error) {
    next(error);
  }
};

// ── DELETE book ─────────────────────────────────────────────────────
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }
    res.json({ message: 'Book deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/books/:id/rating  → add a rating ──────────────────────
exports.addRating = async (req, res, next) => {
  try {
    const { rating } = req.body;
    const userId = req.auth.userId; // set by the auth middleware

    // Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ error: 'Rating must be a number between 1 and 5.' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    // ── Prevent duplicate rating from the same user ────────────────
    const alreadyRated = book.ratings.some(
      (r) => r.userId.toString() === userId
    );
    if (alreadyRated) {
      return res
        .status(409)
        .json({ error: 'You have already rated this book.' });
    }

    // ── Add the new rating to the array ────────────────────────────
    book.ratings.push({ userId, rating });

    // ── Recalculate the average ────────────────────────────────────
    const total = book.ratings.reduce((sum, r) => sum + r.rating, 0);
    book.averageRating = Math.round((total / book.ratings.length) * 10) / 10;

    await book.save();

    res.status(201).json({
      message: 'Rating added successfully.',
      averageRating: book.averageRating,
      totalRatings: book.ratings.length,
    });
  } catch (error) {
    next(error);
  }
};
