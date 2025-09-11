import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/sqlite';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const payments = db.prepare(`
      SELECT 
        id,
        booking_id,
        stripe_payment_intent_id,
        amount,
        currency,
        status,
        created_at
      FROM payments
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(user.userId, limit, offset);

    const totalCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM payments
      WHERE user_id = ?
    `).get(user.userId) as any;

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des paiements:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}