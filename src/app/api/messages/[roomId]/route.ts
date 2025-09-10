import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Message } from '@/lib/database/models/message';
import { Room } from '@/lib/database/models/room';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { user, error } = requireAuth(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentification requise' },
        { status: 401 }
      );
    }

    await connectMongoDB();

    // Vérifier que l'utilisateur a accès à cette salle
    const room = await Room.findById(params.roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Salle non trouvée' },
        { status: 404 }
      );
    }

    // Récupérer les messages (limitéés aux 50 derniers)
    const messages = await Message.find({ roomId: params.roomId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Inverser l'ordre pour affichage chronologique
    const sortedMessages = messages.reverse();

    return NextResponse.json({
      messages: sortedMessages,
      room: {
        _id: room._id,
        name: room.name,
        ownerId: room.ownerId
      }
    });

  } catch (error) {
    console.error('Erreur récupération messages:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Envoyer un message (fallback si WebSocket ne marche pas)
export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { user, error } = requireAuth(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message vide' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Message trop long (max 1000 caractères)' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Vérifier que la salle existe
    const room = await Room.findById(params.roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Salle non trouvée' },
        { status: 404 }
      );
    }

    // Créer le message
    const message = new Message({
      roomId: params.roomId,
      senderId: user.userId,
      senderName: user.email.split('@')[0],
      senderType: user.userType,
      content: content.trim(),
      type: 'text'
    });

    await message.save();

    return NextResponse.json({
      message: {
        _id: message._id,
        roomId: message.roomId,
        senderId: message.senderId,
        senderName: message.senderName,
        senderType: message.senderType,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur envoi message:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}