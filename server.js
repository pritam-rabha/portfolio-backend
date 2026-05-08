import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// ── Database ──────────────────────────────────────────────────────────────────

await connectDB();

// ── App ───────────────────────────────────────────────────────────────────────

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────

app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// ── Rate limiting ─────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts — please try again in 15 minutes.' },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent — please try again in an hour.' },
});

app.use(globalLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Request logging (dev only) ────────────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Trust proxy ───────────────────────────────────────────────────────────────

app.set('trust proxy', 1);

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRoutes);

// FIX: /api/contact (public POST) and /api/messages (protected GET/PATCH/DELETE)
// were both mapped to messageRoutes which caused route conflicts.
// The messageRoutes file handles both — /api/contact for POST and /api/messages
// for admin GET/PATCH/DELETE. Register both prefixes on the same router.
app.use('/api/contact', contactLimiter, messageRoutes);
app.use('/api/messages', messageRoutes);

app.use('/api/projects', projectRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────────────────────────

app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(async () => {
    const mongoose = (await import('mongoose')).default;
    await mongoose.disconnect();
    console.log('✅  MongoDB disconnected. Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('🔥  Unhandled rejection:', err.message);
  server.close(() => process.exit(1));
});
