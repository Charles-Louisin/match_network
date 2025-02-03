'use client';
import { useState } from 'react';
import styles from './FriendActionButtons.module.css';
import RemoveFriendButton from './RemoveFriendButton';
import { useFriendship } from '@/hooks/useFriendship';

export default function FriendActionButtons({ userId, initialStatus, onStatusChange }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { 
    isLoading,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useFriendship();

  const handleSendRequest = async () => {
    if (isLoading) return;
    const success = await sendFriendRequest(userId);
    if (success) {
      onStatusChange('pending_sent');
    }
  };

  const handleCancelRequest = async () => {
    if (isLoading) return;
    const success = await cancelFriendRequest(userId);
    if (success) {
      onStatusChange('none');
    }
  };

  const handleAcceptRequest = async () => {
    if (isLoading) return;
    const success = await acceptFriendRequest(userId);
    if (success) {
      onStatusChange('friends');
    }
  };

  const handleRejectRequest = async () => {
    if (isLoading) return;
    const success = await rejectFriendRequest(userId);
    if (success) {
      onStatusChange('none');
    }
  };

  if (initialStatus === 'self') return null;

  return (
    <>
      <div className={styles.buttonContainer}>
        {initialStatus === 'friends' ? (
          <RemoveFriendButton friendId={userId} onFriendRemoved={() => onStatusChange('none')} />
        ) : initialStatus === 'pending_sent' ? (
          <button
            onClick={handleCancelRequest}
            className={`${styles.button} ${styles.cancelRequest}`}
            disabled={isLoading}
          >
            Annuler la demande
          </button>
        ) : initialStatus === 'pending_received' ? (
          <div className={styles.requestButtons}>
            <button
              onClick={handleAcceptRequest}
              className={`${styles.button} ${styles.accept}`}
              disabled={isLoading}
            >
              Accepter
            </button>
            <button
              onClick={handleRejectRequest}
              className={`${styles.button} ${styles.reject}`}
              disabled={isLoading}
            >
              Refuser
            </button>
          </div>
        ) : (
          <button
            onClick={handleSendRequest}
            className={`${styles.button} ${styles.addFriend}`}
            disabled={isLoading}
          >
            Ajouter
          </button>
        )}
      </div>
    </>
  );
}
