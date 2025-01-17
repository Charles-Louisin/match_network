'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import styles from './RemoveFriendButton.module.css';
import ConfirmModal from '../common/ConfirmModal';

const RemoveFriendButton = ({ friendId, onFriendRemoved }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const router = useRouter();

  const handleRemoveFriend = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/remove/${friendId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'ami');
      }

      // Actualiser la liste des amis
      if (onFriendRemoved) {
        onFriendRemoved();
      }

      // Utiliser le router pour une navigation plus propre
      router.refresh();
      toast.success('Ami supprimé avec succès');
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Erreur lors de la suppression de l\'ami');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirmModal(true)}
        className={styles.removeFriendButton}
        disabled={isLoading}
      >
        {isLoading ? 'Suppression...' : 'Supprimer cet ami'}
      </button>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleRemoveFriend}
        title="Supprimer cet ami"
        message="Êtes-vous sûr de vouloir supprimer cet ami ? Cela supprimera également toutes les demandes d'ami associées."
      />
    </>
  );
};

export default RemoveFriendButton;
