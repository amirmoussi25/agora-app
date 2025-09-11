"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { apiCall } from '@/lib/hooks/use-api';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 5,
  disabled = false
}: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Fichier sélectionné:', file.name, file.size);
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload avec fetch direct pour FormData
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur upload');
      }

      const result = await response.json();

      console.log('Image uploadée avec succès:', result.id);
      const newImages = [...images, result.dataUrl];
      onChange(newImages);
      
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setIsLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onRemove = (dataUrl: string) => {
    const newImages = images.filter(img => img !== dataUrl);
    onChange(newImages);
  };

  const canAddMore = images.length < maxImages && !disabled;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Photos de la salle</p>
        <p className="text-sm text-muted-foreground">
          {images.length}/{maxImages} photos
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((dataUrl, index) => (
            <Card key={`${dataUrl.substring(0, 50)}_${index}`} className="relative group overflow-hidden">
              <CardContent className="p-0 aspect-square">
                <img
                  src={dataUrl}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemove(dataUrl)}
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {canAddMore && (
        <Card className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          <CardContent className="p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || isLoading}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center space-y-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">Upload en cours...</p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Cliquez pour ajouter une photo</p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WEBP jusqu'à 5MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!canAddMore && !disabled && (
        <p className="text-xs text-muted-foreground text-center">
          Limite de {maxImages} photos atteinte
        </p>
      )}
    </div>
  );
}