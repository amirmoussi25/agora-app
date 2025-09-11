import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database/sqlite';
import { validateEmail } from '@/lib/validators/auth';
import { sendPasswordResetEmail } from '@/lib/utils/email';

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
      SELECT id, email, is_verified 
      FROM users 
      WHERE email = ?
    `).get(email);

    // Toujours retourner le même message pour des raisons de sécurité
    // (éviter l'énumération d'emails)
    const successMessage = 'Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation dans quelques minutes.';

    if (!user) {
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      );
    }

    if (!user.is_verified) {
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      );
    }

    // Générer un token de réinitialisation
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'password-reset'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' } // Token expire dans 1 heure
    );

    // Sauvegarder le token dans la base de données
    db.prepare(`
      UPDATE users 
      SET reset_token = ?, reset_token_expires = strftime('%s', 'now', '+1 hour')
      WHERE id = ?
    `).run(resetToken, user.id);

    // Envoyer l'email de réinitialisation
    console.log('📧 Tentative d\'envoi d\'email à:', user.email);
    console.log('🔗 Token généré:', resetToken);
    
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      console.log('✅ Email envoyé avec succès');
    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError);
      throw emailError;
    }

    return NextResponse.json(
      { message: successMessage },
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