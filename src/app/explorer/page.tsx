"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { SearchFilters } from '@/components/rooms/search-filters';
import { RoomCard } from '@/components/rooms/room-card';
import { Button } from '@/components/ui/button';
import { useApi, apiCall } from '@/lib/hooks/use-api';
import { Room, RoomFilters, PaginatedResponse } from '@/lib/types/room';

export default function ExplorerPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<RoomFilters>({});
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchLoading, setSearchLoading] = useState(false);

  const buildUrl = () => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '10');
    
    if (filters.search) params.set('search', filters.search);
    if (filters.city) params.set('city', filters.city);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.minCapacity) params.set('minCapacity', filters.minCapacity.toString());
    
    return `/api/rooms?${params.toString()}`;
  };

  const { data, loading, error, refetch } = useApi<PaginatedResponse<Room>>(buildUrl());

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    if (page > 1) {
      refetch();
    }
  }, [page]);

  const loadFavorites = async () => {
    try {
      const response = await apiCall<PaginatedResponse<Room>>('/api/favorites');
      const favoriteIds = new Set(response.favorites?.map(room => room._id));
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    }
  };

  const handleSearch = () => {
    setSearchLoading(true);
    setPage(1);
    refetch();
    setTimeout(() => setSearchLoading(false), 500);
  };

  const handleFavoriteToggle = (roomId: string, isFavorite: boolean) => {
    const newFavorites = new Set(favorites);
    if (isFavorite) {
      newFavorites.add(roomId);
    } else {
      newFavorites.delete(roomId);
    }
    setFavorites(newFavorites);
  };

  const handleReserve = (roomId: string) => {
    router.push(`/rooms/${roomId}/book`);
  };

  const loadMore = () => {
    if (data?.pagination && page < data.pagination.pages) {
      setPage(page + 1);
    }
  };

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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Explorer les salles</h1>
          <p className="text-muted-foreground">
            Trouvez la salle parfaite pour votre événement
          </p>
        </div>

        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          isLoading={searchLoading}
        />

        {loading && page === 1 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Chargement des salles...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {data?.rooms && data.rooms.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.rooms.map((room) => (
                    <RoomCard
                      key={room._id}
                      room={room}
                      isFavorite={favorites.has(room._id)}
                      onFavoriteToggle={handleFavoriteToggle}
                      onReserve={handleReserve}
                    />
                  ))}
                </div>

                {data.pagination && data.pagination.pages > 1 && (
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
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Aucune salle trouvée avec ces critères.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({});
                    handleSearch();
                  }}
                  className="mt-4"
                >
                  Voir toutes les salles
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}