"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rabbit, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        if (result.user.userType === 'client') {
          router.push('/explorer');
        } else {
          router.push('/mes-salles');
        }
      } else {
        setError('root', {
          type: 'server',
          message: result.error || 'Erreur de connexion',
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
            <h1 className="text-xl font-bold">Bienvenue sur Agora</h1>
            <div className="text-center text-sm">
              Pas encore de compte ?{" "}
              <Link href="/register" className="underline underline-offset-4">
                S'inscrire
              </Link>
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
            <div className="grid gap-3">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="text-destructive text-sm">
                  {errors.password.message}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
            
            <div className="text-center text-sm">
              <Link href="/forgot-password" className="text-muted-foreground hover:text-primary underline underline-offset-4">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>
        </div>
      </form>
      <div className="text-muted-foreground text-center text-xs text-balance">
        En continuant, vous acceptez nos{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Conditions d'utilisation
        </Link>{" "}
        et notre{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Politique de confidentialité
        </Link>
        .
      </div>
    </div>
  );
}