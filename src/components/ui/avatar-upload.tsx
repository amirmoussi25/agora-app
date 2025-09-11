"use client";

import React, { useState, useRef } from 'react';
import { Camera, User, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange?: (avatar: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  disabled?: boolean;
  showUploadButton?: boolean;
}

export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  size = 'md',
  className,
  disabled = false,
  showUploadButton = true
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('L\'image ne doit pas dépasser 5 MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Seuls les fichiers image sont autorisés');
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreview(result);
      onAvatarChange?.(result);
      setIsLoading(false);
    };

    reader.onerror = () => {
      alert('Erreur lors du chargement de l\'image');
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setPreview(null);
    onAvatarChange?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Avatar display */}
      <div className="relative">
        <div
          className={cn(
            sizeClasses[size],
            'relative rounded-full border-4 border-gray-200 bg-gray-100 overflow-hidden cursor-pointer hover:border-blue-300 transition-colors',
            disabled && 'cursor-not-allowed opacity-60',
            'group'
          )}
          onClick={triggerFileInput}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              {/* Overlay pour hover */}
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
              <User className={cn(iconSizes[size], 'text-blue-400')} />
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Remove button */}
          {preview && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveAvatar();
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Camera icon */}
        {!disabled && (
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg">
            <Camera className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Upload button */}
      {showUploadButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={disabled || isLoading}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {preview ? 'Changer la photo' : 'Ajouter une photo'}
        </Button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center max-w-xs">
        JPG, PNG ou GIF. Taille maximale : 5 MB
      </p>
    </div>
  );
}