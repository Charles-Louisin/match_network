'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './FriendSuggestions.module.css'
import { useFriendship } from '@/hooks/useFriendship';

export default function FriendSuggestions() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { friends, sentRequests, sendFriendRequest, cancelFriendRequest } = useFriendship();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    } else {
      setError('Utilisateur non connecté');
    }
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Token non trouvé');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/search`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const allUsers = await response.json();
          // Filtrer l'utilisateur actuel et ses amis
          const otherUsers = allUsers.filter(user => 
            user._id !== currentUser?._id && !friends.has(user._id)
          );

          setUsers(otherUsers);
          setFilteredUsers(otherUsers);
          setError(null);
        } else {
          throw new Error('Erreur lors de la récupération des utilisateurs');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, friends]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddFriend = async (userId) => {
    const success = await sendFriendRequest(userId);
    if (success) {
      setUsers(prevUsers => prevUsers.map(user => {
        if (user._id === userId) {
          return { ...user, requestSent: true };
        }
        return user;
      }));
    }
  };

  const handleCancelRequest = async (userId) => {
    const success = await cancelFriendRequest(userId);
    if (success) {
      setUsers(prevUsers => prevUsers.map(user => {
        if (user._id === userId) {
          return { ...user, requestSent: false };
        }
        return user;
      }));
    }
  };

  if (loading) {
    return (
      <div className={styles.suggestions}>
        <h2>Suggestions d&apos;amis</h2>
        <p className={styles.loading}>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.suggestions}>
        <h2>Suggestions d&apos;amis</h2>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <div className={styles.suggestions}>
        <h2>Suggestions d&apos;amis</h2>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>
        <p className={styles.noResults}>
          {searchTerm ? "Aucun utilisateur ne correspond à votre recherche" : "Aucune suggestion d'ami disponible"}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.suggestions}>
      <div className={styles.header}>
        <h2>Suggestions d&apos;amis</h2>
      </div>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={handleSearch}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.userGrid}>
        {filteredUsers.map(user => (
          <div key={user._id} className={styles.userCard}>
            <Link href={`/profile/${user._id}`} className={styles.userInfo}>
              <div className={styles.avatarContainer}>
                <Image
                  src={user.profilePicture || '/images/default-avatar.jpg'}
                  alt={user.username}
                  width={80}
                  height={80}
                  className={styles.avatar}
                />
              </div>
              <span className={styles.username}>{user.username}</span>
            </Link>
            <button
              onClick={() => sentRequests.has(user._id) ? handleCancelRequest(user._id) : handleAddFriend(user._id)}
              className={`${styles.button} ${sentRequests.has(user._id) ? styles.cancelButton : styles.addButton}`}
              disabled={friends.has(user._id)}
            >
              {friends.has(user._id) ? 'Déjà ami' : sentRequests.has(user._id) ? 'Annuler' : 'Ajouter'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}