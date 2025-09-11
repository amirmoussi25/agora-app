import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Booking } from '@/lib/database/models/booking';
import { Room } from '@/lib/database/models/room';
import { requireUserType } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireUserType(request, ['client', 'mairie']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentification requise' },
        { status: 401 }
      );
    }

    await connectMongoDB();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = {};
    
    if (user.userType === 'client') {
      query.userId = user.userId;
    } else if (user.userType === 'mairie') {
      const ownerRooms = await Room.find({ ownerId: user.userId }).select('_id');
      const roomIds = ownerRooms.map(room => room._id);
      query.roomId = { $in: roomIds };
    }

    const bookings = await Booking.find(query)
      .populate('roomId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Booking.countDocuments(query);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = requireUserType(request, ['client']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Accès réservé aux clients' },
        { status: 403 }
      );
    }

    await connectMongoDB();

    const {
      roomId,
      eventType,
      startDate,
      endDate,
      startTime,
      endTime,
      expectedAttendees,
      eventDescription,
      totalPrice
    } = await request.json();

    if (!roomId || !eventType || !startDate || !endDate || !startTime || !endTime || !expectedAttendees) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    const room = await Room.findById(roomId);
    if (!room || !room.isActive) {
      return NextResponse.json(
        { error: 'Salle non trouvée ou non disponible' },
        { status: 404 }
      );
    }

    if (expectedAttendees > room.capacity) {
      return NextResponse.json(
        { error: 'Nombre d\'invités supérieur à la capacité de la salle' },
        { status: 400 }
      );
    }

    const start = new Date(startDate + 'T' + startTime);
    const end = new Date(endDate + 'T' + endTime);

    if (start >= end) {
      return NextResponse.json(
        { error: 'Date de fin doit être postérieure à la date de début' },
        { status: 400 }
      );
    }

    const conflictingBooking = await Booking.findOne({
      roomId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { startDate: { $lt: end }, endDate: { $gt: start } }
      ]
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'La salle n\'est pas disponible pour ces dates' },
        { status: 409 }
      );
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const calculatedPrice = days * room.price;

    const booking = new Booking({
      userId: user.userId,
      roomId,
      eventType,
      startDate: start,
      endDate: end,
      guestCount: expectedAttendees,
      totalPrice: totalPrice || calculatedPrice,
      specialRequests: eventDescription
    });

    await booking.save();

    return NextResponse.json(
      { 
        message: 'Réservation créée avec succès',
        booking,
        totalPrice: totalPrice || calculatedPrice
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}