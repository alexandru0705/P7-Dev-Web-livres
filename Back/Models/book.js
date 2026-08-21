// Models/book.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

// ── Sub-document schema for a single rating ─────────────────────────
// We define it as a sub-schema so Mongoose validates each entry.
const ratingSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',          // links back to the User collection
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Main Book schema ────────────────────────────────────────────────
const bookSchema = new Schema(
  {
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
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    cover: {
      type: String,          // relative path, e.g. "/images/cover_1717000000.jpg"
      default: '',
    },
    ratings: [ratingSchema], // array of sub-documents
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,        // auto-adds createdAt & updatedAt
  }
);

// ── Index for fast lookups ──────────────────────────────────────────
bookSchema.index({ title: 'text', author: 'text' });

module.exports = mongoose.model('Book', bookSchema);
