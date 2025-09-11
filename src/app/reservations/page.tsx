"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, Filter } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { BookingCard } from '@/components/bookings/booking-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/lib/hooks/use-api';
import { Booking } from '@/lib/types/booking';
import { PaginatedResponse } from '@/lib/types/room';

interface User {
  id: number;
  email: string;
  userType: 'client' | 'mairie';
}

export default function ReservationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const buildUrl = () => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '10');
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    return `/api/bookings?${params.toString()}`;
  };

  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    if (user) {
      setShouldFetch(true);
    }
  }, [user]);

  const { data, loading, error, refetch } = useApi<PaginatedResponse<Booking>>(
    shouldFetch ? buildUrl() : ''
  );

  useEffect(() => {
    if (statusFilter !== 'all') {
      setPage(1);
      setShouldFetch(user !== null);
    }
  }, [statusFilter, user]);

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    refetch();
  };

  const loadMore = () => {
    if (data?.pagination && page < data.pagination.pages) {
      setPage(page + 1);
    }
  };

  const getStatusCounts = () => {
    const bookings = data?.bookings || [];
    return {
      all: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      completed: bookings.filter(b => b.status === 'completed').length
    };
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

  if (loading && page === 1) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Chargement de vos réservations...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-destructive">Erreur: {error}</p>
            <Button onClick={refetch} className="mt-4">
              Réessayer
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const statusCounts = getStatusCounts();
  const bookings = data?.bookings || [];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">
              {user.userType === 'client' ? 'Mes réservations' : 'Réservations reçues'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {user.userType === 'client' 
              ? 'Gérez toutes vos réservations de salles'
              : 'Gérez les demandes de réservation pour vos salles'
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="relative"
            >
              Toutes
              <Badge variant="secondary" className="ml-2">
                {statusCounts.all}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
              className="relative"
            >
              En attente
              <Badge variant="secondary" className="ml-2">
                {statusCounts.pending}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('confirmed')}
              className="relative"
            >
              Confirmées
              <Badge variant="secondary" className="ml-2">
                {statusCounts.confirmed}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
              className="relative"
            >
              Terminées
              <Badge variant="secondary" className="ml-2">
                {statusCounts.completed}
              </Badge>
            </Button>
          </div>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-6">
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  userType={user.userType}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>

            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Page {data.pagination.page} sur {data.pagination.pages}
                  {' '}• {data.pagination.total} réservations au total
                </div>
                
                {page < data.pagination.pages && (
                  <Button 
                    onClick={loadMore} 
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Chargement...
                      </>
                    ) : (
                      'Charger plus'
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {statusFilter === 'all' ? 'Aucune réservation' : `Aucune réservation ${statusFilter}`}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {user.userType === 'client' 
                  ? 'Vous n\'avez pas encore effectué de réservation. Explorez les salles disponibles pour commencer.'
                  : 'Aucune demande de réservation n\'a été reçue pour vos salles.'
                }
              </p>
            </div>
            {user.userType === 'client' && statusFilter === 'all' && (
              <Button onClick={() => window.location.href = '/explorer'}>
                Explorer les salles
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}