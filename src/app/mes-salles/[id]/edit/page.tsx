"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Edit, ArrowLeft, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { RoomForm } from '@/components/rooms/room-form';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/hooks/use-api';
import { Room } from '@/lib/types/room';

interface User {
  id: number;
  email: string;
  userType: 'client' | 'mairie';
}

export default function EditRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.userType !== 'mairie') {
        router.push('/explorer');
        return;
      }
      setUser(parsedUser);
      setShouldFetch(true);
    } else {
      router.push('/login');
    }
  }, [router]);

  const { data, loading, error } = useApi<{ room: Room }>(
    shouldFetch && roomId ? `/api/rooms/${roomId}` : ''
  );

  const handleSuccess = (updatedRoom: Room) => {
    router.push('/mes-salles');
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

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-4">
            <p className="text-destructive">Erreur: {error}</p>
            <Button onClick={() => router.push('/mes-salles')}>
              Retour à mes salles
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!data?.room) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Salle non trouvée</p>
            <Button onClick={() => router.push('/mes-salles')}>
              Retour à mes salles
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
            onClick={() => router.push('/mes-salles')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Edit className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Modifier la salle</h1>
            </div>
            <p className="text-muted-foreground">
              Modifiez les informations de "{data.room.name}"
            </p>
          </div>
        </div>

        <RoomForm room={data.room} onSuccess={handleSuccess} />
      </div>
    </MainLayout>
  );
}