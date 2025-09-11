"use client";

import React from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  fallbackText?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
}

export function UserAvatar({
  src,
  alt = 'Avatar',
  size = 'md',
  className,
  fallbackText,
  status,
  showStatus = false
}: UserAvatarProps) {
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    '2xl': 'h-20 w-20'
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-10 w-10'
  };

  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  const getInitials = () => {
    if (fallbackText) {
      return fallbackText
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return '';
  };

  const statusSize = {
    xs: 'h-2 w-2',
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
    '2xl': 'h-5 w-5'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl'
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar className={cn(sizeClasses[size])}>
        {src && <AvatarImage src={src} alt={alt} />}
        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200">
          {fallbackText ? (
            <span className={cn('font-medium text-blue-600 select-none', textSizes[size])}>
              {getInitials()}
            </span>
          ) : (
            <User className={cn(iconSizes[size], 'text-blue-400')} />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Status indicator */}
      {showStatus && status && (
        <div
          className={cn(
            statusSize[size],
            statusClasses[status],
            'absolute bottom-0 right-0 rounded-full border-2 border-white'
          )}
        />
      )}
    </div>
  );
}