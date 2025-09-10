"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Panda } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de vérification manquant');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });

        const result = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(result.message);
        } else {
          setStatus('error');
          setMessage(result.error);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Erreur de connexion au serveur');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Link href="/" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <Panda className="size-6 text-primary" />
              </div>
              <span className="sr-only">Agora</span>
            </Link>
            <h1 className="text-xl font-bold">Vérification de votre email</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                {status === 'loading' && (
                  <>
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <div>
                      <h3 className="font-semibold">Vérification en cours...</h3>
                      <p className="text-sm text-muted-foreground">
                        Veuillez patienter pendant que nous vérifions votre email.
                      </p>
                    </div>
                  </>
                )}

                {status === 'success' && (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-800">Email vérifié avec succès !</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {message}
                      </p>
                    </div>
                  </>
                )}

                {status === 'error' && (
                  <>
                    <XCircle className="w-12 h-12 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-red-800">Erreur de vérification</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {message}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            {status === 'success' && (
              <Link href="/login">
                <Button className="w-full">
                  Se connecter
                </Button>
              </Link>
            )}
            
            {status === 'error' && (
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Retour à l'inscription
                </Button>
              </Link>
            )}

            <Link href="/">
              <Button variant="ghost" className="w-full">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}