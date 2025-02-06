'use client';

import { useState, useEffect } from 'react';

export function useUser() {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      console.log('useUser - Initial localStorage data:', userStr);
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.log('useUser - Parsed user data:', userData);
          // S'assurer que l'ID est correctement formaté
          return {
            ...userData,
            _id: userData.id || userData._id, // Utiliser id ou _id
            id: userData.id || userData._id, // Garder les deux pour la compatibilité
          };
        } catch (e) {
          console.error('useUser - Error parsing user data:', e);
          return null;
        }
      }
    }
    return null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const userStr = localStorage.getItem('user');
      console.log('useUser - Storage change detected:', userStr);
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.log('useUser - New user data:', userData);
          setUser({
            ...userData,
            _id: userData.id || userData._id,
            id: userData.id || userData._id,
          });
        } catch (e) {
          console.error('useUser - Error parsing user data:', e);
        }
      } else {
        setUser(null);
      }
    };

    const handleAvatarUpdate = (event) => {
      console.log('useUser - Avatar update event:', event.detail);
      if (event.detail) {
        setUser(prev => {
          if (!prev) return event.detail;
          return {
            ...prev,
            ...event.detail,
            _id: event.detail.id || event.detail._id || prev._id,
            id: event.detail.id || event.detail._id || prev.id,
          };
        });
      }
    };

    const handleImageRefresh = (event) => {
      console.log('useUser - Image refresh event:', event.detail);
      if (event.detail && event.detail.type === 'avatar') {
        setUser(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            avatar: event.detail.path
          };
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    window.addEventListener('refreshUserImages', handleImageRefresh);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
      window.removeEventListener('refreshUserImages', handleImageRefresh);
    };
  }, []);

  return user;
}
