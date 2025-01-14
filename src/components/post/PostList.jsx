'use client'

import { useState, useEffect, useCallback } from 'react'
import Post from './Post'
import styles from './PostList.module.css'

export default function PostList({ userId }) {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Utiliser l'URL appropriée en fonction de si on est sur un profil ou sur le feed
      const url = userId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/posts/user/${userId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/posts/feed`;

      console.log("Fetching posts from:", url); // Debug log

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch posts');
      }

      const data = await response.json();
      console.log("Posts fetched:", data); // Debug log
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [userId]);

  const handlePostUpdate = () => {
    console.log('Post updated, refreshing posts...')
    fetchPosts();
  }

  if (isLoading) {
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