"use client";

import { useSearchParams } from 'next/navigation';
import { Rabbit } from 'lucide-react';
import { ResetPasswordForm } from '@/components/reset-password-form';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-8 items-center justify-center rounded-md">
              <Rabbit className="size-6" />
            </div>
            <h1 className="text-xl font-bold">Lien invalide</h1>
            <p className="text-center text-sm text-muted-foreground">
              Le lien de réinitialisation est invalide ou a expiré.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}