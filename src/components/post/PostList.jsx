'use client'

import { useState, useEffect } from 'react'
import Post from './Post'
import styles from './PostList.module.css'

export default function PostList({ userId }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // console.log('PostList mounted with userId:', userId)
    fetchPosts()
  }, [userId])

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const url = userId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/${userId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/posts/feed`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }

      const data = await response.json()
      
      // Traiter les données pour s'assurer que les commentaires sont correctement formatés
      const processedPosts = (userId ? data.posts : data).map(post => ({
        ...post,
        comments: post.comments?.map(comment => ({
          ...comment,
          user: comment.user || {
            _id: comment.userId,
            username: 'Utilisateur inconnu',
            avatar: null
          }
        })) || []
      }))

      setPosts(processedPosts)
      setError(null)
    } catch (err) {
      console.error('Error fetching posts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePostUpdate = () => {
    console.log('Post updated, refreshing posts...')
    fetchPosts()
  }

  if (loading) {
    return <div className={styles.loading}>Chargement des posts...</div>
  }

  if (error) {
    return <div className={styles.error}>Erreur: {error}</div>
  }

  if (!posts || posts.length === 0) {
    return <div className={styles.noPosts}>Aucun post à afficher</div>
  }

  return (
    <div className={styles.postList}>
      {posts.map(post => (
        <Post 
          key={post._id} 
          post={post}
          onPostUpdate={handlePostUpdate}
        />
      ))}
    </div>
  )
}