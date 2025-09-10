import { Room } from './room';

export interface Booking {
  _id: string;
  userId: number;
  roomId: string | Room;
  eventType: 'mariage' | 'anniversaire' | 'seminaire' | 'formation' | 'bapteme' | 'conference' | 'reunion' | 'fete';
  startDate: string;
  endDate: string;
  guestCount: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export const eventTypeLabels = {
  mariage: 'Mariage',
  anniversaire: 'Anniversaire', 
  seminaire: 'Séminaire',
  formation: 'Formation',
  bapteme: 'Baptême',
  conference: 'Conférence',
  reunion: 'Réunion',
  fete: 'Fête'
} as const;