import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database/sqlite';
import { validatePassword } from '@/lib/validators/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      );
    }

    // Valider le mot de passe
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Mot de passe invalide', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token de réinitialisation invalide ou expiré' },
        { status: 400 }
      );
    }

    if (decoded.type !== 'password-reset') {
      return NextResponse.json(
        { error: 'Type de token invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur et le token existent dans la base
    const user = db.prepare(`
      SELECT id, email, reset_token, reset_token_expires
      FROM users 
      WHERE id = ? AND reset_token = ?
    `).get(decoded.userId, token);

    if (!user) {
      return NextResponse.json(
        { error: 'Token de réinitialisation invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le token n'est pas expiré
    const now = Math.floor(Date.now() / 1000); // timestamp Unix
    const expiresAt = user.reset_token_expires;
    
    if (now > expiresAt) {
      // Nettoyer le token expiré
      db.prepare(`
        UPDATE users 
        SET reset_token = NULL, reset_token_expires = NULL
        WHERE id = ?
      `).run(user.id);
      
      return NextResponse.json(
        { error: 'Token de réinitialisation expiré' },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Mettre à jour le mot de passe et nettoyer les tokens
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, 
          reset_token = NULL, 
          reset_token_expires = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hashedPassword, user.id);

    return NextResponse.json(
      { message: 'Mot de passe modifié avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}