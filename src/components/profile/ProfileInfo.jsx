'use client'

import { useState } from 'react'
import styles from './ProfileInfo.module.css'

export default function ProfileInfo({ profile, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedInfo, setEditedInfo] = useState({
    username: profile.username,
    bio: profile.bio,
    location: profile.location,
    birthDate: profile.birthDate,
    birthPlace: profile.birthPlace
  })
  const [error, setError] = useState('')

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vous devez être connecté pour modifier votre profil')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedInfo)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la mise à jour du profil')
      }

      const updatedProfile = await response.json()
      onProfileUpdate(updatedProfile)
      setIsEditing(false)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={styles.infoCard}>
      <div className={styles.header}>
        <h2>Informations</h2>
        {profile.isCurrentUser && (
          <button 
            className={styles.editButton}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Annuler' : 'Modifier'}
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {isEditing ? (
        <div className={styles.editForm}>
          <div className={styles.formGroup}>
            <label>Nom d&apos;utilisateur</label>
            <input
              type="text"
              value={editedInfo.username}
              onChange={(e) => setEditedInfo({...editedInfo, username: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Bio</label>
            <textarea
              value={editedInfo.bio}
              onChange={(e) => setEditedInfo({...editedInfo, bio: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Lieu de résidence</label>
            <input
              type="text"
              value={editedInfo.location}
              onChange={(e) => setEditedInfo({...editedInfo, location: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Date de naissance</label>
            <input
              type="date"
              value={editedInfo.birthDate}
              onChange={(e) => setEditedInfo({...editedInfo, birthDate: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Lieu de naissance</label>
            <input
              type="text"
              value={editedInfo.birthPlace}
              onChange={(e) => setEditedInfo({...editedInfo, birthPlace: e.target.value})}
            />
          </div>
          <button className={styles.saveButton} onClick={handleSave}>
            Enregistrer les modifications
          </button>
        </div>
      ) : (
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <i className="fas fa-user"></i>
            <p>{profile.username}</p>
          </div>
          <div className={styles.infoItem}>
            <i className="fas fa-info-circle"></i>
            <p>{profile.bio}</p>
          </div>
          <div className={styles.infoItem}>
            <i className="fas fa-map-marker-alt"></i>
            <p>Vit à {profile.location}</p>
          </div>
          <div className={styles.infoItem}>
            <i className="fas fa-birthday-cake"></i>
            <p>Né(e) le {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('fr-FR') : 'Non renseigné'}</p>
          </div>
          <div className={styles.infoItem}>
            <i className="fas fa-home"></i>
            <p>De {profile.birthPlace}</p>
          </div>
        </div>
      )}
    </div>
  )
}