"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Plus, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { OwnerRoomCard } from '@/components/rooms/owner-room-card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/hooks/use-api';
import { Room, PaginatedResponse } from '@/lib/types/room';

interface User {
  id: number;
  email: string;
  userType: 'client' | 'mairie';
}

export default function MesSallesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [deletedRooms, setDeletedRooms] = useState<Set<string>>(new Set());

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.userType !== 'mairie') {
        router.push('/explorer');
        return;
      }
      setUser(parsedUser);
    } else {
      router.push('/login');
    }
  }, [router]);

  const { data, loading, error, refetch } = useApi<PaginatedResponse<Room>>(
    user ? `/api/rooms/owner?page=${page}&limit=10` : ''
  );

  const handleEdit = (room: Room) => {
    router.push(`/mes-salles/${room._id}/edit`);
  };

  const handleDelete = (roomId: string) => {
    setDeletedRooms(prev => new Set(prev).add(roomId));
    setTimeout(() => refetch(), 500);
  };

  const loadMore = () => {
    if (data?.pagination && page < data.pagination.pages) {
      setPage(page + 1);
    }
  };

  if (!user || user.userType !== 'mairie') {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Vérification des permissions...</span>
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
            <span className="ml-2">Chargement de vos salles...</span>
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

  const visibleRooms = data?.rooms?.filter(room => 
    !deletedRooms.has(room._id)
  ) || [];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Mes salles</h1>
            </div>
            <p className="text-muted-foreground">
              Gérez vos salles et suivez leurs réservations
            </p>
          </div>
          
          <Button onClick={() => router.push('/ajouter')}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une salle
          </Button>
        </div>

        {visibleRooms.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleRooms.map((room) => (
                <OwnerRoomCard
                  key={room._id}
                  room={room}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Page {data.pagination.page} sur {data.pagination.pages}
                  {' '}• {data.pagination.total} salles au total
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
              <Building className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Aucune salle pour le moment</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Commencez par ajouter votre première salle pour commencer à recevoir des réservations
              </p>
            </div>
            <Button onClick={() => router.push('/ajouter')}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter ma première salle
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}