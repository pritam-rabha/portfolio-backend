/**
 * Seed script — creates the initial admin user.
 * Run once: npm run seed
 *
 * Reads credentials from .env:
 *   SEED_ADMIN_EMAIL=admin@example.com
 *   SEED_ADMIN_PASSWORD=ChangeMe123!
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/db.js';

const seed = async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your .env file.');
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin user "${email}" already exists — skipping.`);
    await mongoose.disconnect();
    return;
  }

  await User.create({ name: 'Admin', email, password, role: 'admin' });
  console.log(`✅  Admin user "${email}" created successfully.`);
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
