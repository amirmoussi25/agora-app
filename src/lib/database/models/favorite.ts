import mongoose, { Document, Schema } from 'mongoose';

export interface IFavorite extends Document {
  _id: string;
  userId: number;
  roomId: string;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>({
  userId: { type: Number, required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true }
}, {
  timestamps: true
});

favoriteSchema.index({ userId: 1, roomId: 1 }, { unique: true });

export const Favorite = mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', favoriteSchema);