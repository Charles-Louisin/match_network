'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Post from './Post'
import styles from './PostList.module.css'
import PostInteractionModal from '../modals/PostInteractionModal'

export default function PostList({ userId, onPostClick, scrollToPostId, shouldScrollToPost }) {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedCommentId, setSelectedCommentId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const postsRef = useRef({})

  useEffect(() => {
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
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

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