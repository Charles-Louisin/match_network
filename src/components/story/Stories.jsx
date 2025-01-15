import React from 'react';
import Image from 'next/image';
import { FaPlus } from 'react-icons/fa';
import styles from './Stories.module.css';

const Stories = () => {
  const [stories, setStories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchStories = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour voir les stories');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
          hasStory: story.hasStory
        }))
      ]);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Vous devez être connecté pour voir les stories');
    }
    fetchStories();
  }, [fetchStories]);

  const handleCreateStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5000/api/stories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Erreur lors de la création de la story');

      fetchStories(); // Rafraîchir les stories
    } catch (error) {
      console.error(error.message);
    }
  };

  if (error) return <div className={styles.error}>{error}</div>;
  if (loading) return <div className={styles.loading}>Chargement...</div>;

  return (
    <div className={styles.storiesContainer}>
      {/* Create Story Button */}
      <div className={styles.storyItem}>
        <div className={styles.createStoryContainer}>
          <Image
            src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : '/images/default-avatar.jpg'}
            alt="Votre photo"
            width={80}
            height={80}
            className={styles.storyImage}
          />
          <div className={styles.plusIconOverlay}>
            <FaPlus className={styles.plusIcon} />
            <input
              type="file"
              accept="image/*"
              onChange={handleCreateStory}
              hidden
            />
          </div>
        </div>
        <span className={styles.createStoryText}>Créer une story</span>
      </div>

      {/* Story Items */}
      {stories.map((story) => (
        <div key={story.id} className={styles.storyItem}>
          {story.isCreate ? (
            <div className={styles.createStoryContainer}>
              <Image
                src={story.user.image ? `${process.env.NEXT_PUBLIC_API_URL}${story.user.image}` : '/images/default-avatar.jpg'}
                alt={story.user.name}
                width={80}
                height={80}
                className={styles.storyImage}
              />
            </div>
          ) : (
            <div className={`${styles.storyImageContainer} ${!story.hasStory && styles.noStory}`}>
              <Image
                src={story.image}
                alt={story.username}
                width={80}
                height={80}
                className={styles.storyImage}
              />
            </div>
          )}
          <span className={styles.username}>{story.isCreate ? 'Vous' : story.username}</span>
        </div>
      ))}
    </div>
  );
};

export default Stories;