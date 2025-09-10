import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  _id: string;
  userId: number;
  roomId: string;
  eventType: 'mariage' | 'anniversaire' | 'seminaire' | 'formation' | 'bapteme' | 'conference' | 'reunion' | 'fete';
  startDate: Date;
  endDate: Date;
  guestCount: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentIntentId?: string;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  userId: { type: Number, required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  eventType: {
    type: String,
    enum: ['mariage', 'anniversaire', 'seminaire', 'formation', 'bapteme', 'conference', 'reunion', 'fete'],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  guestCount: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: { type: String },
  specialRequests: { type: String }
}, {
  timestamps: true
});

export const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);