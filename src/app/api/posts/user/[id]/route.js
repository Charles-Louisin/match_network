import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const userId = params.id;
    if (!userId) {
      return NextResponse.json(
        { message: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Utiliser l'API backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/user/${userId}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Erreur lors de la récupération des posts' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur détaillée:', error);
    return NextResponse.json(
      { message: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
} 