'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { IoClose, IoSearch } from 'react-icons/io5'
import styles from './TagFriendsModal.module.css'

export default function TagFriendsModal({ isOpen, onClose, onTagFriends }) {
  const [friends, setFriends] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFriends, setSelectedFriends] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchFriends()
    }
  }, [isOpen])

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user'))
      
      if (!token || !user) {
        throw new Error('Non authentifié')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/friends/list`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
          },
        }
      )

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des amis')
      }

      const data = await response.json()
      setFriends(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const toggleFriendSelection = (friend) => {
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f.id === friend.id)
      if (isSelected) {
        return prev.filter(f => f.id !== friend.id)
      } else {
        return [...prev, friend]
      }
    })
  }

  const handleConfirm = () => {
    onTagFriends(selectedFriends)
    onClose()
  }

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Taguer des amis</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <IoClose size={24} />
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

        {isLoading ? (
          <div className={styles.loading}>Chargement de vos amis...</div>
        ) : (
          <>
            <div className={styles.selectedCount}>
              {selectedFriends.length} ami{selectedFriends.length !== 1 ? 's' : ''} sélectionné{selectedFriends.length !== 1 ? 's' : ''}
            </div>

            <div className={styles.friendsList}>
              {filteredFriends.map(friend => (
                <div
                  key={friend.id}
                  className={`${styles.friendItem} ${
                    selectedFriends.some(f => f.id === friend.id) ? styles.selected : ''
                  }`}
                  onClick={() => toggleFriendSelection(friend)}
                >
                  <div className={styles.friendInfo}>
                    <Image
                      src={friend.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${friend.avatar}` : "/images/default-avatar.jpg"}
                      alt={friend.username}
                      width={40}
                      height={40}
                      className={styles.avatar}
                    />
                    <span className={styles.username}>{friend.username}</span>
                  </div>
                  <div className={styles.checkbox}>
                    {selectedFriends.some(f => f.id === friend.id) && (
                      <div className={styles.checkmark} />
                    )}
                  </div>
                </div>
              ))}

              {filteredFriends.length === 0 && (
                <div className={styles.noResults}>
                  Aucun ami trouvé pour "{searchQuery}"
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={onClose}
                className={styles.cancelButton}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className={styles.confirmButton}
                disabled={selectedFriends.length === 0}
              >
                Taguer ({selectedFriends.length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
