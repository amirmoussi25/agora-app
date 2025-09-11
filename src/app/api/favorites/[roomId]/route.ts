import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Favorite } from '@/lib/database/models/favorite';
import { requireUserType } from '@/lib/middleware/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { user, error } = requireUserType(request, ['client']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Accès réservé aux clients' },
        { status: 403 }
      );
    }

    await connectMongoDB();

    const favorite = await Favorite.findOneAndDelete({
      userId: user.userId,
      roomId: params.roomId
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favori non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Salle supprimée des favoris' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la suppression du favori:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { user, error } = requireUserType(request, ['client']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Accès réservé aux clients' },
        { status: 403 }
      );
    }

    await connectMongoDB();

    const favorite = await Favorite.findOne({
      userId: user.userId,
      roomId: params.roomId
    });

    return NextResponse.json(
      { isFavorite: !!favorite },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la vérification du favori:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}