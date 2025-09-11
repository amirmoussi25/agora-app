"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Users, Euro, Calendar, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Room } from '@/lib/types/room';
import { apiCall } from '@/lib/hooks/use-api';

interface OwnerRoomCardProps {
  room: Room;
  onEdit?: (room: Room) => void;
  onDelete?: (roomId: string) => void;
}

export function OwnerRoomCard({ room, onEdit, onDelete }: OwnerRoomCardProps) {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiCall(`/api/rooms/${room._id}`, { method: 'DELETE' });
      onDelete?.(room._id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Erreur suppression salle:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
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
        
        <div className="absolute top-2 right-2">
          <Badge 
            variant={room.isActive ? "default" : "secondary"}
            className={cn(
              "text-xs",
              room.isActive ? "bg-green-100 text-green-800 border-green-200" : ""
            )}
          >
            {room.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-lg truncate">{room.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="truncate">
                {room.address.city}, {room.address.postalCode}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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

        <div className="flex items-center gap-2 pt-2 border-t">
          <Link href={`/rooms/${room._id}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Voir
            </Button>
          </Link>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onEdit?.(room)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer la salle</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer la salle "{room.name}" ? 
                  Cette action désactivera la salle mais ne supprimera pas les réservations existantes.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}