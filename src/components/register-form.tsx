"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rabbit, User, Building, Eye, EyeOff, CheckCircle } from 'lucide-react';
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
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [userType, setUserType] = useState<'client' | 'mairie'>('client');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: 'client',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);

    try {
      const payload = {
        email: data.email,
        password: data.password,
        userType: data.userType,
        profile: data.userType === 'client' 
          ? {
              firstName: data.firstName,
              lastName: data.lastName,
              birthDate: data.birthDate,
            }
          : {
              mairieName: data.mairieName,
              streetNumber: data.streetNumber,
              streetName: data.streetName,
              postalCode: data.postalCode,
              city: data.city,
            }
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setShowSuccessDialog(true);
        // Redirection automatique après 5 secondes
        setTimeout(() => {
          router.push('/login');
        }, 5000);
      } else {
        setError('root', {
          type: 'server',
          message: result.error || 'Erreur lors de l\'inscription',
        });
      }
    } catch (error) {
      setError('root', {
        type: 'server',
        message: 'Erreur lors de l\'inscription',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeChange = (type: 'client' | 'mairie') => {
    setUserType(type);
    setValue('userType', type);
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
            <h1 className="text-xl font-bold">Créer un compte</h1>
            <div className="text-center text-sm">
              Déjà un compte ?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Se connecter
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => handleUserTypeChange('client')}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                userType === 'client' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <User className="size-4" />
              Client
            </button>
            <button
              type="button"
              onClick={() => handleUserTypeChange('mairie')}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                userType === 'mairie' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building className="size-4" />
              Mairie
            </button>
          </div>

          {errors.root && (
            <div className="text-destructive text-sm text-center">
              {errors.root.message}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {userType === 'client' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      placeholder="Votre prénom"
                      {...register('firstName')}
                    />
                    {errors.firstName && (
                      <div className="text-destructive text-sm">
                        {errors.firstName.message}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      placeholder="Votre nom"
                      {...register('lastName')}
                    />
                    {errors.lastName && (
                      <div className="text-destructive text-sm">
                        {errors.lastName.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="birthDate">Date de naissance</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    placeholder="jj/mm/aaaa"
                    {...register('birthDate')}
                  />
                  {errors.birthDate && (
                    <div className="text-destructive text-sm">
                      {errors.birthDate.message}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-3">
                  <Label htmlFor="mairieName">Nom de la mairie</Label>
                  <Input
                    id="mairieName"
                    placeholder="Mairie de..."
                    {...register('mairieName')}
                  />
                  {errors.mairieName && (
                    <div className="text-destructive text-sm">
                      {errors.mairieName.message}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="streetNumber">N°</Label>
                    <Input
                      id="streetNumber"
                      placeholder="123"
                      {...register('streetNumber')}
                    />
                    {errors.streetNumber && (
                      <div className="text-destructive text-sm">
                        {errors.streetNumber.message}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 grid gap-2">
                    <Label htmlFor="streetName">Rue</Label>
                    <Input
                      id="streetName"
                      placeholder="Nom de la rue"
                      {...register('streetName')}
                    />
                    {errors.streetName && (
                      <div className="text-destructive text-sm">
                        {errors.streetName.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      placeholder="75000"
                      {...register('postalCode')}
                    />
                    {errors.postalCode && (
                      <div className="text-destructive text-sm">
                        {errors.postalCode.message}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      placeholder="Nom de la ville"
                      {...register('city')}
                    />
                    {errors.city && (
                      <div className="text-destructive text-sm">
                        {errors.city.message}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

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
                  placeholder="Créez un mot de passe"
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
            <div className="grid gap-3">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirmez votre mot de passe"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="text-destructive text-sm">
                  {errors.confirmPassword.message}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création...' : 'Créer le compte'}
            </Button>
          </div>
        </div>
      </form>
      <div className="text-muted-foreground text-center text-xs text-balance">
        En créant un compte, vous acceptez nos{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Conditions d'utilisation
        </Link>{" "}
        et notre{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Politique de confidentialité
        </Link>
        .
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="size-12 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center">
              Compte créé avec succès !
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Un email de vérification a été envoyé à votre adresse.
              Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation pour activer votre compte.
              <br />
              <br />
              <span className="text-sm text-muted-foreground">
                Redirection automatique vers la page de connexion dans quelques secondes...
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}