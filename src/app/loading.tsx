import { Rabbit, Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md">
              <Rabbit className="size-6" />
            </div>
            <span className="sr-only">Agora</span>
            <h1 className="text-xl font-bold">Chargement...</h1>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <div className="text-center text-sm text-muted-foreground">
              Veuillez patienter
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}