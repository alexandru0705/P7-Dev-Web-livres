// Middlewares/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Protects routes: expects "Authorization: Bearer <token>"
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Guard: missing header would crash on .split()
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Unauthorized: missing token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.auth = { userId: decodedToken.userId };
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: 'Unauthorized: invalid or expired token.' });
  }
};