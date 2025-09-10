"use client";

import React from 'react';
import { BottomBar } from '@/components/navigation/bottom-bar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        {children}
      </main>
      <BottomBar />
    </div>
  );
}