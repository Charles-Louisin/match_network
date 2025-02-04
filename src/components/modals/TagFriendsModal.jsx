'use client';

import { useState, useEffect } from 'react';
import styles from './TagFriendsModal.module.css';
import Image from 'next/image';
import { IoClose, IoSearch } from 'react-icons/io5';

const TagFriendsModal = ({ isOpen, onClose, onTagFriends }) => {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      // Réinitialiser les sélections à chaque ouverture
      setSelectedFriends([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/friends/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }

      const data = await response.json();
      setFriends(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => {
      const isSelected = prev.includes(friendId);
      if (isSelected) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  const handleConfirm = () => {
    const selectedFriendsData = friends.filter(friend => 
      selectedFriends.includes(friend._id)
    );
    onTagFriends(selectedFriendsData);
    onClose();
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Taguer des amis</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className={styles.searchContainer}>
          <IoSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher des amis..."
            value={searchQuery}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        {selectedFriends.length > 0 && (
          <div className={styles.selectedCount}>
            {selectedFriends.length} ami{selectedFriends.length > 1 ? 's' : ''} sélectionné{selectedFriends.length > 1 ? 's' : ''}
          </div>
        )}

        {isLoading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : (
          <div className={styles.friendsList}>
            {filteredFriends.map(friend => (
              <div
                key={friend._id}
                className={`${styles.friendItem} ${selectedFriends.includes(friend._id) ? styles.selected : ''}`}
              >
                <div className={styles.friendInfo}>
                  <Image
                    src={friend.avatar || '/images/default-avatar.jpg'}
                    alt={friend.username}
                    width={40}
                    height={40}
                    className={styles.avatar}
                  />
                  <span className={styles.username}>{friend.username}</span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedFriends.includes(friend._id)}
                  onChange={() => toggleFriendSelection(friend._id)}
                  className={styles.checkbox}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </div>
        )}

        <div className={styles.modalFooter}>
          <button
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={selectedFriends.length === 0}
          >
            Taguer ({selectedFriends.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagFriendsModal;
