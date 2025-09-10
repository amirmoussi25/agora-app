"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Edit, Save, X } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi, apiCall } from '@/lib/hooks/use-api';
import { AvatarUpload } from '@/components/ui/avatar-upload';

interface UserProfile {
  id: number;
  email: string;
  userType: 'client' | 'mairie';
  createdAt: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  mairieName?: string;
  avatar?: string;
  address?: {
    streetNumber: string;
    streetName: string;
    postalCode: string;
    city: string;
  };
}

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }
  }, [router]);

  const { data: profile, loading: profileLoading, refetch } = useApi<{ profile: UserProfile }>(
    user ? '/api/profile' : ''
  );

  useEffect(() => {
    if (profile?.profile && !isEditing) {
      setEditData(profile.profile);
    }
  }, [profile, isEditing]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profile?.profile || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profile?.profile || {});
  };

  const handleAvatarChange = async (avatar: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/profile/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar })
      });
      
      // Mettre à jour les données locales
      setEditData({ ...editData, avatar });
      refetch();
    } catch (error) {
      console.error('Erreur mise à jour avatar:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = user.userType === 'client' ? {
        firstName: editData.firstName,
        lastName: editData.lastName,
        birthDate: editData.birthDate
      } : {
        mairieName: editData.mairieName,
        address: editData.address
      };

      await apiCall('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || profileLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p>Chargement du profil...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const userProfile = profile?.profile;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Mon profil</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <AvatarUpload
                currentAvatar={editData.avatar}
                onAvatarChange={handleAvatarChange}
                size="xl"
                disabled={loading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={userProfile?.email || ''} disabled />
              </div>

              <div className="space-y-2">
                <Label>Type de compte</Label>
                <Input 
                  value={user.userType === 'client' ? 'Client' : 'Mairie'} 
                  disabled 
                />
              </div>

              <div className="space-y-2">
                <Label>Membre depuis</Label>
                <Input 
                  value={userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('fr-FR') : ''} 
                  disabled 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {user.userType === 'client' ? 'Informations personnelles' : 'Informations de la mairie'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.userType === 'client' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prénom</Label>
                      <Input
                        value={editData.firstName || ''}
                        onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input
                        value={editData.lastName || ''}
                        onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date de naissance</Label>
                    <Input
                      type="date"
                      value={editData.birthDate || ''}
                      onChange={(e) => setEditData({...editData, birthDate: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Nom de la mairie</Label>
                    <Input
                      value={editData.mairieName || ''}
                      onChange={(e) => setEditData({...editData, mairieName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>N° rue</Label>
                      <Input
                        value={editData.address?.streetNumber || ''}
                        onChange={(e) => setEditData({
                          ...editData, 
                          address: {...editData.address, streetNumber: e.target.value}
                        })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Nom de la rue</Label>
                      <Input
                        value={editData.address?.streetName || ''}
                        onChange={(e) => setEditData({
                          ...editData, 
                          address: {...editData.address, streetName: e.target.value}
                        })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Code postal</Label>
                      <Input
                        value={editData.address?.postalCode || ''}
                        onChange={(e) => setEditData({
                          ...editData, 
                          address: {...editData.address, postalCode: e.target.value}
                        })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Input
                        value={editData.address?.city || ''}
                        onChange={(e) => setEditData({
                          ...editData, 
                          address: {...editData.address, city: e.target.value}
                        })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Zone de danger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Déconnexion</h3>
                <p className="text-sm text-muted-foreground">
                  Se déconnecter de votre compte Agora
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                disabled={isEditing}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}