'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import styles from './page.module.css';
import Avatar from '@/components/common/Avatar';
import RemoveFriendButton from '@/components/friend/RemoveFriendButton';
import Navbar from '@/components/layout/Navbar';
import UsersList from '@/components/users/UsersList';
import Image from 'next/image';

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [newRequests, setNewRequests] = useState(false);
  const [lastRequestCount, setLastRequestCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les amis en fonction de la recherche
  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Utiliser directement les demandes en attente sans filtrage supplémentaire
  const filteredPendingRequests = pendingRequests;

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
      console.log('Fetching pending requests...');
      console.log('Current user from state:', currentUser);
      const userFromStorage = JSON.parse(localStorage.getItem('user'));
      console.log('Current user from storage:', userFromStorage);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/requests/pending`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw data from API:', data);
      
      setPendingRequests(data);
      
      // Mettre à jour le compteur de nouvelles demandes
      const newCount = data.length;
      if (newCount > lastRequestCount) {
        setNewRequests(true);
      }
      setLastRequestCount(newCount);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  }, [currentUser, lastRequestCount]);

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

  const renderPendingRequests = () => {
    if (!filteredPendingRequests || filteredPendingRequests.length === 0) {
      return null;
    }

    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Demandes d'amitié</h2>
        <div className={styles.requestsGrid}>
          {filteredPendingRequests.map((request) => {
            const otherUser = request.isCurrentUserSender ? request.recipient : request.sender;
            const actionText = request.isCurrentUserSender ? 'Demande envoyée' : '';

            return (
              <div key={request._id} className={styles.requestCard}>
                <Link href={`/profile/${otherUser._id}`} className={styles.userInfo}>
                  <div className={styles.avatarContainer}>
                    <Image
                      src={otherUser.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${otherUser.avatar}` : '/images/default-avatar.jpg'}
                      alt={otherUser.username}
                      width={80}
                      height={80}
                      className={styles.avatar}
                      priority={true}
                      unoptimized={true}
                    />
                  </div>
                  <span className={styles.username}>{otherUser.username}</span>
                  {actionText && <span className={styles.requestStatus}>{actionText}</span>}
                </Link>
                {!request.isCurrentUserSender && (
                  <div className={styles.requestActions}>
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      className={styles.acceptButton}
                      disabled={isLoading}
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request._id)}
                      className={styles.rejectButton}
                      disabled={isLoading}
                    >
                      Refuser
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
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

        {/* Section des demandes en attente */}
        {renderPendingRequests()}

        {/* Liste des amis */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Mes amis</h2>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Rechercher un ami..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          {friends.length === 0 ? (
            <p className={styles.noFriends}>Vous n&apos;avez pas encore d&apos;amis</p>
          ) : (
            <div className={styles.friendsContainer}>
              {filteredFriends.map(friend => (
                <div key={friend._id || friend.id} className={styles.friendCard}>
                  <Link href={`/profile/${friend._id || friend.id}`} className={styles.userInfo}>
                    <Avatar
                      src={friend.avatar}
                      alt={friend.username}
                      size="medium"
                      priority={true}
                    />
                    <span className={styles.username}>{friend.username}</span>
                  </Link>
                  <RemoveFriendButton
                    friendId={friend._id || friend.id}
                    onFriendRemoved={fetchFriends}
                  />
                </div>
              ))}
              {filteredFriends.length === 0 && searchQuery && (
                <p className={styles.noResults}>Aucun ami ne correspond à votre recherche</p>
              )}
            </div>
          )}
        </div>

        {/* Liste de tous les utilisateurs */}
        <UsersList />
      </main>
    </div>
  );
};

export default FriendsPage;
