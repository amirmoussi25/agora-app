"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Panda, ArrowRight, Building, Heart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const user = JSON.parse(userData);
      if (user.userType === 'client') {
        router.push('/explorer');
      } else {
        router.push('/mes-salles');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          {/* Hero Section */}
          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <Panda className="size-10 text-primary" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Bienvenue sur <span className="text-primary">Agora</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                La plateforme qui connecte les mairies et les citoyens pour la location de salles d'événements
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Commencer maintenant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-blue-100">
                    <Calendar className="size-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold">Pour vos événements</h3>
                <p className="text-muted-foreground">
                  Mariages, anniversaires, séminaires, formations et bien plus encore
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-green-100">
                    <Building className="size-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold">Salles municipales</h3>
                <p className="text-muted-foreground">
                  Découvrez les salles de votre commune et des environs
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-red-100">
                    <Heart className="size-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold">Simple et rapide</h3>
                <p className="text-muted-foreground">
                  Réservez en quelques clics et payez en ligne en toute sécurité
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="bg-muted rounded-2xl p-8 md:p-12">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold">
                Vous êtes une mairie ?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Rejoignez Agora pour valoriser vos salles communales et générer des revenus 
                supplémentaires pour votre commune
              </p>
              <Link href="/register">
                <Button size="lg" variant="outline">
                  Créer un compte mairie
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-muted-foreground">
            <p>© 2024 Agora. Plateforme de réservation de salles municipales.</p>
          </div>
        </div>
      </div>
    </div>
  );
}