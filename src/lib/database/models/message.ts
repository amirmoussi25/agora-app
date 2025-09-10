import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: string;
  roomId: string;
  senderId: number;
  senderName: string;
  senderType: 'client' | 'mairie';
  content: string;
  type: 'text' | 'system';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  roomId: { type: String, required: true, index: true },
  senderId: { type: Number, required: true },
  senderName: { type: String, required: true },
  senderType: { type: String, enum: ['client', 'mairie'], required: true },
  content: { type: String, required: true, maxlength: 1000 },
  type: { type: String, enum: ['text', 'system'], default: 'text' },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ roomId: 1, senderId: 1 });

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);