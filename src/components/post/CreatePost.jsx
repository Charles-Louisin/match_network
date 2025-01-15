'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './CreatePost.module.css'
import { toast } from 'react-hot-toast'

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!content && !selectedImage) {
      setError("Veuillez ajouter du contenu ou une image")
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    
    // Toujours ajouter le contenu, même s'il est vide
    formData.append('content', content)
    
    if (selectedImage) {
      // Vérifier la taille de l'image (5MB max)
      if (selectedImage.size > 5 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 5MB")
        setIsLoading(false)
        return
      }
      
      // Vérifier le type de l'image
      if (!selectedImage.type.match(/^image\/(jpeg|png|gif|jpg)$/)) {
        setError("Format d'image non supporté. Utilisez JPG, PNG ou GIF")
        setIsLoading(false)
        return
      }
      
      formData.append('image', selectedImage)
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vous devez être connecté pour publier')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la création du post')
      }

      const newPost = await response.json()
      setContent('')
      setSelectedImage(null)
      
      // Réinitialiser le champ de fichier
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) {
        fileInput.value = ''
      }

      if (onPostCreated) {
        onPostCreated(newPost)
      }

      toast.success('Post créé avec succès!')
    } catch (error) {
      console.error('Erreur création post:', error)
      setError(error.message)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.createPost}>
      <div className={styles.header}>
        <Image
          src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : '/images/default-avatar.jpg'}
          alt="Profile"
          width={40}
          height={40}
          className={styles.profileImage}
          priority
          onError={(e) => {
            e.target.src = '/images/default-avatar.jpg'
          }}
        />
        <input
          type="text"
          placeholder={`Dites quelques choses, ${user?.username} ?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={styles.input}
          disabled={isLoading}
        />
      </div>

      {selectedImage && (
        <div className={styles.imagePreview}>
          <Image
            className={styles.image}
            src={URL.createObjectURL(selectedImage)}
            alt="Preview"
            layout="fill"
            objectFit="contain"
          />
          <button
            className={styles.removeImage}
            onClick={() => setSelectedImage(null)}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <label className={`${styles.mediaButton} ${isLoading ? styles.disabled : ''}`}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) {
                setSelectedImage(file)
              }
            }}
            disabled={isLoading}
            hidden
          />
          <i className="fas fa-image"></i>
          Photo
        </label>

        <button
          onClick={handleSubmit}
          className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
          disabled={isLoading || (!content && !selectedImage)}
        >
          {isLoading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              <span>Publication en cours...</span>
            </div>
          ) : (
            'Publier'
          )}
        </button>
      </div>
    </div>
  )
}