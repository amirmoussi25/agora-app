import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/sqlite';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    const userWithProfile = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.user_type,
        p.first_name,
        p.last_name,
        p.mairie_name,
        p.avatar
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(userId) as {
      id: number;
      email: string;
      user_type: 'client' | 'mairie';
      first_name?: string;
      last_name?: string;
      mairie_name?: string;
      avatar?: string;
    } | undefined;

    if (!userWithProfile) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Construire le nom d'affichage
    let displayName = '';
    if (userWithProfile.user_type === 'mairie') {
      displayName = userWithProfile.mairie_name || userWithProfile.email.split('@')[0];
    } else {
      if (userWithProfile.first_name && userWithProfile.last_name) {
        displayName = `${userWithProfile.first_name} ${userWithProfile.last_name}`;
      } else {
        displayName = userWithProfile.email.split('@')[0];
      }
    }

    return NextResponse.json({
      id: userWithProfile.id,
      email: userWithProfile.email,
      userType: userWithProfile.user_type,
      displayName,
      firstName: userWithProfile.first_name,
      lastName: userWithProfile.last_name,
      mairieName: userWithProfile.mairie_name,
      avatar: userWithProfile.avatar
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'utilisateur' }, 
      { status: 500 }
    );
  }
}