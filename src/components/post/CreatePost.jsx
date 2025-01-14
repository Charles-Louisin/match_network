'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './CreatePost.module.css'

export default function CreatePost() {
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content && !selectedImage) return

    const formData = new FormData()
    formData.append('content', content)
    if (selectedImage) {
      formData.append('image', selectedImage)
    }

    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) throw new Error('Erreur lors de la création du post')

      setContent('')
      setSelectedImage(null)

    } catch (error) {
      console.log(error.message)
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
            e.target.src = '/images/default-avatar.jpg';
          }}
        />
        <input
          type="text"
          placeholder={`Dites quelques choses, ${user?.username} ?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={styles.input}
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
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.actions}>
        <label className={styles.mediaButton}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setSelectedImage(e.target.files[0])}
            hidden
            title="Taille maximum : 5 MB"
          />
          <i className="fas fa-image"></i>
          Photos
        </label>

        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          type="submit"
          disabled={!content && !selectedImage}
        >
          Publier
        </button>
      </div>
    </div>
  )
} 