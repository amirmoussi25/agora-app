import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Room } from '@/lib/database/models/room';
import { requireUserType } from '@/lib/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const room = await Room.findById(params.id).lean();

    if (!room) {
      return NextResponse.json(
        { error: 'Salle non trouvée' },
        { status: 404 }
      );
    }

    if (!room.isActive) {
      return NextResponse.json(
        { error: 'Salle non disponible' },
        { status: 404 }
      );
    }

    return NextResponse.json({ room }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération de la salle:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = requireUserType(request, ['mairie']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Accès réservé aux mairies' },
        { status: 403 }
      );
    }

    await connectMongoDB();

    const room = await Room.findById(params.id);

    if (!room) {
      return NextResponse.json(
        { error: 'Salle non trouvée' },
        { status: 404 }
      );
    }

    if (room.ownerId !== user.userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const updateData = await request.json();
    
    Object.assign(room, updateData);
    await room.save();

    return NextResponse.json(
      { message: 'Salle mise à jour avec succès', room },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la salle:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = requireUserType(request, ['mairie']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Accès réservé aux mairies' },
        { status: 403 }
      );
    }

    await connectMongoDB();

    const room = await Room.findById(params.id);

    if (!room) {
      return NextResponse.json(
        { error: 'Salle non trouvée' },
        { status: 404 }
      );
    }

    if (room.ownerId !== user.userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    room.isActive = false;
    await room.save();

    return NextResponse.json(
      { message: 'Salle supprimée avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la suppression de la salle:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}