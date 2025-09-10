import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Room } from '@/lib/database/models/room';
import { requireUserType } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireUserType(request, ['mairie']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Accès réservé aux mairies' },
        { status: 403 }
      );
    }

    await connectMongoDB();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const rooms = await Room.find({ ownerId: user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Room.countDocuments({ ownerId: user.userId });

    return NextResponse.json({
      rooms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération des salles du propriétaire:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}