"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertCircle, CheckCircle, Panda } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const baseSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  password: z.string()
    .min(8, 'Au moins 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[a-z]/, 'Au moins une minuscule')
    .regex(/\d/, 'Au moins un chiffre'),
  userType: z.enum(['client', 'mairie'])
});

const clientSchema = baseSchema.extend({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  birthDate: z.string().min(1, 'Date de naissance requise')
});

const mairieSchema = baseSchema.extend({
  mairieName: z.string().min(1, 'Nom de la mairie requis'),
  streetNumber: z.string().min(1, 'Numéro de rue requis'),
  streetName: z.string().min(1, 'Nom de la rue requis'),
  postalCode: z.string().min(5, 'Code postal requis'),
  city: z.string().min(1, 'Ville requise')
});

type RegisterFormValues = z.infer<typeof clientSchema> & z.infer<typeof mairieSchema>;

interface RegisterFormProps extends React.ComponentProps<"div"> {}

export function RegisterForm({ className, ...props }: RegisterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userType, setUserType] = useState<'client' | 'mairie'>('client');

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(userType === 'client' ? clientSchema : mairieSchema),
    defaultValues: {
      email: '',
      password: '',
      userType: 'client'
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const profile = userType === 'client' ? {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate
      } : {
        mairieName: data.mairieName,
        streetNumber: data.streetNumber,
        streetName: data.streetName,
        postalCode: data.postalCode,
        city: data.city
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          userType,
          profile
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur d\'inscription');
      }

      setSuccess(result.message);
      form.reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTypeChange = (type: 'client' | 'mairie') => {
    setUserType(type);
    form.setValue('userType', type);
    form.reset({
      email: form.getValues('email'),
      password: form.getValues('password'),
      userType: type
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Link href="/" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <Panda className="size-6 text-primary" />
              </div>
              <span className="sr-only">Agora</span>
            </Link>
            <h1 className="text-xl font-bold">Rejoignez Agora</h1>
            <div className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href="/login" className="underline underline-offset-4 text-primary hover:text-primary/80">
                Se connecter
              </Link>
            </div>
          </div>

          {error && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="flex items-center gap-2 pt-6">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {success && (
            <Card className="border-green-500/50 bg-green-50">
              <CardContent className="flex items-center gap-2 pt-6">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">{success}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Type de compte</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={userType === 'client' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleUserTypeChange('client')}
                >
                  Client
                </Button>
                <Button
                  type="button"
                  variant={userType === 'mairie' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleUserTypeChange('mairie')}
                >
                  Mairie
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                {...form.register('email')}
                className={form.formState.errors.email ? 'border-destructive' : ''}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                {...form.register('password')}
                className={form.formState.errors.password ? 'border-destructive' : ''}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            {userType === 'client' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      {...form.register('firstName')}
                      className={form.formState.errors.firstName ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      {...form.register('lastName')}
                      className={form.formState.errors.lastName ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="birthDate">Date de naissance</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...form.register('birthDate')}
                    className={form.formState.errors.birthDate ? 'border-destructive' : ''}
                  />
                  {form.formState.errors.birthDate && (
                    <p className="text-sm text-destructive">{form.formState.errors.birthDate.message}</p>
                  )}
                </div>
              </>
            )}

            {userType === 'mairie' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="mairieName">Nom de la mairie</Label>
                  <Input
                    id="mairieName"
                    {...form.register('mairieName')}
                    className={form.formState.errors.mairieName ? 'border-destructive' : ''}
                  />
                  {form.formState.errors.mairieName && (
                    <p className="text-sm text-destructive">{form.formState.errors.mairieName.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="streetNumber">N° rue</Label>
                    <Input
                      id="streetNumber"
                      {...form.register('streetNumber')}
                      className={form.formState.errors.streetNumber ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.streetNumber && (
                      <p className="text-sm text-destructive">{form.formState.errors.streetNumber.message}</p>
                    )}
                  </div>
                  <div className="col-span-2 flex flex-col gap-2">
                    <Label htmlFor="streetName">Nom de la rue</Label>
                    <Input
                      id="streetName"
                      {...form.register('streetName')}
                      className={form.formState.errors.streetName ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.streetName && (
                      <p className="text-sm text-destructive">{form.formState.errors.streetName.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      {...form.register('postalCode')}
                      className={form.formState.errors.postalCode ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.postalCode && (
                      <p className="text-sm text-destructive">{form.formState.errors.postalCode.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      {...form.register('city')}
                      className={form.formState.errors.city ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Inscription...' : 'S\'inscrire'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}