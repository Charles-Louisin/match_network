'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './FriendSuggestions.module.css'

export default function FriendSuggestions() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [displayCount, setDisplayCount] = useState(5)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Dans le premier useEffect (pour l'utilisateur courant)
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      console.log('Current user from localStorage:', user)
      setCurrentUser(user)
    } else {
      console.log('No user found in localStorage')
      setError('Utilisateur non connecté')
    }
  }, [])

  // Dans le deuxième useEffect (pour la récupération des utilisateurs)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.log('No token found in localStorage')
          setError('Token non trouvé')
          return
        }
        console.log('Token found:', token)

        console.log('Starting user fetch...')
        const response = await fetch('http://localhost:5000/api/users/search', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('Response status:', response.status)
        
        if (response.ok) {
          const allUsers = await response.json()
          console.log('All users received:', allUsers)
          
          if (!Array.isArray(allUsers)) {
            console.error('Response is not an array:', allUsers)
            setError('Format de réponse invalide')
            return
          }
          
          // Filtrer l'utilisateur actuel de la liste
          const otherUsers = currentUser 
            ? allUsers.filter(user => user._id !== currentUser._id)
            : allUsers

          console.log('Filtered users (excluding current user):', otherUsers)
          setUsers(otherUsers)
          setFilteredUsers(otherUsers)
          setError(null)
        } else {
          const errorText = await response.text()
          console.error('Error response from server:', errorText)
          try {
            const errorJson = JSON.parse(errorText)
            setError(errorJson.message || 'Erreur lors de la récupération des utilisateurs')
          } catch (e) {
            setError('Erreur lors de la récupération des utilisateurs')
          }
        }
      } catch (error) {
        console.error('Fetch error details:', {
          message: error.message,
          stack: error.stack
        })
        setError('Erreur de connexion au serveur')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      console.log('Fetching users because we have a current user')
      fetchUsers()
    } else {
      console.log('Skipping user fetch because no current user')
    }
  }, [currentUser])

  // Filtrer les utilisateurs en fonction de la recherche
  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    console.log('Filtered users after search:', filtered)
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 5)
  }

  const handleAddFriend = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Vous devez être connecté pour ajouter un ami')
        return
      }

      const response = await fetch(`http://localhost:5000/api/users/${userId}/friend-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Add friend response:', response)

      if (response.ok) {
        alert('Demande d\'ami envoyée avec succès')
      } else {
        const error = await response.json()
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande d\'ami:', error)
      alert(error.message)
    }
  }

  const handleImageError = (username) => {
    // console.log('Image error for user:', username);
    // Utiliser l'image par défaut en cas d'erreur
    return '/images/default-avatar.jpg';
  };

  if (loading) {
    return (
      <div className={styles.suggestions}>
        <h2>Suggestions d'amis</h2>
        <p>Chargement...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.suggestions}>
        <h2>Suggestions d'amis</h2>
        <p className={styles.error}>{error}</p>
      </div>
    )
  }

  return (
    <div className={styles.suggestions}>
      <h2>Suggestions d'amis</h2>
      
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
        <>
          {filteredUsers.slice(0, displayCount).map(user => {
            // console.log('Rendering user:', user, 'Avatar path:', user.avatar || '/default-avatar.jpg')
            return (
              <div key={user._id} className={styles.suggestionCard}>
                <Link href={`/profile/${user._id}`} className={styles.userInfo}>
                  <div className={styles.avatarContainer}>
                    <Image
                      src={user.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : '/images/default-avatar.jpg'}
                      alt={`${user.username}'s avatar`}
                      width={40}
                      height={40}
                      className={styles.avatar}
                      priority={true}
                      style={{ objectFit: 'cover', borderRadius: '50%' }}
                      onError={(e) => {
                        {handleImageError}
                      }}
                    />
                  </div>
                  <div className={styles.userDetails}>
                    <h3>{user.username}</h3>
                    <span>{user.email}</span>
                  </div>
                </Link>
                
                <button 
                  className={styles.addButton}
                  onClick={() => handleAddFriend(user._id)}
                >
                  Ajouter
                </button>
              </div>
            )
          })}
          {filteredUsers.length > displayCount && (
            <button 
              className={styles.showMoreButton}
              onClick={handleShowMore}
            >
              Voir plus
            </button>
          )}
        </>
      )}
    </div>
  )
}