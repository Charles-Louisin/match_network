'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [friendRequests, setFriendRequests] = useState(0);

  const checkFriendRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) return;

      const currentUser = JSON.parse(userStr);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      
      // Ne compter que les demandes reçues
      const receivedRequests = data.filter(request => 
        request.recipient === currentUser.id || 
        request.recipient._id === currentUser.id
      );

      setFriendRequests(receivedRequests.length);
      console.log('Nombre de demandes reçues:', receivedRequests.length);
    } catch (error) {
      console.error('Erreur lors de la vérification des demandes d\'amis:', error);
    }
  };

  // Vérifier les demandes toutes les 10 secondes
  useEffect(() => {
    checkFriendRequests();
    const interval = setInterval(checkFriendRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      friendRequests, 
      checkFriendRequests // Exposer la fonction pour forcer une vérification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé à l\'intérieur d\'un NotificationProvider');
  }
  return context;
}
