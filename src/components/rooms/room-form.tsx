"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { apiCall } from '@/lib/hooks/use-api';
import { Room } from '@/lib/types/room';

const roomSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100, 'Maximum 100 caractères'),
  description: z.string().min(10, 'Minimum 10 caractères').max(500, 'Maximum 500 caractères'),
  capacity: z.number().min(1, 'Capacité minimum 1').max(1000, 'Capacité maximum 1000'),
  price: z.number().min(0, 'Prix minimum 0€').max(10000, 'Prix maximum 10000€'),
  address: z.object({
    street: z.string().min(1, 'Adresse requise'),
    city: z.string().min(1, 'Ville requise'),
    postalCode: z.string().min(5, 'Code postal requis').max(5, 'Code postal invalide')
  }),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([])
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomFormProps {
  room?: Room;
  onSuccess?: (room: Room) => void;
}

export function RoomForm({ room, onSuccess }: RoomFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAmenity, setNewAmenity] = useState('');

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: room ? {
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      price: room.price,
      address: room.address,
      amenities: room.amenities || [],
      images: room.images || []
    } : {
      name: '',
      description: '',
      capacity: 1,
      price: 0,
      address: {
        street: '',
        city: '',
        postalCode: ''
      },
      amenities: [],
      images: []
    }
  });

  const { fields: amenityFields, append: appendAmenity, remove: removeAmenity } = useFieldArray({
    control: form.control,
    name: 'amenities'
  });

  const onSubmit = async (data: RoomFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (room) {
        result = await apiCall<{ room: Room }>(`/api/rooms/${room._id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } else {
        result = await apiCall<{ room: Room }>('/api/rooms', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }

      onSuccess?.(result.room);
      router.push('/mes-salles');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !form.getValues('amenities').includes(newAmenity.trim())) {
      appendAmenity(newAmenity.trim());
      setNewAmenity('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAmenity();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la salle *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Ex: Grande salle de réception"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Décrivez votre salle, ses caractéristiques, son ambiance..."
              rows={4}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacité (personnes) *</Label>
              <Input
                id="capacity"
                type="number"
                {...form.register('capacity', { valueAsNumber: true })}
                placeholder="50"
              />
              {form.formState.errors.capacity && (
                <p className="text-sm text-destructive">{form.formState.errors.capacity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Prix par heure (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...form.register('price', { valueAsNumber: true })}
                placeholder="100"
              />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adresse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Adresse complète *</Label>
            <Input
              id="street"
              {...form.register('address.street')}
              placeholder="123 Rue de la République"
            />
            {form.formState.errors.address?.street && (
              <p className="text-sm text-destructive">{form.formState.errors.address.street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                {...form.register('address.postalCode')}
                placeholder="75001"
                maxLength={5}
              />
              {form.formState.errors.address?.postalCode && (
                <p className="text-sm text-destructive">{form.formState.errors.address.postalCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                {...form.register('address.city')}
                placeholder="Paris"
              />
              {form.formState.errors.address?.city && (
                <p className="text-sm text-destructive">{form.formState.errors.address.city.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Équipements et services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ajouter un équipement (ex: Wifi, Parking, Climatisation)"
            />
            <Button type="button" onClick={addAmenity} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {amenityFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {amenityFields.map((field, index) => (
                <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                  {field.value}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4 h-4"
                    onClick={() => removeAmenity(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            images={form.watch('images')}
            onChange={(images) => form.setValue('images', images)}
            maxImages={5}
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/mes-salles')}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {room ? 'Mise à jour...' : 'Création...'}
            </>
          ) : (
            room ? 'Mettre à jour' : 'Créer la salle'
          )}
        </Button>
      </div>
    </form>
  );
}