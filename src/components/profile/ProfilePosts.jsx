"use client";
import { useState, useEffect } from 'react';
import Post from '../post/Post';
import styles from '@/styles/components/ProfilePosts.module.css';
import { toast } from 'sonner';

export default function ProfilePosts({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Token non trouvé');
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/posts/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de la récupération des posts');
        }

        const data = await response.json();
        console.log('Posts reçus:', data);

        if (Array.isArray(data)) {
          // S'assurer que chaque post a les informations de l'utilisateur
          const postsWithUser = data.map(post => ({
            ...post,
            user: post.user || {
              _id: userId,
              username: post.username || 'Utilisateur',
              avatar: post.avatar || '/images/default-avatar.jpg'
            }
          }));
          setPosts(postsWithUser);
        } else {
          console.error('Format de données invalide:', data);
          setPosts([]);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError(error.message);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserPosts();
    }
  }, [userId]);

  if (loading) {
    return <div className={styles.loading}>Chargement des posts...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (posts.length === 0) {
    return <div className={styles.noPosts}>Aucun post à afficher</div>;
  }

  return (
    <div className={styles.posts}>
      {posts.map((post) => (
        <Post 
          key={post._id} 
          post={post}
          onPostUpdate={() => {
            // Recharger les posts après une mise à jour
            fetchUserPosts();
          }}
        />
      ))}
    </div>
  );
}