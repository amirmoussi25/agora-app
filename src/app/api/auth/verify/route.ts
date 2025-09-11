import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/sqlite';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token de vérification requis' },
        { status: 400 }
      );
    }

    const user = db.prepare(`
      SELECT id, email, is_verified
      FROM users
      WHERE verification_token = ?
    `).get(token) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'Token de vérification invalide' },
        { status: 400 }
      );
    }

    if (user.is_verified) {
      return NextResponse.json(
        { error: 'Compte déjà vérifié' },
        { status: 400 }
      );
    }

    db.prepare(`
      UPDATE users
      SET is_verified = TRUE, verification_token = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(user.id);

    return NextResponse.json(
      { message: 'Compte vérifié avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}