export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const getImageUrl = (path) => {
  if (!path) return '/images/default-avatar.jpg';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
