import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Booking } from '@/lib/database/models/booking';
import { Room } from '@/lib/database/models/room';
import { requireUserType } from '@/lib/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = requireUserType(request, ['client', 'mairie']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentification requise' },
        { status: 401 }
      );
    }

    await connectMongoDB();

    const booking = await Booking.findById(params.id).populate('roomId').lean();

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    if (user.userType === 'client' && booking.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    if (user.userType === 'mairie' && booking.roomId.ownerId !== user.userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json({ booking }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
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
    const { user, error } = requireUserType(request, ['client', 'mairie']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentification requise' },
        { status: 401 }
      );
    }

    await connectMongoDB();

    const booking = await Booking.findById(params.id).populate('roomId');

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    const updateData = await request.json();

    if (user.userType === 'client' && booking.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    if (user.userType === 'mairie' && booking.roomId.ownerId !== user.userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    if (user.userType === 'client') {
      if (booking.status !== 'pending') {
        return NextResponse.json(
          { error: 'Seules les réservations en attente peuvent être modifiées' },
          { status: 400 }
        );
      }
      const allowedFields = ['eventType', 'startDate', 'endDate', 'guestCount', 'specialRequests'];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});
      
      Object.assign(booking, filteredData);
    } else if (user.userType === 'mairie') {
      const allowedFields = ['status'];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});
      
      Object.assign(booking, filteredData);
    }

    await booking.save();

    return NextResponse.json(
      { message: 'Réservation mise à jour avec succès', booking },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réservation:', error);
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
    const { user, error } = requireUserType(request, ['client']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Accès réservé aux clients' },
        { status: 403 }
      );
    }

    await connectMongoDB();

    const booking = await Booking.findById(params.id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    if (booking.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'Seules les réservations en attente peuvent être annulées' },
        { status: 400 }
      );
    }

    booking.status = 'cancelled';
    await booking.save();

    return NextResponse.json(
      { message: 'Réservation annulée avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la réservation:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}