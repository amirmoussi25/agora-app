import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database/mongodb';
import { Room } from '@/lib/database/models/room';
import { requireUserType } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const city = url.searchParams.get('city') || '';
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const minCapacity = url.searchParams.get('minCapacity');

    const skip = (page - 1) * limit;

    const query: any = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    if (minCapacity) {
      query.capacity = { $gte: parseInt(minCapacity) };
    }

    const rooms = await Room.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Room.countDocuments(query);

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
    console.error('Erreur lors de la récupération des salles:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = requireUserType(request, ['mairie']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Accès réservé aux mairies' },
        { status: 403 }
      );
    }

    await connectMongoDB();

    const roomData = await request.json();

    const {
      name,
      description,
      capacity,
      price,
      images,
      amenities,
      address
    } = roomData;

    if (!name || !description || !capacity || !price || !address) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    const room = new Room({
      ownerId: user.userId,
      name,
      description,
      capacity,
      price,
      images: images || [],
      amenities: amenities || [],
      address
    });

    await room.save();

    return NextResponse.json(
      { message: 'Salle créée avec succès', room },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de la création de la salle:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}