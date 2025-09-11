"use client";

import Link from 'next/link';
import { Rabbit } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md">
              <Rabbit className="size-6" />
            </div>
            <h1 className="text-xl font-bold">Bienvenue sur Agora</h1>
            <div className="text-center text-sm text-muted-foreground">
              Réservez facilement les salles de votre mairie pour tous vos événements
            </div>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/register">
                S'inscrire gratuitement
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                Se connecter
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}