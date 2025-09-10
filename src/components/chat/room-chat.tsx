"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/lib/hooks/use-socket';
import { apiCall } from '@/lib/hooks/use-api';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';

interface Message {
  _id: string;
  roomId: string;
  senderId: number;
  senderName: string;
  senderType: 'client' | 'mairie';
  content: string;
  type: 'text' | 'system';
  createdAt: string;
  senderAvatar?: string;
}

interface RoomChatProps {
  roomId: string;
  currentUser: {
    id: number;
    email: string;
    userType: 'client' | 'mairie';
  };
  roomName: string;
}

export function RoomChat({ roomId, currentUser, roomName }: RoomChatProps) {
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [userAvatars, setUserAvatars] = useState<{ [userId: number]: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConnected, 
    isOnline, 
    joinRoom, 
    leaveRoom, 
    sendMessage, 
    messages, 
    setMessages, 
    typingUsers, 
    startTyping, 
    stopTyping 
  } = useSocket();

  // Charger les avatars des utilisateurs
  const loadUserAvatar = async (userId: number) => {
    if (userAvatars[userId] !== undefined) return; // Déjà chargé ou en cours
    
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUserAvatars(prev => ({
          ...prev,
          [userId]: userData.avatar || null
        }));
      }
    } catch (error) {
      console.error('Erreur chargement avatar:', error);
      setUserAvatars(prev => ({ ...prev, [userId]: null }));
    }
  };

  // Charger l'historique des messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const response = await apiCall<{
          messages: Message[];
          room: { _id: string; name: string; ownerId: number };
        }>(`/api/messages/${roomId}`);
        
        setMessages(response.messages || []);
        
        // Charger les avatars des utilisateurs uniques
        const uniqueUserIds = [...new Set(response.messages?.map(m => m.senderId) || [])];
        uniqueUserIds.forEach(userId => {
          if (userId !== currentUser.id) {
            loadUserAvatar(userId);
          }
        });
      } catch (error) {
        console.error('Erreur chargement messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [roomId, setMessages, currentUser.id]);

  // Rejoindre la room
  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom(roomId);
      return () => leaveRoom(roomId);
    }
  }, [isConnected, roomId, joinRoom, leaveRoom]);

  // Scroll automatique vers le bas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || isSending) return;

    const content = messageText.trim();
    setMessageText('');
    setIsSending(true);
    
    // Arrêter l'indicateur de frappe
    stopTyping(roomId);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    try {
      await sendMessage(roomId, content);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      // Remettre le texte en cas d'erreur
      setMessageText(content);
    } finally {
      setIsSending(false);
    }
  };

  // Gestion de l'indicateur "en train d'écrire"
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageText(value);

    if (value.trim() && isConnected) {
      startTyping(roomId);
      
      // Arrêter la frappe après 1 seconde d'inactivité
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      const timeout = setTimeout(() => {
        stopTyping(roomId);
      }, 1000);
      
      setTypingTimeout(timeout);
    } else if (isConnected) {
      stopTyping(roomId);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  // Grouper les messages par date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const dateKey = new Date(message.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border overflow-hidden">
      {/* Header compact */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-sm">{roomName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={cn(
                "w-2 h-2 rounded-full",
                !isOnline ? "bg-orange-500" : isConnected ? "bg-green-500" : "bg-gray-400"
              )} />
              <span className="text-xs text-gray-500">
                {!isOnline ? 'Mode hors ligne' : isConnected ? 'Connecté' : 'Connexion...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone des messages avec scroll optimisé */}
      <div className="flex-1 flex flex-col min-h-0">
        <div 
          className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          style={{ 
            height: 'calc(100vh - 240px)',
            scrollBehavior: 'smooth'
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Chargement...</span>
            </div>
          ) : Object.keys(messageGroups).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-600 mb-1">Commencez la conversation</h4>
              <p className="text-sm text-gray-500 max-w-xs">
                Envoyez votre premier message pour démarrer la discussion.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(messageGroups).map(([dateKey, dayMessages]) => (
                <div key={dateKey}>
                  {/* Séparateur de date */}
                  <div className="flex justify-center mb-4">
                    <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                      {formatDate(dayMessages[0].createdAt)}
                    </span>
                  </div>

                  {/* Messages du jour avec espacement optimisé */}
                  <div className="space-y-2">
                    {dayMessages.map((message, index) => {
                      const isCurrentUser = message.senderId === currentUser.id;
                      const showAvatar = !isCurrentUser && (index === 0 || dayMessages[index - 1]?.senderId !== message.senderId);
                      
                      return (
                        <div
                          key={message._id}
                          className={cn(
                            "flex gap-2 group",
                            isCurrentUser ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                          {/* Avatar pour les autres utilisateurs */}
                          <div className={cn(
                            "w-8 h-8 flex-shrink-0",
                            !showAvatar && "invisible"
                          )}>
                            {!isCurrentUser && showAvatar && (
                              <UserAvatar
                                src={userAvatars[message.senderId]}
                                fallbackText={message.senderName}
                                size="sm"
                              />
                            )}
                          </div>

                          <div className={cn(
                            "flex flex-col max-w-[85%] sm:max-w-[75%]",
                            isCurrentUser ? "items-end" : "items-start"
                          )}>
                            {/* Info expéditeur */}
                            {showAvatar && !isCurrentUser && (
                              <div className="flex items-center gap-2 mb-1 px-1">
                                <span className="text-xs font-medium text-gray-700">
                                  {message.senderName}
                                </span>
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full text-white",
                                  message.senderType === 'mairie' 
                                    ? "bg-blue-500" 
                                    : "bg-green-500"
                                )}>
                                  {message.senderType === 'mairie' ? 'Propriétaire' : 'Client'}
                                </span>
                              </div>
                            )}
                            
                            {/* Bulle de message optimisée */}
                            <div
                              className={cn(
                                "px-3 py-2 rounded-xl break-words shadow-sm relative max-w-full",
                                isCurrentUser
                                  ? "bg-blue-500 text-white rounded-br-sm"
                                  : "bg-gray-100 text-gray-900 rounded-bl-sm",
                                "hover:shadow-md transition-shadow"
                              )}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.content}
                              </p>
                              <div className={cn(
                                "text-xs mt-1 opacity-70",
                                isCurrentUser ? "text-right" : "text-left"
                              )}>
                                {formatTime(message.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Indicateur "en train d'écrire" */}
          {typingUsers[roomId] && typingUsers[roomId].length > 0 && (
            <div className="px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-xs text-gray-500">
                  {typingUsers[roomId].map(user => user.name).join(', ')} en train d'écrire...
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Formulaire d'envoi sticky */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder="Tapez votre message..."
                  maxLength={1000}
                  disabled={isSending}
                  className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!messageText.trim() || isSending}
                className="px-6"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{messageText.length}/1000</span>
              {!isOnline ? (
                <span className="text-orange-500 font-medium">
                  Mode hors ligne - Messages sauvegardés
                </span>
              ) : !isConnected ? (
                <span className="text-red-500 font-medium">
                  Connexion en cours...
                </span>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}