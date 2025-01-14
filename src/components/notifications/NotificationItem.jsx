import { useFriends } from '@/hooks/useFriends';
import { useState } from 'react';
import styles from './NotificationItem.module.css';

const NotificationItem = ({ notification }) => {
  const { acceptFriendRequest, rejectFriendRequest } = useFriends();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await acceptFriendRequest(notification.reference, notification.sender.username);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await rejectFriendRequest(notification.reference);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (notification.type === 'FRIEND_REQUEST') {
    return (
      <div className={styles.notificationItem}>
        <div className={styles.content}>
          <img 
            src={notification.sender.avatar || '/default-avatar.png'} 
            alt={notification.sender.username}
            className={styles.avatar}
          />
          <span className={styles.message}>
            <strong>{notification.sender.username}</strong> {notification.content}
          </span>
        </div>
        <div className={styles.actions}>
          <button 
            onClick={handleAccept}
            disabled={isProcessing}
            className={`${styles.button} ${styles.accept}`}
          >
            {isProcessing ? 'En cours...' : 'Accepter'}
          </button>
          <button 
            onClick={handleReject}
            disabled={isProcessing}
            className={`${styles.button} ${styles.reject}`}
          >
            {isProcessing ? 'En cours...' : 'Refuser'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.notificationItem}>
      <div className={styles.content}>
        <img 
          src={notification.sender.avatar || '/default-avatar.png'} 
          alt={notification.sender.username}
          className={styles.avatar}
        />
        <span className={styles.message}>
          <strong>{notification.sender.username}</strong> {notification.content}
        </span>
      </div>
    </div>
  );
};

export default NotificationItem;
