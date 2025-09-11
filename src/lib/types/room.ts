export interface Room {
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
  createdAt: string;
  updatedAt: string;
}

export interface RoomFilters {
  search?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
}

export interface PaginatedResponse<T> {
  data?: T[];
  rooms?: T[];
  favorites?: T[];
  bookings?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}