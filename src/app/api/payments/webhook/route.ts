import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/utils/stripe';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Booking } from '@/lib/database/models/booking';
import { db } from '@/lib/database/sqlite';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature Stripe manquante' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Erreur de vérification du webhook:', err.message);
      return NextResponse.json(
        { error: 'Webhook invalide' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata.bookingId;
      const userId = parseInt(paymentIntent.metadata.userId);

      const booking = await Booking.findById(bookingId);
      
      if (booking && booking.userId === userId) {
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        await booking.save();

        db.prepare(`
          INSERT INTO payments (user_id, booking_id, stripe_payment_intent_id, amount, status)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          userId,
          bookingId,
          paymentIntent.id,
          paymentIntent.amount,
          'paid'
        );
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata.bookingId;
      const userId = parseInt(paymentIntent.metadata.userId);

      const booking = await Booking.findById(bookingId);
      
      if (booking && booking.userId === userId) {
        booking.paymentStatus = 'failed';
        await booking.save();

        db.prepare(`
          INSERT INTO payments (user_id, booking_id, stripe_payment_intent_id, amount, status)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          userId,
          bookingId,
          paymentIntent.id,
          paymentIntent.amount,
          'failed'
        );
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}