import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { createError } from '../middleware/errorHandler.js';

/** Sign a JWT for a given user id. */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { success, token, user }
 */
export const login = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Fetch user with password field (excluded by default via `select: false`)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      // Same message for both cases — prevents email enumeration
      return next(createError('Invalid email or password.', 401));
    }

    // Update lastLogin timestamp (non-blocking)
    user.lastLogin = new Date();
    user.save({ validateBeforeSave: false }).catch(console.error);

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user, // password stripped via toJSON()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Protected — returns current user derived from JWT.
 */
export const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};
