import { validationResult } from 'express-validator';
import { Resend } from 'resend';
import Message from '../models/Message.js';
import { createError } from '../middleware/errorHandler.js';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/contact
 * Public — saves a contact form submission.
 */
export const submitContact = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

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

/**
 * POST /api/messages/:id/reply
 * Protected (admin) — sends an email reply via Resend.
 */
export const replyMessage = async (req, res, next) => {
  try {
    const { replyText } = req.body;
    if (!replyText || replyText.trim().length === 0) {
      return res.status(422).json({ success: false, message: 'Reply text is required.' });
    }

    const msg = await Message.findById(req.params.id);
    if (!msg) return next(createError('Message not found.', 404));

    const fromEmail = process.env.REPLY_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName  = 'Pritam Rabha';

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to:   msg.email,
      subject: `Re: ${msg.subject || 'Your message'}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <p style="color:#111;font-size:16px">${replyText.replace(/\n/g, '<br/>')}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#888;font-size:13px">— Pritam Rabha · pritamrabha.com</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#aaa;font-size:12px">
            <strong>Original message from ${msg.name}:</strong><br/>
            ${msg.message.replace(/\n/g, '<br/>')}
          </p>
        </div>
      `,
    });

    // Mark as read after reply
    await Message.findByIdAndUpdate(req.params.id, { isRead: true });

    res.status(200).json({ success: true, message: 'Reply sent successfully!' });
  } catch (err) {
    next(err);
  }
};