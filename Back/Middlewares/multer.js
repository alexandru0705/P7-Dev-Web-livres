// Middlewares/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// ── 1. Ensure the Images directory exists ───────────────────────────
const uploadDir = path.join(__dirname, '..', 'Images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── 2. Multer storage config ────────────────────────────────────────
// We store the file in a temp location first, then Sharp will
// overwrite it with the optimised version.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique name: cover_<timestamp>_<random>.<ext>
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `cover_${uniqueSuffix}${ext}`);
  },
});

// ── 3. File filter: only accept images ──────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ── 4. Optimisation middleware (runs AFTER multer) ──────────────────
// This is a custom Express middleware that takes the file Multer
// just saved and re-encodes it with Sharp.
const optimiseImage = (req, res, next) => {
  if (!req.file) return next(); // no file uploaded (e.g. PUT without image)

  const inputPath = req.file.path;
  const outputPath = inputPath; // overwrite in place

  sharp(inputPath)
    .resize(800, 800, {
      fit: 'inside',       // keep aspect ratio, max 800×800
      withoutEnlargement: true, // never upscale small images
    })
    .webp({ quality: 75 }) // WebP is ~30 % smaller than JPEG at same quality
    .toFile(outputPath.replace(/\.\w+$/, '.webp'))
    .then(() => {
      // Delete the original (non-optimised) file
      fs.unlink(inputPath, (err) => {
        if (err) console.error('Could not delete original file:', err);
      });
      // Update req.file so downstream code uses the new path
      req.file.path = outputPath.replace(/\.\w+$/, '.webp');
      req.file.filename = path.basename(req.file.path);
      next();
    })
    .catch((err) => {
      console.error('Image optimisation failed:', err);
      next(new Error('Image processing failed'));
    });
};

module.exports = { upload, optimiseImage };
