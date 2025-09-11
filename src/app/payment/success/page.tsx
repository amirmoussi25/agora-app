"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiCall } from '@/lib/hooks/use-api';

interface PaymentDetails {
  sessionId: string;
  paymentStatus: string;
  amountTotal: number;
  customerEmail: string;
  bookingDetails?: {
    roomName: string;
    eventType: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    expectedAttendees: number;
    totalPrice: number;
  };
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchPaymentDetails();
    } else {
      setError('ID de session manquant');
      setLoading(false);
    }
  }, [sessionId]);

  const fetchPaymentDetails = async () => {
    try {
      const details = await apiCall<PaymentDetails>(`/api/payment/session/${sessionId}`);
      setPaymentDetails(details);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des détails');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3">Vérification du paiement...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Erreur</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/explorer')}>
              Retour à l'exploration
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">Paiement réussi !</h1>
            <p className="text-muted-foreground">
              Votre réservation a été confirmée et payée avec succès.
            </p>
          </div>

          {paymentDetails?.bookingDetails && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Détails de votre réservation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Salle</h3>
                    <p className="text-muted-foreground">
                      {paymentDetails.bookingDetails.roomName}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Type d'événement</h3>
                    <p className="text-muted-foreground capitalize">
                      {paymentDetails.bookingDetails.eventType}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Dates
                    </h3>
                    <p className="text-muted-foreground">
                      Du {formatDate(paymentDetails.bookingDetails.startDate)} au{' '}
                      {formatDate(paymentDetails.bookingDetails.endDate)}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Horaires
                    </h3>
                    <p className="text-muted-foreground">
                      De {formatTime(paymentDetails.bookingDetails.startTime)} à{' '}
                      {formatTime(paymentDetails.bookingDetails.endTime)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Participants
                    </h3>
                    <p className="text-muted-foreground">
                      {paymentDetails.bookingDetails.expectedAttendees} personnes
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Prix total</h3>
                    <p className="text-lg font-bold text-green-600">
                      {formatPrice(paymentDetails.bookingDetails.totalPrice)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Informations de paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID de session:</span>
                <span className="font-mono text-sm">{paymentDetails?.sessionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut:</span>
                <span className="text-green-600 font-semibold">
                  {paymentDetails?.paymentStatus === 'complete' ? 'Payé' : paymentDetails?.paymentStatus}
                </span>
              </div>
              {paymentDetails?.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{paymentDetails.customerEmail}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button onClick={() => router.push('/reservations')}>
              Voir mes réservations
            </Button>
            <Button variant="outline" onClick={() => router.push('/explorer')}>
              Explorer d'autres salles
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}