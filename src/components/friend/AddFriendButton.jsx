'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import styles from './FriendButton.module.css';

const AddFriendButton = ({ targetUserId, onRequestSent }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState('none'); // 'none', 'pending', 'friends'
  const router = useRouter();

  // Vérifier le statut initial de la demande
  useEffect(() => {
    checkRequestStatus();
  }, [targetUserId]);

  const checkRequestStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/status/${targetUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setRequestStatus(data.status);
    } catch (error) {
      console.error('Error checking request status:', error);
    }
  };

  const handleAddFriend = async () => {
    if (requestStatus === 'pending') {
      toast.info('Une invitation a déjà été envoyée');
      return;
    }

    if (requestStatus === 'friends') {
      toast.info('Vous êtes déjà amis');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/request/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.message.includes('déjà envoyé')) {
        setRequestStatus('pending');
      } else if (data.message.includes('déjà amis')) {
        setRequestStatus('friends');
      } else {
        setRequestStatus('pending');
        if (onRequestSent) {
          onRequestSent();
        }
      }

      toast.success('Demande d&apos;ami envoyée avec succès!');
      router.refresh();
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw new Error(data.message || 'Erreur lors de l&apos;envoi de la demande');
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Envoi...';
    switch (requestStatus) {
      case 'pending':
        return 'Invitation envoyée';
      case 'friends':
        return 'Déjà amis';
      default:
        return 'Ajouter en ami';
    }
  };

  return (
    <button
      onClick={handleAddFriend}
      disabled={isLoading || requestStatus !== 'none'}
      className={`${styles.addButton} ${requestStatus !== 'none' ? styles.disabled : ''}`}
    >
      {getButtonText()}
    </button>
  );
};

export default AddFriendButton;
