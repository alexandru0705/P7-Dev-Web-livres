// Models/book.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

// ── Sub-document schema for a single rating ─────────────────────────
// Each user may rate a book once; the grade is stored as an integer 1-5.
const ratingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    grade: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ── Main Book schema ────────────────────────────────────────────────
const bookSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: 150,
    },
    year: {
      type: Number,
      min: 1000,
      max: new Date().getFullYear() + 1,
    },
    genre: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    // Relative path, e.g. "/images/cover_1717000000.webp"
    cover: {
      type: String,
      default: '',
    },
    ratings: [ratingSchema],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

// Absolute URL for the cover, resolved against the API base URL.
// The front-end (served on :3000) needs a full URL, not a relative path.
bookSchema.virtual('imageUrl').get(function imageUrl() {
  if (!this.cover) return '';
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  return `${baseUrl}${this.cover}`;
});

// Make the virtual appear in JSON responses
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);