import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must be 100 characters or fewer'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    subject: {
      type: String,
      trim: true,
      maxlength: [150, 'Subject must be 150 characters or fewer'],
      default: 'No subject',
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message must be 2000 characters or fewer'],
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    ipAddress: {
      type: String,
      select: false, // hidden from regular queries; visible with .select('+ipAddress')
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient admin inbox queries (newest first, unread first)
messageSchema.index({ createdAt: -1 });
messageSchema.index({ isRead: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
