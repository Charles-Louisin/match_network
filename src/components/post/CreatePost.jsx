'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { IoImageOutline } from 'react-icons/io5'
import { FaUserTag } from 'react-icons/fa'
import TagFriendsModal from './TagFriendsModal'
import styles from './CreatePost.module.css'
import { toast } from 'react-hot-toast'

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showTagModal, setShowTagModal] = useState(false)
  const [taggedFriends, setTaggedFriends] = useState([])
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    // Créer l'URL de prévisualisation pour l'image sélectionnée
    if (selectedImage) {
      const objectUrl = URL.createObjectURL(selectedImage)
      setPreviewImage(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
  }, [selectedImage])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!content && !selectedImage) {
      setError("Veuillez ajouter du contenu ou une image")
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    
    formData.append('content', content)
    
    if (selectedImage) {
      if (selectedImage.size > 10 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 10MB")
        setIsLoading(false)
        return
      }
      
      if (!selectedImage.type.match(/^image\/(jpeg|png|gif|jpg)$/)) {
        setError("Format d'image non supporté. Utilisez JPG, PNG ou GIF")
        setIsLoading(false)
        return
      }
      
      formData.append('image', selectedImage)
    }

    // Ajouter les amis tagués
    if (taggedFriends.length > 0) {
      formData.append('taggedUsers', JSON.stringify(taggedFriends.map(friend => friend.id)))
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
      setPreviewImage(null)
      setTaggedFriends([])
      
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

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0])
    }
  }

  const handleTagFriends = (selectedFriends) => {
    setTaggedFriends(selectedFriends)
  }

  const removeTaggedFriend = (friendId) => {
    setTaggedFriends(prev => prev.filter(friend => friend.id !== friendId))
  }

  const autoResizeTextArea = (e) => {
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }

  return (
    <div className={styles.createPost}>
      <div className={styles.header}>
        <Image
          src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : "/images/default-avatar.jpg"}
          alt="Profile"
          width={40}
          height={40}
          className={styles.avatar}
        />
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            autoResizeTextArea(e)
          }}
          placeholder={`Que voulez-vous partager ${user?.username} ?`}
          className={styles.input}
        />
      </div>

      {/* Section des amis tagués */}
      {taggedFriends.length > 0 && (
        <div className={styles.taggedFriends}>
          <p className={styles.taggedHeader}>
            est avec {taggedFriends.map((friend, index) => (
              <span key={friend.id} className={styles.taggedName}>
                <span className={styles.tagSymbol}>@</span>{friend.username}
                <button
                  onClick={() => removeTaggedFriend(friend.id)}
                  className={styles.removeTag}
                >
                  ×
                </button>
                {index < taggedFriends.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Prévisualisation de l'image */}
      {previewImage && (
        <div className={styles.imagePreview}>
          <Image
            src={previewImage}
            alt="Preview"
            width={0}
            height={0}
            sizes="100vw"
            className={styles.previewImg}
          />
          <button
            onClick={() => {
              setSelectedImage(null)
              setPreviewImage(null)
            }}
            className={styles.removeImage}
          >
            ×
          </button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <div className={styles.buttons}>
          <label className={styles.imageButton}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <IoImageOutline size={24} />
            <span>Image</span>
          </label>

          <button
            className={styles.tagButton}
            onClick={() => setShowTagModal(true)}
          >
            <FaUserTag size={20} />
            <span>Taguer</span>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || (!content && !selectedImage)}
          className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
        >
          {isLoading ? 'Publication...' : 'Publier'}
        </button>
      </div>

      <TagFriendsModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        onTagFriends={handleTagFriends}
      />
    </div>
  )
}