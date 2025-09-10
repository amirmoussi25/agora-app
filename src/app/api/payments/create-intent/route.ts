import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/utils/stripe';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Booking } from '@/lib/database/models/booking';
import { requireUserType } from '@/lib/middleware/auth';

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

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID de réservation requis' },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId).populate('roomId');

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
        { error: 'Cette réservation ne peut pas être payée' },
        { status: 400 }
      );
    }

    if (booking.paymentStatus !== 'pending') {
      return NextResponse.json(
        { error: 'Paiement déjà traité' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100),
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingId: booking._id.toString(),
        userId: user.userId.toString(),
        roomName: booking.roomId.name
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la création du payment intent:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}