"use client";

interface OfflineMessage {
  _id: string;
  roomId: string;
  senderId: number;
  senderName: string;
  senderType: 'client' | 'mairie';
  content: string;
  type: 'text' | 'system';
  createdAt: string;
  isTemporary?: boolean;
  synced?: boolean;
}

class OfflineStorage {
  private static instance: OfflineStorage;
  
  public static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  // Sauvegarder un message hors ligne
  saveMessage(roomId: string, message: Omit<OfflineMessage, '_id' | 'isTemporary' | 'synced'>): OfflineMessage {
    const offlineMessage: OfflineMessage = {
      ...message,
      _id: `temp_${Date.now()}_${Math.random()}`,
      isTemporary: true,
      synced: false
    };

    const messages = this.getMessages(roomId);
    messages.push(offlineMessage);
    localStorage.setItem(`offline_messages_${roomId}`, JSON.stringify(messages));
    
    return offlineMessage;
  }

  // Récupérer les messages hors ligne d'une room
  getMessages(roomId: string): OfflineMessage[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(`offline_messages_${roomId}`);
    return stored ? JSON.parse(stored) : [];
  }

  // Marquer un message comme synchronisé
  markAsSynced(roomId: string, tempId: string, realId: string): void {
    const messages = this.getMessages(roomId);
    const messageIndex = messages.findIndex(m => m._id === tempId);
    
    if (messageIndex !== -1) {
      messages[messageIndex] = {
        ...messages[messageIndex],
        _id: realId,
        synced: true,
        isTemporary: false
      };
      localStorage.setItem(`offline_messages_${roomId}`, JSON.stringify(messages));
    }
  }

  // Récupérer les messages non synchronisés
  getUnsyncedMessages(roomId: string): OfflineMessage[] {
    return this.getMessages(roomId).filter(m => !m.synced && m.isTemporary);
  }

  // Supprimer un message temporaire
  removeMessage(roomId: string, messageId: string): void {
    const messages = this.getMessages(roomId).filter(m => m._id !== messageId);
    localStorage.setItem(`offline_messages_${roomId}`, JSON.stringify(messages));
  }

  // Nettoyer les messages synchronisés
  clearSyncedMessages(roomId: string): void {
    const messages = this.getMessages(roomId).filter(m => !m.synced);
    localStorage.setItem(`offline_messages_${roomId}`, JSON.stringify(messages));
  }

  // Vérifier si on a des messages en attente de synchronisation
  hasPendingMessages(): boolean {
    if (typeof window === 'undefined') return false;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_messages_')) {
        const messages: OfflineMessage[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (messages.some(m => !m.synced && m.isTemporary)) {
          return true;
        }
      }
    }
    return false;
  }

  // Obtenir toutes les rooms avec des messages en attente
  getRoomsWithPendingMessages(): string[] {
    if (typeof window === 'undefined') return [];
    
    const rooms: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_messages_')) {
        const roomId = key.replace('offline_messages_', '');
        const messages: OfflineMessage[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (messages.some(m => !m.synced && m.isTemporary)) {
          rooms.push(roomId);
        }
      }
    }
    return rooms;
  }
}

export const offlineStorage = OfflineStorage.getInstance();
export type { OfflineMessage };