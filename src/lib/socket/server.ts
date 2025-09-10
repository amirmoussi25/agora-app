import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next/api';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { connectMongoDB } from '../database/mongodb';
import { Message } from '../database/models/message';

export interface SocketServerResponse extends NextApiResponse {
  socket: {
    server: HTTPServer & {
      io?: SocketIOServer;
    };
  };
}

export interface AuthenticatedSocket {
  userId: number;
  email: string;
  userType: 'client' | 'mairie';
}

export function initializeSocket(res: SocketServerResponse) {
  if (!res.socket.server.io) {
    console.log('Initialisation du serveur Socket.IO...');

    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    // Middleware d'authentification
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Token manquant'));
        }

        const decoded = verifyToken(token);
        (socket as any).user = decoded;
        next();
      } catch (error) {
        next(new Error('Token invalide'));
      }
    });

    io.on('connection', (socket) => {
      const user = (socket as any).user as AuthenticatedSocket;
      console.log(`Utilisateur connecté: ${user.email} (${user.userType})`);

      // Rejoindre les rooms des salles
      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(`${user.email} a rejoint la room ${roomId}`);
      });

      // Quitter une room
      socket.on('leave_room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`${user.email} a quitté la room ${roomId}`);
      });

      // Envoyer un message
      socket.on('send_message', async (data: {
        roomId: string;
        content: string;
      }) => {
        try {
          await connectMongoDB();

          // Créer le message en base
          const message = new Message({
            roomId: data.roomId,
            senderId: user.userId,
            senderName: user.email.split('@')[0], // Nom simplifié
            senderType: user.userType,
            content: data.content.trim(),
            type: 'text'
          });

          await message.save();

          // Diffuser le message à tous les clients de la room
          io.to(data.roomId).emit('new_message', {
            _id: message._id,
            roomId: message.roomId,
            senderId: message.senderId,
            senderName: message.senderName,
            senderType: message.senderType,
            content: message.content,
            type: message.type,
            createdAt: message.createdAt
          });

          console.log(`Message envoyé dans room ${data.roomId} par ${user.email}`);
        } catch (error) {
          console.error('Erreur envoi message:', error);
          socket.emit('message_error', 'Erreur lors de l\'envoi du message');
        }
      });

      // Marquer les messages comme lus
      socket.on('mark_messages_read', async (data: {
        roomId: string;
        messageIds: string[];
      }) => {
        try {
          await connectMongoDB();
          
          await Message.updateMany(
            { 
              _id: { $in: data.messageIds },
              senderId: { $ne: user.userId }
            },
            { isRead: true }
          );

          socket.to(data.roomId).emit('messages_read', {
            messageIds: data.messageIds,
            readBy: user.userId
          });
        } catch (error) {
          console.error('Erreur marquage lecture:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Utilisateur déconnecté: ${user.email}`);
      });
    });

    res.socket.server.io = io;
  }
}