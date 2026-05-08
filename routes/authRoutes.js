import { Router } from 'express';
import { body } from 'express-validator';
import { login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// ── Validation rules ─────────────────────────────────────────────────────────

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Authenticate admin and receive JWT.
 */
router.post('/login', loginRules, login);

/**
 * GET /api/auth/me
 * Return current authenticated user.
 */
router.get('/me', protect, getMe);

export default router;
