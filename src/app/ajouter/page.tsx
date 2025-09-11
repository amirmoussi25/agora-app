"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { RoomForm } from '@/components/rooms/room-form';
import { Button } from '@/components/ui/button';

interface User {
  id: number;
  email: string;
  userType: 'client' | 'mairie';
}

export default function AjouterPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

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

  if (!user || user.userType !== 'mairie') {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p>Redirection...</p>
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
              <Plus className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Ajouter une salle</h1>
            </div>
            <p className="text-muted-foreground">
              Créez une nouvelle salle pour commencer à recevoir des réservations
            </p>
          </div>
        </div>

        <RoomForm />
      </div>
    </MainLayout>
  );
}