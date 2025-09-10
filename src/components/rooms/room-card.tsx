"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Users, Euro, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Room } from '@/lib/types/room';
import { apiCall } from '@/lib/hooks/use-api';

interface RoomCardProps {
  room: Room;
  showActions?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (roomId: string, isFavorite: boolean) => void;
  onReserve?: (roomId: string) => void;
}

export function RoomCard({ 
  room, 
  showActions = true, 
  isFavorite = false,
  onFavoriteToggle,
  onReserve 
}: RoomCardProps) {
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await apiCall(`/api/favorites/${room._id}`, { method: 'DELETE' });
      } else {
        await apiCall('/api/favorites', { 
          method: 'POST',
          body: JSON.stringify({ roomId: room._id })
        });
      }
      onFavoriteToggle?.(room._id, !isFavorite);
    } catch (error) {
      console.error('Erreur toggle favori:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleReserve = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReserve?.(room._id);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/rooms/${room._id}`}>
        <div className="aspect-video bg-muted relative">
          {room.images && room.images.length > 0 ? (
            <img 
              src={room.images[0]} 
              alt={room.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Calendar className="w-12 h-12" />
            </div>
          )}
          
          {showActions && (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "absolute top-2 right-2 w-8 h-8 p-0 rounded-full",
                isFavorite ? "text-red-500 bg-white/80 hover:bg-white/90" : "text-muted-foreground bg-white/60 hover:bg-white/80"
              )}
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </Button>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="font-semibold text-lg truncate">{room.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="truncate">
                  {room.address.city}, {room.address.postalCode}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {room.description}
            </p>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{room.capacity} pers.</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-primary">
                <Euro className="w-4 h-4" />
                <span>{room.price}€/h</span>
              </div>
            </div>

            {room.amenities && room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {room.amenities.slice(0, 3).map((amenity, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {room.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{room.amenities.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {showActions && onReserve && (
              <Button 
                onClick={handleReserve}
                className="w-full mt-2"
                size="sm"
              >
                Réserver
              </Button>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}