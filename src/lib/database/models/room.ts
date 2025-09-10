import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  _id: string;
  ownerId: number;
  name: string;
  description: string;
  capacity: number;
  price: number;
  images: string[];
  amenities: string[];
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>({
  ownerId: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  capacity: { type: Number, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  amenities: [{ type: String }],
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true }
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Room = mongoose.models.Room || mongoose.model<IRoom>('Room', roomSchema);