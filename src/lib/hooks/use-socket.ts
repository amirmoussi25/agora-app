"use client";

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  roomId: string;
  senderId: number;
  senderName: string;
  senderType: 'client' | 'mairie';
  content: string;
  type: 'text' | 'system';
  createdAt: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isOnline: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, content: string) => Promise<void>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  typingUsers: { [roomId: string]: { userId: number; name: string; timestamp: number }[] };
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [roomId: string]: { userId: number; name: string; timestamp: number }[] }>({});
  const [typingTimeouts, setTypingTimeouts] = useState<{ [roomId: string]: NodeJS.Timeout }>({});

  // Gestion du statut en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Import du système de stockage hors ligne
  const saveMessageToCache = useCallback(async (roomId: string, message: Omit<Message, '_id'>) => {
    const { offlineStorage } = await import('@/lib/storage/offline-storage');
    return offlineStorage.saveMessage(roomId, message);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Pas de token, pas de connexion WebSocket');
      return;
    }

    console.log('Connexion à Socket.IO...', { 
      url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      token: token ? `présent (${token.substring(0, 20)}...)` : 'absent'
    });

    // Tester le token avant la connexion
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Payload du token:', payload);
    } catch (e) {
      console.error('Token invalide côté client:', e);
      return;
    }
    
    const socketInstance = io(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000', {
      path: '/api/socketio',
      auth: { token },
      transports: ['polling', 'websocket'],
      autoConnect: true,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connecté à Socket.IO avec ID:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Déconnecté de Socket.IO:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Erreur connexion Socket.IO:', error.message);
      setIsConnected(false);
    });

    socketInstance.on('new_message', async (message: Message & { tempId?: string }) => {
      console.log('🔄 Nouveau message reçu:', message);
      
      // Si c'est un message de synchronisation avec tempId, nettoyer le cache
      if (message.tempId) {
        try {
          const { offlineStorage } = await import('@/lib/storage/offline-storage');
          offlineStorage.markAsSynced(message.roomId, message.tempId, message._id);
        } catch (error) {
          console.error('Erreur marquage message synchronisé:', error);
        }
      }
      
      setMessages(prev => {
        // Si c'est un message de sync, remplacer le message temporaire
        if (message.tempId) {
          const filtered = prev.filter(m => m._id !== message.tempId);
          return [...filtered, message];
        }
        
        // Éviter les doublons pour les nouveaux messages
        const exists = prev.find(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    socketInstance.on('message_error', (error: string) => {
      console.error('Erreur message:', error);
    });

    socketInstance.on('messages_read', (data: { messageIds: string[]; readBy: number }) => {
      console.log('Messages marqués comme lus:', data);
      // Mettre à jour le statut des messages
    });

    // Gestion de l'indicateur "en train d'écrire"
    socketInstance.on('user_typing', (data: { roomId: string; userId: number; name: string }) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.roomId]: [
          ...(prev[data.roomId] || []).filter(user => user.userId !== data.userId),
          { userId: data.userId, name: data.name, timestamp: Date.now() }
        ]
      }));
    });

    socketInstance.on('user_stop_typing', (data: { roomId: string; userId: number }) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.roomId]: (prev[data.roomId] || []).filter(user => user.userId !== data.userId)
      }));
    });

    setSocket(socketInstance);

    return () => {
      console.log('Fermeture Socket.IO');
      socketInstance.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (socket && isConnected) {
      console.log('🚪 Rejoindre room:', roomId);
      socket.emit('join_room', roomId);
    } else {
      console.log('❌ Impossible de rejoindre room - Socket:', !!socket, 'Connecté:', isConnected);
    }
  }, [socket, isConnected]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socket && isConnected) {
      console.log('Quitter room:', roomId);
      socket.emit('leave_room', roomId);
    }
  }, [socket, isConnected]);

  const sendMessage = useCallback(async (roomId: string, content: string) => {
    if (content.trim()) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (socket && isConnected && isOnline) {
        console.log('📤 Envoi message en ligne:', content);
        console.log('📤 Socket connecté:', socket.connected, 'ID:', socket.id);
        socket.emit('send_message', { roomId, content: content.trim() });
      } else {
        console.log('📦 Envoi message hors ligne:', content);
        // Sauvegarder le message hors ligne
        const offlineMessage = await saveMessageToCache(roomId, {
          roomId,
          senderId: user.id,
          senderName: user.email.split('@')[0],
          senderType: user.userType,
          content: content.trim(),
          type: 'text',
          createdAt: new Date().toISOString()
        });
        
        // Ajouter immédiatement à la liste des messages
        setMessages(prev => [...prev, offlineMessage as Message]);
      }
    }
  }, [socket, isConnected, isOnline, saveMessageToCache]);

  const startTyping = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit('start_typing', { roomId });
    }
  }, [socket, isConnected]);

  const stopTyping = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit('stop_typing', { roomId });
    }
  }, [socket, isConnected]);

  // Nettoyer les utilisateurs en train d'écrire (timeout après 3 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(roomId => {
          updated[roomId] = updated[roomId].filter(user => now - user.timestamp < 3000);
          if (updated[roomId].length === 0) {
            delete updated[roomId];
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Synchroniser les messages hors ligne quand on revient en ligne
  useEffect(() => {
    if (isConnected && isOnline && socket) {
      const syncOfflineMessages = async () => {
        try {
          const { offlineStorage } = await import('@/lib/storage/offline-storage');
          const roomsWithPending = offlineStorage.getRoomsWithPendingMessages();
          
          for (const roomId of roomsWithPending) {
            const pendingMessages = offlineStorage.getUnsyncedMessages(roomId);
            
            for (const message of pendingMessages) {
              console.log('Synchronisation message hors ligne:', message.content);
              socket.emit('send_message', { 
                roomId: message.roomId, 
                content: message.content,
                tempId: message._id
              });
            }
          }
          
          if (roomsWithPending.length > 0) {
            console.log(`Synchronisation de ${roomsWithPending.length} conversations hors ligne`);
          }
        } catch (error) {
          console.error('Erreur synchronisation messages hors ligne:', error);
        }
      };

      syncOfflineMessages();
    }
  }, [isConnected, isOnline, socket]);

  return {
    socket,
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
  };
}