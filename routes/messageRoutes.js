import { Router } from 'express';
import { body } from 'express-validator';
import { submitContact, getMessages, markAsRead, deleteMessage, replyMessage } from '../controllers/messageController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

const contactRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('subject').optional().trim().isLength({ max: 150 }),
  body('message').trim().notEmpty().withMessage('Message is required.').isLength({ min: 1, max: 2000 }),
];

router.post('/', contactRules, submitContact);
router.get('/', protect, restrictTo('admin'), getMessages);
router.patch('/:id/read', protect, restrictTo('admin'), markAsRead);
router.post('/:id/reply', protect, restrictTo('admin'), replyMessage);
router.delete('/:id', protect, restrictTo('admin'), deleteMessage);

export default router;
