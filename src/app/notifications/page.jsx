'use client';

import { useState, useEffect } from 'react';
import { useFriends } from '@/hooks/useFriends';
import NotificationCard from '@/components/notification/NotificationCard';
import FriendRequestNotification from '@/components/notification/FriendRequestNotification';
import Navbar from '@/components/layout/Navbar';
import styles from './page.module.css';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { pendingRequests, refreshRequests } = useFriends();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erreur lors de la récupération des notifications');
      
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = () => {
    fetchNotifications();
    refreshRequests();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.loading}>Chargement des notifications...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.content}>
        <h1 className={styles.title}>Notifications</h1>
        
        {/* Demandes d'amitié */}
        {pendingRequests.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Demandes d&apos;amitié</h2>
            <div className={styles.requestsContainer}>
              {pendingRequests.map(request => (
                <FriendRequestNotification
                  key={request._id}
                  request={request}
                  onActionComplete={handleNotificationUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {/* Autres notifications */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Autres notifications</h2>
          {notifications.length === 0 ? (
            <p className={styles.noNotifications}>Aucune notification</p>
          ) : (
            <div className={styles.notificationsContainer}>
              {notifications.map(notification => (
                <NotificationCard
                  key={notification._id}
                  notification={notification}
                  onUpdate={handleNotificationUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
