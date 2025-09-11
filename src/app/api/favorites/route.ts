import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Favorite } from '@/lib/database/models/favorite';
import { requireUserType } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireUserType(request, ['client']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Accès réservé aux clients' },
        { status: 403 }
      );
    }

    await connectMongoDB();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const favorites = await Favorite.find({ userId: user.userId })
      .populate('roomId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Favorite.countDocuments({ userId: user.userId });

    const rooms = favorites.map(fav => fav.roomId).filter(room => room && room.isActive);

    return NextResponse.json({
      favorites: rooms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = requireUserType(request, ['client']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Accès réservé aux clients' },
        { status: 403 }
      );
    }

    await connectMongoDB();

    const { roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json(
        { error: 'ID de la salle requis' },
        { status: 400 }
      );
    }

    const existingFavorite = await Favorite.findOne({
      userId: user.userId,
      roomId
    });

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Cette salle est déjà dans vos favoris' },
        { status: 409 }
      );
    }

    const favorite = new Favorite({
      userId: user.userId,
      roomId
    });

    await favorite.save();

    return NextResponse.json(
      { message: 'Salle ajoutée aux favoris' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}