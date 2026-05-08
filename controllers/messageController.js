import { validationResult } from 'express-validator';
import Message from '../models/Message.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * POST /api/contact
 * Public — saves a contact form submission.
 * Body: { name, email, subject?, message }
 */
export const submitContact = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    // Capture real IP even behind a reverse proxy (Nginx / Vercel)
    const ipAddress =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket.remoteAddress;

    const newMessage = await Message.create({
      name,
      email,
      subject,
      message,
      ipAddress,
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been received. I will get back to you soon!',
      id: newMessage._id,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/messages
 * Protected (admin) — paginated inbox.
 * Query params: page, limit, unreadOnly
 */
export const getMessages = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.unreadOnly === 'true') filter.isRead = false;

    const [messages, total] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Message.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: messages,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/messages/:id/read
 * Protected (admin) — marks a message as read.
 */
export const markAsRead = async (req, res, next) => {
  try {
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true, runValidators: false },
    );

    if (!msg) return next(createError('Message not found.', 404));

    res.status(200).json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/messages/:id
 * Protected (admin) — permanently deletes a message.
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const msg = await Message.findByIdAndDelete(req.params.id);
    if (!msg) return next(createError('Message not found.', 404));

    res.status(200).json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    next(err);
  }
};
