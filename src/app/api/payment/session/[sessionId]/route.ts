import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/utils/stripe';
import { requireUserType } from '@/lib/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { user, error } = requireUserType(request, ['client']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(params.sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      );
    }

    const bookingDetails = session.metadata ? {
      roomName: session.line_items?.data?.[0]?.description || 'Salle inconnue',
      eventType: session.metadata.eventType,
      startDate: session.metadata.startDate,
      endDate: session.metadata.endDate,
      startTime: session.metadata.startTime,
      endTime: session.metadata.endTime,
      expectedAttendees: parseInt(session.metadata.expectedAttendees),
      totalPrice: parseFloat(session.metadata.totalPrice)
    } : undefined;

    return NextResponse.json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      customerEmail: session.customer_details?.email,
      bookingDetails
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}