'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './Stories.module.css'

export default function Stories() {
  const router = useRouter()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchStories()
  }, [router])

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error(&apos;Vous devez être connecté pour voir les stories&apos;)
      }

      const response = await fetch('http://localhost:5000/api/stories', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status === 401) {
        localStorage.removeItem('token') // Supprimer le token invalide
        localStorage.removeItem('user')
        router.push('/login')
        throw new Error(&apos;Session expirée, veuillez vous reconnecter&apos;)
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || &apos;Erreur lors du chargement des stories&apos;)
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
      setError(null)
    } catch (error) {
      console.error('Erreur stories:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

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

      if (!response.ok) throw new Error(&apos;Erreur lors de la création de la story&apos;)
      
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