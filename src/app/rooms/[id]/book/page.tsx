"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Calendar, Clock, ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi, apiCall } from '@/lib/hooks/use-api';
import { Room } from '@/lib/types/room';

interface User {
  id: number;
  email: string;
  userType: 'client' | 'mairie';
}

const eventTypes = [
  { value: 'mariage', label: 'Mariage' },
  { value: 'anniversaire', label: 'Anniversaire' },
  { value: 'seminaire', label: 'Séminaire' },
  { value: 'formation', label: 'Formation' },
  { value: 'bapteme', label: 'Baptême' },
  { value: 'conference', label: 'Conférence' },
  { value: 'reunion', label: 'Réunion' },
  { value: 'fete', label: 'Fête' }
];

const bookingSchema = z.object({
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  startTime: z.string().min(1, 'Heure de début requise'),
  endTime: z.string().min(1, 'Heure de fin requise'),
  eventType: z.enum(['mariage', 'anniversaire', 'seminaire', 'formation', 'bapteme', 'conference', 'reunion', 'fete'], {
    required_error: 'Type d\'événement requis'
  }),
  eventDescription: z.string().optional(),
  expectedAttendees: z.coerce.number().min(1, 'Nombre de participants requis'),
}).refine((data) => {
  const start = new Date(data.startDate + 'T' + data.startTime);
  const end = new Date(data.endDate + 'T' + data.endTime);
  return end > start;
}, {
  message: "La date de fin doit être après la date de début",
  path: ["endDate"]
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function BookRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.userType !== 'client') {
        router.push('/login');
        return;
      }
      setUser(parsedUser);
    } else {
      router.push('/login');
    }
  }, [router]);

  const { data: response, loading: roomLoading, error: roomError } = useApi<{room: Room}>(
    roomId ? `/api/rooms/${roomId}` : ''
  );

  const room = response?.room;

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      startTime: '09:00',
      endTime: '17:00',
      eventType: '',
      eventDescription: '',
      expectedAttendees: 1
    }
  });

  const calculatePrice = () => {
    const startDate = form.watch('startDate');
    const endDate = form.watch('endDate');
    
    if (!startDate || !endDate || !room) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    
    return daysDiff * room.price;
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!room || !user) return;

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const bookingData = {
        roomId: room._id,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        eventType: data.eventType,
        eventDescription: data.eventDescription,
        expectedAttendees: data.expectedAttendees,
        totalPrice: calculatePrice()
      };

      const response = await apiCall('/api/payment/create-checkout', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });

      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('URL de paiement non disponible');
      }

    } catch (error: any) {
      setBookingError(error.message || 'Erreur lors de la création du paiement');
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Chargement...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (roomLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Chargement de la salle...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (roomError || !room) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-destructive">Salle introuvable</p>
            <Button onClick={() => router.push('/explorer')} className="mt-4">
              Retour à l'exploration
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (bookingSuccess) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Réservation envoyée !</h2>
            <p className="text-muted-foreground mb-4">
              Votre demande de réservation a été envoyée au propriétaire. 
              Vous recevrez une notification dès que votre réservation sera confirmée.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirection vers vos réservations...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const totalPrice = calculatePrice();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Réserver {room.name}</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Dates et horaires
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Date de début</Label>
                      <Input
                        id="startDate"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        {...form.register('startDate')}
                      />
                      {form.formState.errors.startDate && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.startDate.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Date de fin</Label>
                      <Input
                        id="endDate"
                        type="date"
                        min={form.watch('startDate') || new Date().toISOString().split('T')[0]}
                        {...form.register('endDate')}
                      />
                      {form.formState.errors.endDate && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.endDate.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Heure de début</Label>
                      <Input
                        id="startTime"
                        type="time"
                        {...form.register('startTime')}
                      />
                      {form.formState.errors.startTime && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.startTime.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">Heure de fin</Label>
                      <Input
                        id="endTime"
                        type="time"
                        {...form.register('endTime')}
                      />
                      {form.formState.errors.endTime && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.endTime.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Détails de l'événement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventType">Type d'événement</Label>
                    <Select onValueChange={(value) => form.setValue('eventType', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type d'événement" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.eventType && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.eventType.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedAttendees">Nombre de participants</Label>
                    <Input
                      id="expectedAttendees"
                      type="number"
                      min="1"
                      max={room.capacity}
                      {...form.register('expectedAttendees', { valueAsNumber: true })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Capacité maximale: {room.capacity} personnes
                    </p>
                    {form.formState.errors.expectedAttendees && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.expectedAttendees.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventDescription">Description (optionnel)</Label>
                    <Textarea
                      id="eventDescription"
                      placeholder="Décrivez votre événement..."
                      rows={3}
                      {...form.register('eventDescription')}
                    />
                  </div>
                </CardContent>
              </Card>

              {bookingError && (
                <Alert variant="destructive">
                  <AlertDescription>{bookingError}</AlertDescription>
                </Alert>
              )}
            </form>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-medium">{room.name}</p>
                  <p className="text-sm text-muted-foreground">{room.city}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Prix par jour</span>
                    <span>{room.price}€</span>
                  </div>
                  {totalPrice > 0 && (
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>{totalPrice}€</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={form.handleSubmit(onSubmit)}
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Redirection vers le paiement...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Procéder au paiement
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}