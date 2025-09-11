"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { Rabbit } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Link href="/" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <Rabbit className="size-6" />
              </div>
              <span className="sr-only">Agora</span>
            </Link>
            <h1 className="text-xl font-bold">Une erreur est survenue</h1>
            <div className="text-center text-sm text-muted-foreground">
              Quelque chose s'est mal passé. Veuillez réessayer.
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={reset} className="w-full">
              Réessayer
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}