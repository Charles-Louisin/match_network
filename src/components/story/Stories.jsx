'use client';

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FaPlus } from 'react-icons/fa';
import styles from "./Stories.module.css";
import { toast } from "react-hot-toast";

const Stories = () => {
  const [isClient, setIsClient] = useState(false);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const userStr = window.localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
    fetchStories();
  }, []);

  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  };

  const fetchStories = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error('Vous devez être connecté pour voir les stories');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du chargement des stories');
      }

      const data = await response.json();

      setStories([
        {
          id: 'create',
          user: {
            name: 'Vous',
            image: user?.avatar || '/images/default-avatar.jpg'
          },
          isCreate: true
        },
        ...data.map(story => ({
          id: story.id,
          username: story.user.username,
          image: story.image,
          userImage: story.user.avatar,
          hasStory: story.hasStory
        }))
      ]);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleCreateStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = window.localStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour créer une story');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Erreur lors de la création de la story');

      toast.success('Story créée avec succès');
      fetchStories();
    } catch (error) {
      console.error(error.message);
      toast.error(error.message);
    }
  };

  const handleViewStory = (story) => {
    // Implement story viewing logic here
  };

  if (!isClient) {
    return null;
  }

  if (error) return <div className={styles.error}>{error}</div>;
  if (loading) return <div className={styles.loading}>Chargement...</div>;

  return (
    <div className={styles.storiesContainer}>
      <div className={styles.storiesList}>
        {stories.map((story) => (
          <div key={story.id} className={styles.storyItem}>
            {story.isCreate ? (
              <>
                <div className={styles.storyAvatarWrapper}>
                  <Image
                    src={getImageUrl(user?.avatar)}
                    alt="Votre story"
                    width={85}
                    height={85}
                    className={styles.storyAvatar}
                  />
                  <label htmlFor="storyUpload" className={styles.addStoryButton}>
                    <FaPlus />
                  </label>
                  <input
                    type="file"
                    id="storyUpload"
                    accept="image/*"
                    onChange={handleCreateStory}
                    style={{ display: 'none' }}
                  />
                </div>
                <span className={styles.storyUsername}>Creez une story</span>
              </>
            ) : (
              <>
                <div className={styles.storyAvatarWrapper}>
                  <Image
                    src={getImageUrl(story.userImage)}
                    alt={story.username}
                    width={85}
                    height={85}
                    className={styles.storyAvatar}
                    onClick={() => handleViewStory(story)}
                  />
                </div>
                <span className={styles.storyUsername}>{story.username}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;