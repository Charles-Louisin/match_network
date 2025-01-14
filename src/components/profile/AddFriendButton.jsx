'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import styles from './AddFriendButton.module.css';

const AddFriendButton = ({ userId, isFriend }) => {
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddFriend = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'envoi de la demande');
      }

      setRequestSent(true);
      toast.success('Demande d\'ami envoyée avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (isFriend) {
    return (
      <div className={styles.buttonContainer}>
        <button className={`${styles.button} ${styles.friendButton}`} disabled>
          <span className={styles.icon}>👥</span>
          Déjà ami
        </button>
      </div>
    );
  }

  if (requestSent) {
    return (
      <div className={styles.buttonContainer}>
        <button className={`${styles.button} ${styles.sentButton}`} disabled>
          <span className={styles.icon}>✓</span>
          Demande envoyée
        </button>
      </div>
    );
  }

  return (
    <div className={styles.buttonContainer}>
      <button 
        className={`${styles.button} ${styles.addButton}`}
        onClick={handleAddFriend}
        disabled={loading}
      >
        <span className={styles.icon}>{loading ? '⌛' : '+'}</span>
        {loading ? 'Envoi...' : 'Ajouter en ami'}
      </button>
    </div>
  );
};

export default AddFriendButton;
