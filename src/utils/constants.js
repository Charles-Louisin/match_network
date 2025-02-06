// export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const getImageUrl = (path) => {
  // console.log('getImageUrl - Input path:', path);
  if (!path) return '/images/default-cover.jpg';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}


