import { Schema, model, models, Model, Types } from 'mongoose';
import { Event } from './event.model';

/**
 * Booking interface (Mongoose v7 best practice)
 */
export interface IBooking {
  eventId: Types.ObjectId;
  slug: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Schema
 */
const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => emailRegex.test(value),
        message: 'Invalid email format.',
      },
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Prevent duplicate bookings for the same event + email
 */
BookingSchema.index({ eventId: 1, email: 1 }, { unique: true });

/**
 * ✅ Pre-save hook (ASYNC, NO next())
 */
BookingSchema.pre('save', async function () {
  // Validate event reference only when necessary
  if (!this.isNew && !this.isModified('eventId')) {
    return;
  }

  const exists = await Event.exists({ _id: this.eventId });

  if (!exists) {
    throw new Error('Referenced event does not exist.');
  }
});

/**
 * Model export (Next.js / hot reload safe)
 */
export const Booking: Model<IBooking> =
  (models.Booking as Model<IBooking>) ||
  model<IBooking>('Booking', BookingSchema);

export default Booking;
