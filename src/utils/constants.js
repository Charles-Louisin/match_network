// export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const getImageUrl = (path) => {
  console.log('getImageUrl - Input path:', path);
  
  // Si pas de chemin, retourner l'image par défaut
  if (!path) {
    console.log('getImageUrl - Pas de chemin, retour image par défaut');
    return '/images/default-avatar.jpg';
  }

  // Si le chemin est déjà une URL complète, la retourner
  if (path.startsWith('http')) {
    console.log('getImageUrl - URL complète détectée:', path);
    return path;
  }

  // Si le chemin commence par /uploads/, vérifier s'il contient déjà l'URL de l'API
  if (path.startsWith('/uploads/')) {
    // Vérifier si le chemin contient déjà l'URL de l'API
    if (path.includes(process.env.NEXT_PUBLIC_API_URL)) {
      console.log('getImageUrl - Chemin déjà complet:', path);
      return path;
    }
    
    // Construire l'URL complète
    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${path}`;
    console.log('getImageUrl - URL finale:', fullUrl);
    return fullUrl;
  }

  // Pour les chemins locaux (comme /images/default-avatar.jpg)
  console.log('getImageUrl - Chemin local détecté:', path);
  return path;
}


/*if (!path) return '/images/default-cover.jpg';
if (path.startsWith('http')) return path;
return `${process.env.NEXT_PUBLIC_API_URL}${path}`;*/