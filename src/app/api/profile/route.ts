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

    const profile = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.user_type,
        u.created_at,
        p.first_name,
        p.last_name,
        p.birth_date,
        p.mairie_name,
        p.street_number,
        p.street_name,
        p.postal_code,
        p.city
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(user.userId) as any;

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      );
    }

    const formattedProfile = {
      id: profile.id,
      email: profile.email,
      userType: profile.user_type,
      createdAt: profile.created_at,
      ...(profile.user_type === 'client' ? {
        firstName: profile.first_name,
        lastName: profile.last_name,
        birthDate: profile.birth_date
      } : {
        mairieName: profile.mairie_name,
        address: {
          streetNumber: profile.street_number,
          streetName: profile.street_name,
          postalCode: profile.postal_code,
          city: profile.city
        }
      })
    };

    return NextResponse.json({ profile: formattedProfile }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const userData = db.prepare('SELECT user_type FROM users WHERE id = ?').get(user.userId) as any;
    
    if (!userData) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const updateData = await request.json();

    if (userData.user_type === 'client') {
      const { firstName, lastName, birthDate } = updateData;
      
      db.prepare(`
        UPDATE user_profiles
        SET first_name = ?, last_name = ?, birth_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(firstName, lastName, birthDate, user.userId);

    } else if (userData.user_type === 'mairie') {
      const { mairieName, address } = updateData;
      
      db.prepare(`
        UPDATE user_profiles
        SET mairie_name = ?, street_number = ?, street_name = ?, postal_code = ?, city = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        mairieName,
        address.streetNumber,
        address.streetName,
        address.postalCode,
        address.city,
        user.userId
      );
    }

    return NextResponse.json(
      { message: 'Profil mis à jour avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}