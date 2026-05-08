import { validationResult } from 'express-validator';
import Project from '../models/Project.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * GET /api/projects
 * Public — returns all published projects, featured first.
 */
export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ isPublished: true })
      .sort({ featured: -1, order: 1, createdAt: -1 })
      .select('-__v');

    res.status(200).json({ success: true, total: projects.length, data: projects });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/projects/:id
 * Public — single project by id.
 */
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      isPublished: true,
    });

    if (!project) return next(createError('Project not found.', 404));

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/projects
 * Protected (admin) — create a new project.
 */
export const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const project = await Project.create(req.body);

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/projects/:id
 * Protected (admin) — replace a project document.
 */
export const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!project) return next(createError('Project not found.', 404));

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/projects/:id
 * Protected (admin) — delete a project.
 */
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return next(createError('Project not found.', 404));

    res.status(200).json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    next(err);
  }
};
