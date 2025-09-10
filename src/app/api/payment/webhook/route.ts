import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/utils/stripe';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Booking } from '@/lib/database/models/booking';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature Stripe manquante' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Erreur signature webhook:', err.message);
      return NextResponse.json(
        { error: 'Signature webhook invalide' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        
        if (session.metadata.bookingType === 'room_reservation') {
          const booking = new Booking({
            userId: parseInt(session.metadata.userId),
            roomId: session.metadata.roomId,
            eventType: session.metadata.eventType,
            startDate: new Date(session.metadata.startDate + 'T' + session.metadata.startTime),
            endDate: new Date(session.metadata.endDate + 'T' + session.metadata.endTime),
            guestCount: parseInt(session.metadata.expectedAttendees),
            totalPrice: parseFloat(session.metadata.totalPrice),
            specialRequests: session.metadata.eventDescription,
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentIntentId: session.payment_intent
          });

          await booking.save();
          console.log('Réservation créée avec succès:', booking._id);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        
        if (paymentIntent.metadata.bookingType === 'room_reservation') {
          const booking = await Booking.findOne({
            paymentIntentId: paymentIntent.id
          });
          
          if (booking) {
            booking.paymentStatus = 'failed';
            await booking.save();
            console.log('Statut de paiement mis à jour: échoué');
          }
        }
        break;
      }

      default:
        console.log(`Type d'événement non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Erreur webhook Stripe:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}