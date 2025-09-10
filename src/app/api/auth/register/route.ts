import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/database/sqlite';
import { validateEmail, validatePassword, validateUserType } from '@/lib/validators/auth';
import { generateVerificationToken } from '@/lib/utils/jwt';
import { sendVerificationEmail } from '@/lib/utils/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password, userType, profile } = await request.json();

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Mot de passe invalide', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    if (!validateUserType(userType)) {
      return NextResponse.json(
        { error: 'Type d\'utilisateur invalide' },
        { status: 400 }
      );
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = generateVerificationToken();

    db.transaction(() => {
      const insertUser = db.prepare(`
        INSERT INTO users (email, password_hash, user_type, verification_token)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = insertUser.run(email, hashedPassword, userType, verificationToken);
      const userId = result.lastInsertRowid as number;

      if (userType === 'client') {
        const insertProfile = db.prepare(`
          INSERT INTO user_profiles (user_id, first_name, last_name, birth_date)
          VALUES (?, ?, ?, ?)
        `);
        insertProfile.run(
          userId,
          profile.firstName,
          profile.lastName,
          profile.birthDate
        );
      } else if (userType === 'mairie') {
        const insertProfile = db.prepare(`
          INSERT INTO user_profiles (user_id, mairie_name, street_number, street_name, postal_code, city)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        insertProfile.run(
          userId,
          profile.mairieName,
          profile.streetNumber,
          profile.streetName,
          profile.postalCode,
          profile.city
        );
      }
    })();

    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      { message: 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}