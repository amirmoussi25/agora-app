import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Message } from '@/lib/database/models/message';
import { Room } from '@/lib/database/models/room';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentification requise' },
        { status: 401 }
      );
    }

    await connectMongoDB();

    // Récupérer les conversations où l'utilisateur a participé
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: user.userId },
            // Pour les propriétaires : messages dans leurs salles
            ...(user.userType === 'mairie' ? [{}] : [])
          ]
        }
      },
      {
        $group: {
          _id: '$roomId',
          lastMessage: { $last: '$content' },
          lastMessageDate: { $last: '$createdAt' },
          lastSenderId: { $last: '$senderId' },
          lastSenderName: { $last: '$senderName' },
          lastSenderType: { $last: '$senderType' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$isRead', false] },
                    { $ne: ['$senderId', user.userId] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageDate: -1 }
      },
      {
        $limit: 50
      }
    ]);

    // Enrichir avec les informations des salles
    const roomIds = conversations.map(conv => conv._id);
    const rooms = await Room.find(
      { _id: { $in: roomIds } },
      { _id: 1, name: 1, ownerId: 1, images: 1, isActive: 1 }
    ).lean();

    const roomsMap = new Map(rooms.map(room => [room._id.toString(), room]));

    const enrichedConversations = conversations
      .map(conv => {
        const room = roomsMap.get(conv._id);
        if (!room) return null;

        // Filtrer selon le type d'utilisateur
        if (user.userType === 'mairie' && room.ownerId !== user.userId) {
          return null; // Les propriétaires ne voient que leurs salles
        }

        return {
          roomId: conv._id,
          room: {
            _id: room._id,
            name: room.name,
            ownerId: room.ownerId,
            image: room.images?.[0] || null,
            isActive: room.isActive
          },
          lastMessage: conv.lastMessage,
          lastMessageDate: conv.lastMessageDate,
          lastSender: {
            id: conv.lastSenderId,
            name: conv.lastSenderName,
            type: conv.lastSenderType
          },
          messageCount: conv.messageCount,
          unreadCount: conv.unreadCount,
          isOwner: room.ownerId === user.userId
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      conversations: enrichedConversations,
      total: enrichedConversations.length
    });

  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}