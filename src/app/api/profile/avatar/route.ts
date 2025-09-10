import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database/sqlite';

interface JWTPayload {
  userId: number;
  email: string;
  userType: 'client' | 'mairie';
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (error) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { avatar } = await request.json();

    if (!avatar && avatar !== '') {
      return NextResponse.json({ error: 'Avatar requis' }, { status: 400 });
    }

    // Validation de la taille de l'avatar (base64)
    if (avatar && avatar.length > 10 * 1024 * 1024) { // ~7.5MB en base64
      return NextResponse.json({ error: 'Image trop volumineuse' }, { status: 400 });
    }

    // Vérifier si le profil existe
    const existingProfile = db.prepare(`
      SELECT id FROM user_profiles WHERE user_id = ?
    `).get(decoded.userId) as { id: number } | undefined;

    if (existingProfile) {
      // Mettre à jour le profil existant
      db.prepare(`
        UPDATE user_profiles 
        SET avatar = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `).run(avatar, decoded.userId);
    } else {
      // Créer un nouveau profil
      db.prepare(`
        INSERT INTO user_profiles (user_id, avatar, created_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(decoded.userId, avatar);
    }

    return NextResponse.json({ 
      success: true, 
      message: avatar ? 'Avatar mis à jour' : 'Avatar supprimé' 
    });
  } catch (error) {
    console.error('Erreur mise à jour avatar:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'avatar' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (error) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const profile = db.prepare(`
      SELECT avatar FROM user_profiles WHERE user_id = ?
    `).get(decoded.userId) as { avatar: string | null } | undefined;

    return NextResponse.json({ 
      avatar: profile?.avatar || null 
    });
  } catch (error) {
    console.error('Erreur récupération avatar:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'avatar' }, 
      { status: 500 }
    );
  }
}