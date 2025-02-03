'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import styles from './page.module.css';
import Avatar from '@/components/common/Avatar';
import RemoveFriendButton from '@/components/friend/RemoveFriendButton';
import Navbar from '@/components/layout/Navbar';
import UserSuggestions from '@/components/users/UserSuggestions';
import Image from 'next/image';

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [newRequests, setNewRequests] = useState(false);
  const [lastRequestCount, setLastRequestCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleFriends, setVisibleFriends] = useState(12);
  const [visibleRequests, setVisibleRequests] = useState(12);
  const [visibleSuggestions, setVisibleSuggestions] = useState(21);

  // Filtrer les amis en fonction de la recherche
  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrer uniquement les demandes reçues
  const filteredPendingRequests = pendingRequests.filter(request => !request.isCurrentUserSender);

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

  // Supprimer l'auto-refresh
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchFriends(), fetchPendingRequests()]);
    } finally {
      setIsLoading(false);
    }
  };

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

    const displayedRequests = filteredPendingRequests.slice(0, visibleRequests);
    const hasMore = filteredPendingRequests.length > visibleRequests;

    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Demandes d&apos;amitié</h2>
        <div className={styles.requestsGrid}>
          {displayedRequests.map((request) => {
            const otherUser = request.sender;
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
                </Link>
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
              </div>
            );
          })}
        </div>
        {hasMore && (
          <button
            onClick={() => setVisibleRequests(prev => prev + 6)}
            className={styles.showMoreButton}
          >
            Voir plus
          </button>
        )}
      </div>
    );
  };

  const renderFriends = () => {
    if (!filteredFriends || filteredFriends.length === 0) {
      return (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Mes amis</h2>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Rechercher un ami..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleFriends(12);
              }}
              className={styles.searchInput}
            />
          </div>
          {searchQuery ? (
            <p className={styles.noResults}>Aucun ami ne correspond à votre recherche</p>
          ) : (
            <p className={styles.noResults}>Vous n&apos;avez pas encore d&apos;amis. Découvrez des personnes qui pourraient vous interessez dans la section <strong>Vous connaissez peut-être</strong></p>
          )}
        </div>
      );
    }

    const displayedFriends = filteredFriends.slice(0, visibleFriends);
    const hasMore = filteredFriends.length > visibleFriends;

    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {filteredFriends.length === 0
            ? "Mes amis"
            : filteredFriends.length === 1
            ? `Mes amis (1 ami)`
            : `Mes amis (${filteredFriends.length} amis)`}
        </h2>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Rechercher un ami..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleFriends(12);
            }}
            className={styles.searchInput}
          />
        </div>
        <div className={`${styles.friendsGrid} ${visibleFriends > 12 ? styles.showAll : ''} ${styles.responsiveGrid}`}>
          {displayedFriends.map((friend) => (
            <div key={friend._id} className={styles.friendCard}>
              <Link href={`/profile/${friend._id}`} className={styles.userInfo}>
                <div className={styles.avatarContainer}>
                  <Image
                    src={friend.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${friend.avatar}` : '/images/default-avatar.jpg'}
                    alt={friend.username}
                    width={60}
                    height={60}
                    className={styles.avatar}
                  />
                </div>
                <span className={styles.username}>{friend.username}</span>
              </Link>
              <div className={styles.friendActions}>
                <RemoveFriendButton friendId={friend._id} onFriendRemoved={loadData} />
              </div>
            </div>
          ))}
        </div>
        {filteredFriends.length > 12 && visibleFriends <= 12 && (
          <button
            onClick={() => setVisibleFriends(filteredFriends.length)}
            className={styles.showMoreButton}
          >
            Voir plus
          </button>
        )}
      </div>
    );
  };

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
        {renderFriends()}

        {/* Liste des suggestions d'amis */}
        <UserSuggestions />
      </main>
    </div>
  );
};

export default FriendsPage;
