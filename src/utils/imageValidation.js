const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes

export const validateImage = (file) => {
  if (!file) {
    return { isValid: false, error: 'Aucun fichier sélectionné' };
  }

  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Le fichier doit être une image' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: `La taille de l'image ne doit pas dépasser ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  return { isValid: true };
};
