import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes — verifies the Bearer token in the Authorization header.
 * Attaches the authenticated user document to `req.user`.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorised — no token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user (excluding password) to confirm account still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorised — user no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Session expired — please log in again.'
        : 'Not authorised — invalid token.';

    return res.status(401).json({ success: false, message });
  }
};

/**
 * Restrict access to specific roles.
 * Usage: router.get('/admin', protect, restrictTo('admin'), handler)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};

export { protect, restrictTo };
