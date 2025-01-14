'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import styles from './page.module.css';
import Avatar from '@/components/common/Avatar';
import RemoveFriendButton from '@/components/friend/RemoveFriendButton';
import Navbar from '@/components/layout/Navbar';

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [newRequests, setNewRequests] = useState(false);
  const [lastRequestCount, setLastRequestCount] = useState(0);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la récupération des amis');
      }

      const data = await response.json();
      setFriends(data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error(error.message || 'Erreur lors de la récupération des amis');
    }
  };

  const fetchPendingRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      console.log('Récupération des demandes en attente...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la récupération des demandes en attente');
      }

      const data = await response.json();
      console.log('Demandes en attente reçues:', data);

      // Filtrer les demandes reçues (où l'utilisateur est le destinataire)
      const receivedRequests = data.filter(request => 
        request.receiver === currentUser?._id && request.status === 'pending'
      );

      setPendingRequests(receivedRequests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error(error.message || 'Erreur lors de la récupération des demandes en attente');
    }
  }, [currentUser?._id, toast]);

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/accept/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.text();
      
      if (!response.ok) {
        try {
          const errorData = JSON.parse(data);
          throw new Error(errorData.message || 'Erreur lors de l\'acceptation de la demande');
        } catch {
          throw new Error('Erreur lors de l\'acceptation de la demande');
        }
      }

      try {
        const jsonData = JSON.parse(data);
        toast.success(jsonData.message || 'Demande d\'ami acceptée !');
      } catch {
        toast.success('Demande d\'ami acceptée !');
      }

      setNewRequests(false);
      await Promise.all([fetchFriends(), fetchPendingRequests()]);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error(error.message || 'Erreur lors de l\'acceptation de la demande');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      // Mise à jour optimiste de l'interface
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      setNewRequests(false);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/reject/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Si la réponse est ok ou si la demande n'existe plus, c'est un succès
      if (response.ok || response.status === 404) {
        toast.success('Demande rejetée avec succès');
        return;
      }

      // En cas d'erreur, restaurer l'état précédent
      const data = await response.text();
      try {
        const errorData = JSON.parse(data);
        throw new Error(errorData.message);
      } catch {
        throw new Error('Erreur lors du rejet de la demande');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      // Restaurer l'état en cas d'erreur
      await fetchPendingRequests();
      toast.error(error.message || 'Erreur lors du rejet de la demande');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          await Promise.all([fetchFriends(), fetchPendingRequests()]);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();

      // Rafraîchir les données toutes les 30 secondes
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchPendingRequests]);

  useEffect(() => {
    fetchPendingRequests()
  }, [fetchPendingRequests])

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.content}>
        <h1 className={styles.title}>Amis</h1>

        {/* Section des demandes en attente - toujours affichée pour le débogage */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Invitations reçues
            {newRequests && <span className={styles.badge}>{pendingRequests.length} nouvelle{pendingRequests.length > 1 ? 's' : ''}</span>}
          </h2>
          {pendingRequests.length > 0 ? (
            <div className={styles.requestsGrid}>
              {pendingRequests.map((request) => (
                <div key={request._id} className={styles.requestCard}>
                  <Link href={`/profile/${request.sender._id}`} className={styles.userInfo}>
                    <Avatar
                      src={request.sender.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${request.sender.avatar}` : null}
                      alt={request.sender.username}
                      size="medium"
                    />
                    <span className={styles.username}>{request.sender.username}</span>
                  </Link>
                  <div className={styles.requestActions}>
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      className={styles.acceptButton}
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request._id)}
                      className={styles.rejectButton}
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyMessage}>
              Aucune invitation en attente
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Mes amis ({friends.length})
          </h2>
          <div className={styles.friendsGrid}>
            {friends.map((friend) => (
              <div key={friend._id || friend.id} className={styles.friendCard}>
                <Link href={`/profile/${friend._id || friend.id}`} className={styles.userInfo}>
                  <Avatar
                    src={friend.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${friend.avatar}` : null}
                    alt={friend.username}
                    size="medium"
                  />
                  <span className={styles.username}>{friend.username}</span>
                </Link>
                <RemoveFriendButton
                  friendId={friend._id || friend.id}
                  onFriendRemoved={fetchFriends}
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FriendsPage;
