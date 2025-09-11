import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/utils/stripe';
import { requireUserType } from '@/lib/middleware/auth';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Room } from '@/lib/database/models/room';

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

    if (!roomId || !eventType || !startDate || !endDate || !startTime || !endTime || !expectedAttendees || !totalPrice) {
      return NextResponse.json(
        { error: 'Données de réservation incomplètes' },
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Réservation - ${room.name}`,
              description: `${eventType} du ${startDate} au ${endDate}`,
              images: room.images ? [room.images[0]] : undefined,
              metadata: {
                roomId: roomId,
                roomName: room.name,
                city: room.city
              }
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/rooms/${roomId}/book?cancelled=true`,
      metadata: {
        userId: user.userId.toString(),
        roomId: roomId,
        eventType: eventType,
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        endTime: endTime,
        expectedAttendees: expectedAttendees.toString(),
        eventDescription: eventDescription || '',
        totalPrice: totalPrice.toString()
      },
      customer_email: user.email || undefined,
      payment_intent_data: {
        metadata: {
          userId: user.userId.toString(),
          roomId: roomId,
          bookingType: 'room_reservation'
        }
      }
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la création de la session Stripe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}