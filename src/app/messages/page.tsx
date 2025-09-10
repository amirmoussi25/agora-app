"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle, ArrowLeft, Calendar, Loader2, Search, X, Menu } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RoomChat } from '@/components/chat/room-chat';
import { useApi } from '@/lib/hooks/use-api';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  email: string;
  userType: 'client' | 'mairie';
}

interface Conversation {
  roomId: string;
  room: {
    _id: string;
    name: string;
    ownerId: number;
    image: string | null;
    isActive: boolean;
  };
  lastMessage: string;
  lastMessageDate: string;
  lastSender: {
    id: number;
    name: string;
    type: 'client' | 'mairie';
  };
  messageCount: number;
  unreadCount: number;
  isOwner: boolean;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get('room');
  
  const [user, setUser] = useState<User | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(roomIdParam || '');
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (roomIdParam) {
      setSelectedRoomId(roomIdParam);
      setShowMobileChat(true); // Afficher directement le chat sur mobile
    }
  }, [roomIdParam]);

  const { data, loading, error } = useApi<{
    conversations: Conversation[];
    total: number;
  }>(user ? '/api/conversations' : '');

  const conversations = data?.conversations || [];
  const selectedConversation = conversations.find(conv => conv.roomId === selectedRoomId);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'maintenant';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffHours < 168) return `${Math.floor(diffHours/24)}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handleSelectConversation = (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedRoomId('');
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Chargement...
        </div>
      </MainLayout>
    );
  }

  // Vue mobile : affiche soit la liste, soit le chat
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <MainLayout showBottomBar={false}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header fixe */}
        <div className="flex items-center gap-3 p-4 border-b bg-white flex-shrink-0 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <MessageCircle className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Messages</h1>
        </div>

        {/* Zone principale avec hauteur optimisée */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Liste des conversations */}
          <div className={cn(
            "w-full lg:w-96 flex flex-col border-r bg-white",
            showMobileChat && "hidden lg:flex"
          )}>
            {/* Header liste */}
            <div className="p-4 border-b bg-gray-50/80 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Discussions</h2>
                <Badge variant="outline" className="text-xs">
                  {conversations.length}
                </Badge>
              </div>
            </div>

            {/* Liste scrollable optimisée */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  <span className="text-sm text-gray-500">Chargement...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-700 mb-2">Aucune discussion</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    Vos conversations apparaîtront ici quand vous contactez des propriétaires.
                  </p>
                </div>
              ) : (
                <div>
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.roomId}
                      onClick={() => handleSelectConversation(conversation.roomId)}
                      className={cn(
                        "p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-all",
                        selectedRoomId === conversation.roomId && "bg-blue-50 border-blue-200"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Image de la salle */}
                        <div className="w-12 h-12 flex-shrink-0">
                          {conversation.room.image ? (
                            <img
                              src={conversation.room.image}
                              alt={conversation.room.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Détails */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-medium text-sm text-gray-900 truncate pr-2">
                              {conversation.room.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessageDate)}
                              </span>
                              {conversation.unreadCount > 0 && (
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white font-medium">
                                    {conversation.unreadCount}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              conversation.lastSender.type === 'mairie' 
                                ? "bg-blue-100 text-blue-700" 
                                : "bg-green-100 text-green-700"
                            )}>
                              {conversation.lastSender.type === 'mairie' ? 'Propriétaire' : 'Client'}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zone de discussion */}
          <div className={cn(
            "flex-1 flex flex-col bg-white",
            !showMobileChat && "hidden lg:flex"
          )}>
            {selectedRoomId && selectedConversation ? (
              <div className="flex flex-col h-full">
                {/* Header mobile avec bouton retour */}
                <div className="lg:hidden flex items-center gap-3 p-4 border-b bg-white flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="font-medium text-gray-900 truncate">{selectedConversation.room.name}</h2>
                </div>

                {/* Chat avec hauteur calculée */}
                <div className="flex-1 min-h-0">
                  <RoomChat
                    roomId={selectedRoomId}
                    currentUser={{
                      id: user.id,
                      email: user.email,
                      userType: user.userType
                    }}
                    roomName={selectedConversation.room.name}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Sélectionnez une discussion</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Choisissez une conversation pour voir les messages et répondre.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}