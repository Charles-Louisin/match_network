/**
 * Get the full URL for an image path
 * @param {string} path - The image path
 * @returns {string} The full URL to the image
 */
export const getImageUrl = (path) => {
  if (!path) return '/images/default-avatar.jpg';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/images/')) return path;
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return `${apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
