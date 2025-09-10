"use client";

import React from 'react';
import { BottomBar } from '@/components/navigation/bottom-bar';

interface MainLayoutProps {
  children: React.ReactNode;
  showBottomBar?: boolean;
}

export function MainLayout({ children, showBottomBar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className={showBottomBar ? "pb-20" : ""}>
        {children}
      </main>
      {showBottomBar && <BottomBar />}
    </div>
  );
}