"use client";

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Euro, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Booking, eventTypeLabels } from '@/lib/types/booking';
import { Room } from '@/lib/types/room';
import { apiCall } from '@/lib/hooks/use-api';
import { cn } from '@/lib/utils';

interface BookingCardProps {
  booking: Booking;
  userType: 'client' | 'mairie';
  onStatusChange?: (bookingId: string, newStatus: string) => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200'
};

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  completed: 'Terminée'
};

const paymentStatusLabels = {
  pending: 'En attente',
  paid: 'Payé',
  failed: 'Échec',
  refunded: 'Remboursé'
};

export function BookingCard({ booking, userType, onStatusChange }: BookingCardProps) {
  const [loading, setLoading] = useState(false);
  const room = booking.roomId as Room;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      await apiCall(`/api/bookings/${booking._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      onStatusChange?.(booking._id, newStatus);
    } catch (error) {
      console.error('Erreur changement statut:', error);
    } finally {
      setLoading(false);
    }
  };

  const canModifyStatus = userType === 'mairie' && booking.status === 'pending';
  const canCancel = userType === 'client' && booking.status === 'pending';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{room?.name}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{room?.address?.city}, {room?.address?.postalCode}</span>
            </div>
          </div>
          <Badge className={cn("text-xs", statusColors[booking.status])}>
            {statusLabels[booking.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{formatDate(booking.startDate)}</div>
              <div className="text-muted-foreground">
                {formatTime(booking.startDate)} - {formatTime(booking.endDate)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{booking.guestCount} invités</div>
              <div className="text-muted-foreground">
                {eventTypeLabels[booking.eventType]}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Euro className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{booking.totalPrice}€</span>
            <span className="text-sm text-muted-foreground">
              • {paymentStatusLabels[booking.paymentStatus]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('cancelled')}
                disabled={loading}
              >
                Annuler
              </Button>
            )}

            {canModifyStatus && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Modifier le statut</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => handleStatusChange('confirmed')}
                      disabled={loading}
                    >
                      Confirmer la réservation
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={loading}
                    >
                      Refuser la réservation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  Détails
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Détails de la réservation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Salle</h4>
                    <p>{room?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {room?.address?.street}, {room?.address?.city} {room?.address?.postalCode}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">Événement</h4>
                    <p>{eventTypeLabels[booking.eventType]}</p>
                    <p className="text-sm text-muted-foreground">{booking.guestCount} invités</p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Date et heure</h4>
                    <p>Du {formatDate(booking.startDate)} à {formatTime(booking.startDate)}</p>
                    <p>Au {formatDate(booking.endDate)} à {formatTime(booking.endDate)}</p>
                  </div>

                  {booking.specialRequests && (
                    <div>
                      <h4 className="font-semibold">Demandes particulières</h4>
                      <p className="text-sm">{booking.specialRequests}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold">Paiement</h4>
                    <p>Montant: {booking.totalPrice}€</p>
                    <p className="text-sm text-muted-foreground">
                      Statut: {paymentStatusLabels[booking.paymentStatus]}
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>Réservation créée le {formatDate(booking.createdAt)}</p>
                    <p>ID: {booking._id}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}