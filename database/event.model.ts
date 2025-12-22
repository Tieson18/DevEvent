import { Schema, model, models, Model } from 'mongoose';

/**
 * Event interface (no Document extension — best practice)
 */
export interface IEvent {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: Date;
  time: string; // HH:MM (24-hour)
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Slug utility
 */
const slugifyTitle = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Schema
 */
const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 1,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    overview: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    mode: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      required: true,
      trim: true,
    },
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) =>
          Array.isArray(value) &&
          value.length > 0 &&
          value.every((v) => v.trim().length > 0),
        message: 'Agenda must be a non-empty array of non-empty strings.',
      },
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) =>
          Array.isArray(value) &&
          value.length > 0 &&
          value.every((v) => v.trim().length > 0),
        message: 'Tags must be a non-empty array of non-empty strings.',
      },
    },
  },
  {
    timestamps: true,
  },
);

/**
 * ✅ Pre-save hook (ASYNC, NO next())
 */
EventSchema.pre('save', async function () {
  // Generate slug on create or title change
  if (this.isNew || this.isModified('title')) {
    this.slug = `${slugifyTitle(this.title)}-${Date.now().toString(36)}`;
  }

  // Validate & normalize time
  if (this.isNew || this.isModified('time')) {
    const match = this.time.match(/^(\d{1,2}):(\d{2})$/);

    if (!match) {
      throw new Error('Invalid time format. Expected HH:MM (24-hour).');
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) {
      throw new Error('Invalid time value.');
    }

    this.time = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }
});

/**
 * Model export (Next.js / hot reload safe)
 */
export const Event: Model<IEvent> =
  (models.Event as Model<IEvent>) ||
  model<IEvent>('Event', EventSchema);

export default Event;
