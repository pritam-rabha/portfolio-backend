import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

// ── Validation rules ─────────────────────────────────────────────────────────

const projectRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ max: 120 }).withMessage('Title must be 120 characters or fewer.'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required.')
    .isLength({ max: 1000 }).withMessage('Description must be 1000 characters or fewer.'),

  body('techStack')
    .isArray({ min: 1 }).withMessage('At least one technology is required.'),

  body('githubUrl').optional({ checkFalsy: true }).isURL().withMessage('GitHub URL must be a valid URL.'),
  body('liveUrl').optional({ checkFalsy: true }).isURL().withMessage('Live URL must be a valid URL.'),
  body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Image URL must be a valid URL.'),
];

// ── Public routes ─────────────────────────────────────────────────────────────

router.get('/', getProjects);
router.get('/:id', getProject);

// ── Protected (admin) routes ──────────────────────────────────────────────────

router.post('/', protect, restrictTo('admin'), projectRules, createProject);
router.put('/:id', protect, restrictTo('admin'), projectRules, updateProject);
router.delete('/:id', protect, restrictTo('admin'), deleteProject);

export default router;
