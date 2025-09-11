"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  Heart, 
  Panda, 
  MessageCircle, 
  User, 
  Building, 
  Plus 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';

interface User {
  id: number;
  email: string;
  userType: 'client' | 'mairie';
}

export function BottomBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      loadUserAvatar();
    }
  }, []);

  const loadUserAvatar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/avatar', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserAvatar(data.avatar);
      }
    } catch (error) {
      console.error('Erreur chargement avatar:', error);
    }
  };

  if (!user) {
    return null;
  }

  const clientNavItems = [
    {
      href: '/explorer',
      label: 'Explorer',
      icon: Search,
    },
    {
      href: '/favoris',
      label: 'Favoris',
      icon: Heart,
    },
    {
      href: '/reservations',
      label: 'Réservations',
      icon: Panda,
      isCenter: true,
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: MessageCircle,
    },
    {
      href: '/profil',
      label: 'Profil',
      icon: User,
      isProfile: true,
    },
  ];

  const mairieNavItems = [
    {
      href: '/mes-salles',
      label: 'Mes salles',
      icon: Building,
    },
    {
      href: '/ajouter',
      label: 'Ajouter',
      icon: Plus,
    },
    {
      href: '/reservations',
      label: 'Réservations',
      icon: Panda,
      isCenter: true,
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: MessageCircle,
    },
    {
      href: '/profil',
      label: 'Profil',
      icon: User,
      isProfile: true,
    },
  ];

  const navItems = user.userType === 'client' ? clientNavItems : mairieNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-4 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors min-w-0",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                item.isCenter && "relative"
              )}
            >
              <div className={cn(
                "flex items-center justify-center",
                item.isCenter 
                  ? "w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg -mt-6" 
                  : "w-6 h-6"
              )}>
                {item.isProfile ? (
                  <UserAvatar
                    src={userAvatar}
                    fallbackText={user.email}
                    size="sm"
                  />
                ) : (
                  <Icon className={cn(
                    item.isCenter ? "w-6 h-6" : "w-5 h-5"
                  )} />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium truncate max-w-16",
                item.isCenter && "mt-1"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}