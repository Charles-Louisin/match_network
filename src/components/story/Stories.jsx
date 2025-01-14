'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './Stories.module.css'

export default function Stories() {
  const router = useRouter()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vous devez être connecté pour voir les stories')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        throw new Error('Session expirée, veuillez vous reconnecter')
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors du chargement des stories')
      }

      const data = await response.json()
      const user = JSON.parse(localStorage.getItem('user'))
      
      setStories([
        { 
          id: 'create', 
          user: { 
            name: 'Vous', 
            image: user?.avatar || '/images/default-avatar.jpg'
          }, 
          isCreate: true 
        },
        ...data
      ])
    } catch (error) {
      console.error('Error fetching stories:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [router, setLoading, setStories, setError])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchStories()
  }, [fetchStories, router])

  const handleCreateStory = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('http://localhost:5000/api/stories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) throw new Error('Erreur lors de la création de la story')
      
      fetchStories() // Rafraîchir les stories
    } catch (error) {
      console.error(error.message)
    }
  }

  if (error) return <div className={styles.error}>{error}</div>
  if (loading) return <div className={styles.loading}>Chargement...</div>

  return (
    <div className={styles.storiesContainer}>
      <div className={styles.storiesWrapper}>
        {stories.map((story) => (
          <div key={story.id} className={styles.storyCard}>
            {story.isCreate ? (
              <>
                <div className={styles.createStory}>
                  <Image
                    src={story.user.image ? `${process.env.NEXT_PUBLIC_API_URL}${story.user.image}` : '/images/default-avatar.jpg'}
                    alt={story.user.name}
                    width={120}
                    height={200}
                    className={styles.storyBackground}
                  />
                  <label className={styles.createIcon}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCreateStory}
                      hidden
                    />
                    <i className="fas fa-plus">+</i>
                  </label>
                  <span>Créer une story</span>
                </div>
              </>
            ) : (
              <>
                <Image
                  src={story.image}
                  alt={story.user.username}
                  width={120}
                  height={200}
                  className={styles.storyBackground}
                />
                <div className={styles.storyUser}>
                  <Image
                    src={story.user.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${story.user.avatar}` : '/images/default-avatar.jpg'}
                    alt={story.user.username}
                    width={40}
                    height={40}
                    className={styles.userAvatar}
                  />
                  <span>{story.user.username}</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 