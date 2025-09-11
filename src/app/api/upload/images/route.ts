import { NextRequest, NextResponse } from 'next/server';
import { requireUserType } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = requireUserType(request, ['mairie']);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Accès réservé aux mairies' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Utilisez JPG, PNG ou WEBP.' },
        { status: 400 }
      );
    }

    // Vérifier la taille (5MB max)
    const maxSize = parseInt(process.env.MAX_IMAGE_SIZE || '5242880');
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 5MB.' },
        { status: 400 }
      );
    }

    // Convertir en base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;
    
    // Générer un ID unique pour l'image
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Créer l'URL data
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      id: imageId,
      dataUrl: dataUrl,
      mimeType: mimeType,
      size: file.size,
      name: file.name
    });

  } catch (error) {
    console.error('Erreur upload image:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload de l\'image' },
      { status: 500 }
    );
  }
}