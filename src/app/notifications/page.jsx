'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import styles from './notifications.module.css';
import TimeAgo from 'react-timeago';
import frenchStrings from 'react-timeago/lib/language-strings/fr';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';
import Image from 'next/image';

const formatter = buildFormatter(frenchStrings);

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setIsLoading(false);
    }
  };

  const getNotificationLink = (notification) => {
    const baseProfileUrl = `/profile/${notification.sender._id}`;
    let searchParams = new URLSearchParams();
    
    if (['POST_LIKE', 'POST_COMMENT', 'COMMENT_LIKE', 'COMMENT_MENTION', 'POST_TAG'].includes(notification.type)) {
      searchParams.set('postId', notification.postId?._id);
      return `${baseProfileUrl}?${searchParams.toString()}`;
    } else if (notification.type === 'POST_CREATED') {
      searchParams.set('postId', notification.reference?._id);
      return `${baseProfileUrl}?${searchParams.toString()}`;
    }
    
    return baseProfileUrl;
  };

  const handleNotificationClick = async (notification) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notification._id}/read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n._id === notification._id ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationText = (notification) => {
    const truncateText = (text) => {
      if (!text) return '';
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    };

    switch (notification.type) {
      case 'FRIEND_REQUEST':
        return 'vous a envoyé une demande d\'ami';
      case 'FRIEND_REQUEST_ACCEPTED':
        return 'a accepté votre demande d\'ami';
      case 'POST_LIKE':
        return 'a aimé votre publication';
      case 'POST_COMMENT':

        return `a commenté votre publication: "${truncateText(notification.commentContent)}"`;
      case 'POST_CREATED':
        return `a partagé une publication: "${truncateText(notification.postContent)}"`;

      case 'PROFILE_PHOTO_UPDATED':
        return 'a changé sa photo de profil';
      case 'COVER_PHOTO_UPDATED':
        return 'a changé sa photo de couverture';
      case 'COMMENT_LIKE':
        return `a aimé votre commentaire: "${truncateText(notification.commentContent)}"`;
      case 'COMMENT_MENTION':
        return `vous a mentionné dans un commentaire: "${truncateText(notification.commentContent)}"`;
      case 'POST_TAG':
        return notification.postId?.content 
          ? `vous a mentionné dans une publication: "${truncateText(notification.postId.content)}"`
          : `vous a mentionné dans une publication`;
      default:
        return 'a effectué une action';
    }
  };

  const shouldShowPreview = (notification) => {
    if (['PROFILE_PHOTO_UPDATED', 'COVER_PHOTO_UPDATED'].includes(notification.type)) {
      return notification.additionalData?.image;
    }
    if (notification.type === 'POST_CREATED') {
      return notification.reference?.image;
    }
    return false;
  };

  const getPreviewImage = (notification) => {
    if (['PROFILE_PHOTO_UPDATED', 'COVER_PHOTO_UPDATED'].includes(notification.type)) {
      return notification.additionalData?.image;
    }
    if (notification.type === 'POST_CREATED') {
      return notification.reference?.image;
    }
    return null;
  };

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      
      <div className={styles.contentContainer}>
        <div className={styles.header}>
          <h1>Notifications</h1>
          {notifications.length > 0 && (
            <button
              className={styles.markAllRead}
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read/all`,
                    {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );
                  setNotifications(prevNotifications =>
                    prevNotifications.map(n => ({ ...n, read: true }))
                  );
                } catch (error) {
                  console.error('Error marking all as read:', error);
                }
              }}
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {isLoading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.noNotifications}>
            Aucune notification pour le moment
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {notifications.map((notification) => (
              <Link
                key={notification._id}
                href={getNotificationLink(notification)}
                onClick={() => handleNotificationClick(notification)}
                className={`${styles.notificationItem} ${
                  !notification.read ? styles.unread : ''
                }`}
              >
                <div className={styles.notificationContent}>
                  <Image
                    src={notification.sender?.avatar || '/images/default-avatar.jpg'}
                    alt={notification.sender?.username}
                    width={40}
                    height={40}
                    className={styles.avatar}
                  />
                  <div className={styles.notificationText}>
                    <span className={styles.username}>
                      {notification.sender?.username}
                    </span>{' '}
                    {getNotificationText(notification)}
                    <div className={styles.time}>
                      <TimeAgo
                        date={notification.createdAt}
                        formatter={formatter}
                      />
                    </div>
                  </div>
                </div>
                {shouldShowPreview(notification) && (
                  <div className={styles.notificationImage}>
                    <Image
                      src={getPreviewImage(notification)}
                      alt="Aperçu"
                      width={60}
                      height={60}
                      className={styles.contentImage}
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
