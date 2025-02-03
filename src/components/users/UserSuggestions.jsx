'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useFriendship } from '@/hooks/useFriendship';
import styles from './UserSuggestions.module.css';

export default function UserSuggestions() {
  const [users, setUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const { friends, sentRequests, sendFriendRequest, cancelFriendRequest, fetchPendingRequests } = useFriendship();

  const ITEMS_PER_PAGE = 24;

  // Charger les utilisateurs au montage
  useEffect(() => {
    fetchUsers();
  }, []);

  // Recharger les demandes d'ami périodiquement
  useEffect(() => {
    fetchPendingRequests();
    const interval = setInterval(fetchPendingRequests, 5000); // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval);
  }, [fetchPendingRequests]);

  // Filtrer les utilisateurs affichés
  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setDisplayedUsers(showAll ? filtered : filtered.slice(0, ITEMS_PER_PAGE));
  }, [users, searchTerm, showAll]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user'));

      if (!token || !currentUser) {
        throw new Error('Vous devez être connecté');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/search`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des suggestions');
      }

      const data = await response.json();
      // Filtrer l'utilisateur actuel et ses amis
      const filteredUsers = data.filter(user => 
        user._id !== currentUser._id && !friends.has(user._id)
      );
      setUsers(filteredUsers);
      setDisplayedUsers(filteredUsers.slice(0, ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      const success = await sendFriendRequest(userId);
      if (success) {
        await fetchPendingRequests();
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      const success = await cancelFriendRequest(userId);
      if (success) {
        await fetchPendingRequests();
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la demande:', error);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Chargement des suggestions...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Vous connaissez peut-être</h1>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {displayedUsers.length > 0 ? (
        <>
          <div className={styles.grid}>
            {displayedUsers.map((user) => {
              const hasSentRequest = sentRequests.has(user._id);
              
              return (
                <div key={user._id} className={styles.card}>
                  <Link href={`/profile/${user._id}`} className={styles.userInfo}>
                    <div className={styles.avatarContainer}>
                      <Image
                        src={user.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : '/images/default-avatar.jpg'}
                        alt={user.username}
                        width={60}
                        height={60}
                        className={styles.avatar}
                      />
                    </div>
                    <span className={styles.name}>{user.username}</span>
                  </Link>
                  {hasSentRequest ? (
                    <button
                      onClick={() => handleCancelRequest(user._id)}
                      className={`${styles.button} ${styles.cancelRequest}`}
                      disabled={isLoading}
                    >
                      Annuler
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddFriend(user._id)}
                      className={`${styles.button} ${styles.addFriend}`}
                      disabled={isLoading}
                    >
                      Ajouter
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {users.length > ITEMS_PER_PAGE && !showAll && !searchTerm && (
            <button
              onClick={() => setShowAll(true)}
              className={styles.showMoreButton}
            >
              Voir plus
            </button>
          )}
        </>
      ) : (
        <div className={styles.noResults}>
          {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucune suggestion disponible'}
        </div>
      )}
    </div>
  );
}
