"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Rabbit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setShowSuccessDialog(true);
      } else {
        setError('root', {
          type: 'server',
          message: result.error || 'Erreur lors de l\'envoi du lien',
        });
      }
    } catch (error) {
      setError('root', {
        type: 'server',
        message: 'Erreur de connexion',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Link href="/" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <Rabbit className="size-6" />
              </div>
              <span className="sr-only">Agora</span>
            </Link>
            <h1 className="text-xl font-bold">Mot de passe oublié</h1>
            <div className="text-center text-sm text-muted-foreground">
              Entrez votre email pour recevoir un lien de réinitialisation
            </div>
          </div>

          {errors.root && (
            <div className="text-destructive text-sm text-center">
              {errors.root.message}
            </div>
          )}

          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                {...register('email')}
              />
              {errors.email && (
                <div className="text-destructive text-sm">
                  {errors.email.message}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </Button>
          </div>
        </div>
      </form>
      <div className="text-muted-foreground text-center text-xs text-balance">
        Vous vous souvenez de votre mot de passe ?{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
          Se connecter
        </Link>
        .
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <Mail className="size-12 text-blue-600" />
            </div>
            <AlertDialogTitle className="text-center">
              Lien envoyé !
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation de mot de passe dans quelques minutes.
              <br />
              <br />
              <span className="text-sm text-muted-foreground">
                Vérifiez également votre dossier spam si vous ne recevez pas l'email.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}