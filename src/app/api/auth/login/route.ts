import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/database/sqlite';
import { generateToken } from '@/lib/utils/jwt';
import { validateEmail } from '@/lib/validators/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Mot de passe requis' },
        { status: 400 }
      );
    }

    const user = db.prepare(`
      SELECT id, email, password_hash, user_type, is_verified
      FROM users
      WHERE email = ?
    `).get(email) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    if (!user.is_verified) {
      return NextResponse.json(
        { error: 'Compte non vérifié. Vérifiez votre email.' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.user_type
    });

    return NextResponse.json(
      {
        message: 'Connexion réussie',
        token,
        user: {
          id: user.id,
          email: user.email,
          userType: user.user_type
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}