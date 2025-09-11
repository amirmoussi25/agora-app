import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
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

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token de vérification invalide ou expiré' },
        { status: 400 }
      );
    }

    if (decoded.type !== 'verification') {
      return NextResponse.json(
        { error: 'Type de token invalide' },
        { status: 400 }
      );
    }

    const user = db.prepare(`
      SELECT id, email, is_verified, verification_token 
      FROM users 
      WHERE verification_token = ?
    `).get(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Token de vérification invalide' },
        { status: 400 }
      );
    }

    if (user.is_verified) {
      return NextResponse.json(
        { message: 'Email déjà vérifié' },
        { status: 200 }
      );
    }

    db.prepare(`
      UPDATE users 
      SET is_verified = 1, verification_token = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(user.id);

    return NextResponse.json(
      { message: 'Email vérifié avec succès ! Votre compte est maintenant actif.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la vérification d\'email:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}