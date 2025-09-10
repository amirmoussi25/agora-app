import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/database/sqlite';
import { validatePassword } from '@/lib/validators/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token et nouveau mot de passe requis' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Nouveau mot de passe invalide', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    const user = db.prepare(`
      SELECT id, reset_token_expires
      FROM users
      WHERE reset_token = ?
    `).get(token) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'Token de réinitialisation invalide' },
        { status: 400 }
      );
    }

    if (user.reset_token_expires < Date.now()) {
      return NextResponse.json(
        { error: 'Token de réinitialisation expiré' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    db.prepare(`
      UPDATE users
      SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hashedPassword, user.id);

    return NextResponse.json(
      { message: 'Mot de passe réinitialisé avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}