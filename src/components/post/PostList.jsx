'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Post from './Post'
import styles from './PostList.module.css'
import PostInteractionModal from '../modals/PostInteractionModal'
import { getImageUrl } from '@/utils/constants';

export default function PostList({ userId, onPostClick, scrollToPostId, shouldScrollToPost }) {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedCommentId, setSelectedCommentId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const postsRef = useRef({})

  useEffect(() => {
    const fetchPosts = async () => {
      console.log('PostList - Début du chargement des posts');
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('PostList - Pas de token');
          return;
        }

        // Utiliser l'URL appropriée en fonction de si on est sur un profil ou sur le feed
        const url = userId 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/posts/user/${userId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/posts/feed`;

        console.log('PostList - URL de récupération:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('PostList - Statut de la réponse:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch posts');
        }

        const data = await response.json();
        console.log('PostList - Posts reçus:', data);

        // Nettoyer les URLs des images dans les posts
        const cleanedPosts = data.map(post => {
          console.log('PostList - Traitement du post:', post._id);
          const cleanedPost = { ...post };

          if (post.image) {
            console.log('PostList - Image originale:', post.image);
            cleanedPost.image = getImageUrl(post.image);
            console.log('PostList - Image nettoyée:', cleanedPost.image);
          }

          if (post.user?.avatar) {
            console.log('PostList - Avatar original:', post.user.avatar);
            cleanedPost.user = {
              ...post.user,
              avatar: getImageUrl(post.user.avatar)
            };
            console.log('PostList - Avatar nettoyé:', cleanedPost.user.avatar);
          }

          return cleanedPost;
        });

        console.log('PostList - Posts nettoyés:', cleanedPosts);
        setPosts(cleanedPosts);
      } catch (error) {
        console.error('PostList - Erreur:', error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [userId]);

  useEffect(() => {
    if (scrollToPostId && posts.length > 0) {
      // Attendre que le DOM soit mis à jour
      setTimeout(() => {
        const postElement = document.getElementById(`post-${scrollToPostId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [posts, scrollToPostId]);

  useEffect(() => {
    if (shouldScrollToPost && posts.length > 0) {
      const scrollInfo = sessionStorage.getItem('scrollToPost');
      if (scrollInfo) {
        const { postId, commentId, openModal } = JSON.parse(scrollInfo);
        sessionStorage.removeItem('scrollToPost'); // Nettoyer après utilisation

        if (postId) {
          // Attendre que le DOM soit mis à jour
          setTimeout(() => {
            const postElement = document.getElementById(`post-${postId}`);
            if (postElement) {
              postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);

          if (openModal) {
            handlePostClick(postId, commentId);
          }
        }
      }
    }
  }, [posts, shouldScrollToPost]);

  const handlePostClick = useCallback((postId, commentId = null) => {
    setSelectedPost(postId);
    setSelectedCommentId(commentId);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedPost(null);
    setSelectedCommentId(null);
  }, []);

  const handlePostUpdate = useCallback(() => {
    console.log('Post updated, refreshing posts...')
    fetchPosts();
  }, []);

  if (isLoading) {
    return <div className={styles.loading}>Chargement des posts...</div>
  }

  if (posts.length === 0) {
    return <div className={styles.noPosts}>Aucun post à afficher</div>
  }

  return (
    <div className={styles.postList}>
      {posts.map((post) => (
        <div
          key={post._id}
          id={`post-${post._id}`}
          ref={(el) => (postsRef.current[post._id] = el)}
          className={styles.postContainer}
        >
          <Post 
            key={post._id} 
            post={post}
            onPostClick={() => handlePostClick(post._id)}
            onPostUpdate={handlePostUpdate}
          />
        </div>
      ))}

      {showModal && selectedPost && (
        <PostInteractionModal
          postId={selectedPost}
          onClose={handleCloseModal}
          highlightCommentId={selectedCommentId}
        />
      )}
    </div>
  )
}