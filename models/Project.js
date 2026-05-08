import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title must be 120 characters or fewer'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description must be 1000 characters or fewer'],
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'Short description must be 200 characters or fewer'],
    },

    techStack: {
      type: [String],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one technology is required',
      },
    },

    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },

    githubUrl: {
      type: String,
      trim: true,
      default: null,
    },

    liveUrl: {
      type: String,
      trim: true,
      default: null,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    badge: {
      type: String,
      trim: true,
      maxlength: [100, 'Badge text must be 100 characters or fewer'],
      default: null,
    },

    order: {
      type: Number,
      default: 0, // lower = higher priority in sorted lists
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Public-facing sort: featured first, then by explicit order, then newest
projectSchema.index({ isPublished: 1, featured: -1, order: 1, createdAt: -1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
