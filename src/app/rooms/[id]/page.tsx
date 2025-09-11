"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Users, Calendar, Star, Heart, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageGallery } from '@/components/ui/image-gallery';
import { useApi, apiCall } from '@/lib/hooks/use-api';
import { Room } from '@/lib/types/room';

interface User {
  id: number;
  email: string;
  userType: 'client' | 'mairie';
}

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const { data: response, loading, error } = useApi<{room: Room}>(
    roomId ? `/api/rooms/${roomId}` : ''
  );

  const room = response?.room;

  useEffect(() => {
    if (user && room) {
      checkFavoriteStatus();
    }
  }, [user, room]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await apiCall<{favorites: Room[]}>('/api/favorites');
      const favoriteIds = new Set(response.favorites?.map(r => r._id));
      setIsFavorite(favoriteIds.has(room!._id));
    } catch (error) {
      console.error('Erreur vérification favoris:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user || !room) return;

    try {
      await apiCall(`/api/favorites/${room._id}`, {
        method: isFavorite ? 'DELETE' : 'POST'
      });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Erreur toggle favori:', error);
    }
  };

  const handleReserve = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push(`/rooms/${roomId}/book`);
  };

  const handleContact = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push(`/messages?room=${roomId}`);
  };

  if (loading) {
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

  if (error || !room) {
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
          <h1 className="text-2xl font-bold flex-1">{room.name}</h1>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteToggle}
              className={isFavorite ? "text-red-500" : ""}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {room.images && room.images.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <ImageGallery 
                    images={room.images} 
                    alt={room.name}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {room.description || 'Aucune description disponible.'}
                </p>
              </CardContent>
            </Card>

            {room.equipment && room.equipment.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Équipements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {room.equipment.map((item, index) => (
                      <Badge key={index} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{room.address.city}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Capacité: {room.capacity} personnes
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {room.price}€ par heure
                  </span>
                </div>

                {room.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm">
                      {room.rating.toFixed(1)} ({room.reviewCount || 0} avis)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button 
                  onClick={handleReserve}
                  className="w-full"
                  size="lg"
                >
                  Réserver cette salle
                </Button>
                
                {user && user.userType === 'client' && (
                  <Button 
                    onClick={handleContact}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contacter le propriétaire
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground text-center">
                  {room.price}€ par heure
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}