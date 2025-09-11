import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/sqlite';
import { validateEmail } from '@/lib/validators/auth';
import { generateResetToken } from '@/lib/utils/jwt';
import { sendResetPasswordEmail } from '@/lib/utils/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    const user = db.prepare(`
      SELECT id, email
      FROM users
      WHERE email = ? AND is_verified = TRUE
    `).get(email) as any;

    if (!user) {
      return NextResponse.json(
        { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' },
        { status: 200 }
      );
    }

    const resetToken = generateResetToken();
    const resetTokenExpires = Date.now() + 3600000;

    db.prepare(`
      UPDATE users
      SET reset_token = ?, reset_token_expires = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(resetToken, resetTokenExpires, user.id);

    await sendResetPasswordEmail(email, resetToken);

    return NextResponse.json(
      { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}