import { Router } from 'express';
import { body } from 'express-validator';
import {
  submitContact,
  getMessages,
  markAsRead,
  deleteMessage,
  replyMessage,
} from '../controllers/messageController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

// ── Validation rules ──────────────────────────────────────────────────────────
const contactRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer.'),
  body('email')
    .isEmail().withMessage('A valid email is required.')
    .normalizeEmail(),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Subject must be 150 characters or fewer.'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required.')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters.'),
];

// ── Public routes ─────────────────────────────────────────────────────────────
/** POST /api/contact */
router.post('/', contactRules, submitContact);

// ── Protected (admin) routes ──────────────────────────────────────────────────
/** GET /api/messages */
router.get('/',           protect, restrictTo('admin'), getMessages);

/** PATCH /api/messages/:id/read */
router.patch('/:id/read', protect, restrictTo('admin'), markAsRead);

/** POST /api/messages/:id/reply */
router.post('/:id/reply', protect, restrictTo('admin'), replyMessage);

/** DELETE /api/messages/:id */
router.delete('/:id',     protect, restrictTo('admin'), deleteMessage);

export default router;