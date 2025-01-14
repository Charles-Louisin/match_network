'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import styles from './RemoveFriendButton.module.css';

const RemoveFriendButton = ({ friendId, onFriendRemoved }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRemoveFriend = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet ami ? Cela supprimera également toutes les demandes d&apos;ami associées.')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      // Supprimer l'ami et toutes les demandes associées
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.text();
      
      if (!response.ok) {
        throw new Error(data || 'Erreur lors de la suppression');
      }

      // Essayer de parser la réponse comme JSON
      try {
        const jsonData = JSON.parse(data);
        toast.success(jsonData.message || 'Ami et demandes associées supprimés');
      } catch {
        toast.success('Ami et demandes associées supprimés');
      }

      // Actualiser la liste des amis
      if (onFriendRemoved) {
        onFriendRemoved();
      }

      // Utiliser le router pour une navigation plus propre
      router.refresh();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRemoveFriend}
      disabled={isLoading}
      className={styles.removeFriendButton}
    >
      {isLoading ? 'Suppression...' : 'Supprimer cet ami'}
    </button>
  );
};

export default RemoveFriendButton;
