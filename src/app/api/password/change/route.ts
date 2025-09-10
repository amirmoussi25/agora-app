import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/database/sqlite';
import { requireAuth } from '@/lib/middleware/auth';
import { validatePassword } from '@/lib/validators/auth';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Mot de passe actuel et nouveau mot de passe requis' },
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

    const userData = db.prepare(`
      SELECT password_hash
      FROM users
      WHERE id = ?
    `).get(user.userId) as any;

    if (!userData) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 401 }
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hashedNewPassword, user.userId);

    return NextResponse.json(
      { message: 'Mot de passe modifié avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}