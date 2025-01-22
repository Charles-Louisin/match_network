import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TimeAgo from '../utils/TimeAgo';
import styles from './NotificationCard.module.css';

const NotificationCard = ({ notification, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notification._id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationContent = () => {
    const baseUrl = '/';
    let link = baseUrl;
    let icon = null;

    switch (notification.type) {
      case 'POST_CREATED':
        link = `/posts/${notification.reference}`;
        icon = '📝';
        break;
      case 'PROFILE_PHOTO_UPDATED':
        link = `/profile/${notification.sender._id}`;
        icon = '📷';
        break;
      case 'COVER_PHOTO_UPDATED':
        link = `/profile/${notification.sender._id}`;
        icon = '🖼️';
        break;
      case 'POST_COMMENT':
        link = `/posts/${notification.reference}`;
        icon = '💬';
        break;
      case 'POST_LIKE':
        link = `/posts/${notification.reference}`;
        icon = '❤️';
        break;
      case 'FRIEND_REQUEST':
        link = `/profile/${notification.sender._id}`;
        icon = '👥';
        break;
      case 'FRIEND_ACCEPT':
        link = `/profile/${notification.sender._id}`;
        icon = '✅';
        break;
      default:
        link = baseUrl;
    }

    return { link, icon };
  };

  const { link, icon } = getNotificationContent();

  return (
    <Link href={link}>
      <div 
        className={`${styles.notificationCard} ${notification.read ? styles.read : ''}`}
        onClick={handleClick}
      >
        <div className={styles.iconContainer}>
          <span className={styles.icon}>{icon}</span>
        </div>
        <div className={styles.content}>
          <div className={styles.userInfo}>
            <div className={styles.avatarContainer}>
              <Image
                src={notification.sender.avatar || '/images/default-avatar.png'}
                alt={notification.sender.username}
                width={40}
                height={40}
                className={styles.avatar}
              />
            </div>
            <div className={styles.details}>
              <div className={styles.message}>
                <span className={styles.username}>{notification.sender.username}</span>
                {notification.content}
              </div>
              <TimeAgo date={notification.createdAt} className={styles.time} />
            </div>
          </div>
        </div>
        {!notification.read && <div className={styles.unreadDot} />}
      </div>
    </Link>
  );
};

export default NotificationCard;
