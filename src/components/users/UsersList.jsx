import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './UsersList.module.css';
import { toast } from 'react-hot-toast';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const allUsers = await response.json();
          if (!Array.isArray(allUsers)) {
            setError('Format de réponse invalide');
            return;
          }

          // Filtrer l'utilisateur actuel
          const otherUsers = currentUser 
            ? allUsers.filter(user => user._id !== currentUser._id)
            : allUsers;

          setUsers(otherUsers);
          setFilteredUsers(otherUsers);
          setError(null);
        } else {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            setError(errorJson.message || 'Erreur lors de la récupération des utilisateurs');
          } catch (e) {
            setError('Erreur lors de la récupération des utilisateurs');
          }
        }
      } catch (error) {
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleImageError = (username) => {
    return '/images/default-avatar.jpg';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h2>Vous connaissez peut-être</h2>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2>Vous connaissez peut-être</h2>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Vous connaissez peut-être</h2>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={handleSearch}
          className={styles.searchInput}
        />
      </div>
      {filteredUsers.length === 0 ? (
        <p className={styles.noUsers}>
          {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur pour le moment'}
        </p>
      ) : (
        <div className={styles.usersGrid}>
          {filteredUsers.map(user => (
            <div key={user._id} className={styles.userCard}>
              <Image
                src={user.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : '/images/default-avatar.jpg'}
                alt={user.username}
                width={100}
                height={100}
                className={styles.avatar}
                onError={() => handleImageError(user.username)}
              />
              <h3 className={styles.username}>{user.username}</h3>
              <Link href={`/profile/${user._id}`} className={styles.viewProfileButton}>
                Voir le profil
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
