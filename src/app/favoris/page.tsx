"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { RoomCard } from '@/components/rooms/room-card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/hooks/use-api';
import { Room, PaginatedResponse } from '@/lib/types/room';

export default function FavorisPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [removedFavorites, setRemovedFavorites] = useState<Set<string>>(new Set());

  const { data, loading, error, refetch } = useApi<PaginatedResponse<Room>>(
    `/api/favorites?page=${page}&limit=10`
  );

  const handleFavoriteToggle = (roomId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      setRemovedFavorites(prev => new Set(prev).add(roomId));
      setTimeout(() => refetch(), 500);
    }
  };

  const handleReserve = (roomId: string) => {
    router.push(`/rooms/${roomId}/book`);
  };

  const loadMore = () => {
    if (data?.pagination && page < data.pagination.pages) {
      setPage(page + 1);
    }
  };

  if (loading && page === 1) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Chargement de vos favoris...</span>
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

  const visibleFavorites = data?.favorites?.filter(room => 
    !removedFavorites.has(room._id)
  ) || [];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-current" />
            <h1 className="text-2xl font-bold">Mes favoris</h1>
          </div>
          <p className="text-muted-foreground">
            Retrouvez toutes les salles que vous avez aimées
          </p>
        </div>

        {visibleFavorites.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleFavorites.map((room) => (
                <RoomCard
                  key={room._id}
                  room={room}
                  isFavorite={true}
                  onFavoriteToggle={handleFavoriteToggle}
                  onReserve={handleReserve}
                />
              ))}
            </div>

            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Page {data.pagination.page} sur {data.pagination.pages}
                  {' '}• {data.pagination.total} favoris au total
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
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Aucun favori pour le moment</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Explorez les salles disponibles et ajoutez-les à vos favoris en cliquant sur le cœur
              </p>
            </div>
            <Button onClick={() => router.push('/explorer')}>
              Explorer les salles
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}