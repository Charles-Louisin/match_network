'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { BsPlusCircleFill } from 'react-icons/bs';
import styles from './Stories.module.css';
import CreateStoryModal from './CreateStoryModal';
import StoryModal from './StoryModal';
import toast from 'react-hot-toast'; // Importer la bibliothèque de toast

const getMediaUrl = (path) => {
  if (!path) return '/images/default-cover.jpg';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
};

const StoriesList = ({ stories, currentUser }) => {
  console.log('Stories reçues:', stories);
  console.log('Current user:', currentUser);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewedStories, setViewedStories] = useState(() => {
    try {
      const saved = localStorage.getItem('viewedStories');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sauvegarder les stories vues dans le localStorage
  useEffect(() => {
    localStorage.setItem('viewedStories', JSON.stringify(viewedStories));
  }, [viewedStories]);

  // Marquer une story comme vue
  const markStoryAsViewed = useCallback((storyId) => {
    setViewedStories(prev => ({
      ...prev,
      [storyId]: true
    }));
  }, []);

  // Calculer le nombre de stories non vues pour un utilisateur
  const getUnviewedCount = useCallback((userStories) => {
    return userStories.reduce((count, story) => {
      return count + (viewedStories[story._id] ? 0 : 1);
    }, 0);
  }, [viewedStories]);

  // Trier les stories pour mettre celles de l'utilisateur en premier
  const sortedStories = useMemo(() => {
    if (!stories || !currentUser) return stories;
    
    return [...stories].sort((a, b) => {
      const isACurrentUser = a.user._id === currentUser.id;
      const isBCurrentUser = b.user._id === currentUser.id;
      
      if (isACurrentUser && !isBCurrentUser) return -1;
      if (!isACurrentUser && isBCurrentUser) return 1;
      return 0;
    });
  }, [stories, currentUser]);

  // Grouper les stories par utilisateur
  const storiesByUser = useMemo(() => {
    if (!sortedStories) return new Map();
    
    const groupedStories = new Map();
    sortedStories.forEach(story => {
      if (!story || !story.user || !story.user._id) return; // Ignorer les stories invalides
      
      const userId = story.user._id;
      if (!groupedStories.has(userId)) {
        groupedStories.set(userId, {
          user: story.user,
          stories: []
        });
      }
      groupedStories.get(userId).stories.push(story);
    });
    
    return groupedStories;
  }, [sortedStories]);

  // Trier les stories pour avoir les non vues en premier
  const sortedStoriesByUser = useMemo(() => {
    if (!storiesByUser) return [];

    return Array.from(storiesByUser.values()).sort((a, b) => {
      const aUnviewed = getUnviewedCount(a.stories);
      const bUnviewed = getUnviewedCount(b.stories);
      return bUnviewed - aUnviewed;
    });
  }, [storiesByUser, getUnviewedCount]);

  const handleCreateStory = async (data) => {
    console.log('=== DÉBUT UPLOAD STORY ===');
    console.log('Données reçues du CreateStoryModal:', data);
    setIsUploading(true);
    setShowCreateModal(false); // Fermer le modal immédiatement
    
    // Afficher le toast de chargement
    toast.loading('Création de votre story...', {
      duration: 3000,
      position: 'bottom-center',
    });

    try {
      console.log('Vérification de l\'authentification');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour créer une story');
      }

      // Déterminer le type de story
      const isTextStory = data.type === 'text';
      const endpoint = isTextStory ? 'text' : 'media';
      console.log('Type de story:', isTextStory ? 'texte' : 'média');

      // Préparer la requête
      let requestBody;
      let headers = {
        'Authorization': `Bearer ${token}`
      };

      if (isTextStory) {
        console.log('Préparation requête story texte');
        requestBody = JSON.stringify(data);
        headers['Content-Type'] = 'application/json';
        console.log('Données à envoyer:', data);
      } else {
        console.log('Préparation requête story média');
        requestBody = data; // data est déjà un FormData
        console.log('FormData préparé');
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/stories/${endpoint}`;
      console.log('URL de la requête:', url);
      console.log('Headers:', headers);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: requestBody
      });

      const responseData = await response.json();
      console.log('Réponse du serveur:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Erreur lors de la création de la story');
      }

      console.log('Story créée avec succès:', responseData);
      console.log('=== FIN UPLOAD STORY ===');
      
      // Afficher le toast de succès
      toast.success('Story créée avec succès !', {
        duration: 2000,
        position: 'bottom-center',
      });
      
      // Recharger la page
      window.location.reload();

    } catch (error) {
      console.error('Erreur lors de la création de la story:', error);
      console.error('Stack trace:', error.stack);
      
      // Afficher le toast d'erreur
      toast.error(error.message || 'Erreur lors de la création de la story', {
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStoryProgress = (story) => {
    const totalItems = story.stories?.length || 1;
    const seenItems = story.stories?.filter(item => 
      item.views?.some(view => view._id === currentUser?.id)
    ).length || 0;
    
    return { total: totalItems, seen: seenItems };
  };

  const handleNavigateToProfile = useCallback((userId) => {
    window.location.href = `/profile/${userId}`;
  }, []);

  // Vérifier si toutes les stories d'un utilisateur ont été vues
  const areAllStoriesViewed = useCallback((userStories) => {
    if (!currentUser || !userStories) return false;
    return userStories.every(story => {
      // Vérifier si viewers existe et n'est pas null/undefined
      if (!story || !story.viewers) return false;
      return story.viewers.some(viewer => viewer._id === currentUser.id);
    });
  }, [currentUser]);

  return (
    <div className={styles.storiesContainer}>
      {currentUser && (
        <button
          className={styles.storyButton}
          onClick={() => setShowCreateModal(true)}
        >
          <div className={styles.createStoryPreview}>
            <div className={styles.createStoryPreviewInner}>
              <Image
                src={getMediaUrl(currentUser?.avatar)}
                alt={currentUser.username}
                width={80}
                height={80}
                className={styles.userAvatarList}
              />
              <div className={styles.plusIcon}>
                <BsPlusCircleFill size={20} />
              </div>
            </div>
          </div>
          <span className={styles.storyUsername}>
            Créer une story
          </span>
        </button>
      )}

      {sortedStoriesByUser.map(({ user, stories: userStories }, index) => {
        const unviewedCount = getUnviewedCount(userStories);
        return (
          <button
            key={user._id}
            className={styles.storyButton}
            onClick={() => {
              const firstStoryIndex = sortedStories.findIndex(s => s.user._id === user._id);
              setSelectedStoryIndex(firstStoryIndex);
            }}
          >
            <div className={`${styles.storyPreview} ${user._id === currentUser?.id ? styles.currentUserStory : styles.friendStory}`}>
              <div className={styles.storyPreviewInner}>
                <Image
                  src={getMediaUrl(user.avatar)}
                  alt={user.username}
                  width={80}
                  height={80}
                  className={styles.userAvatarList}
                />
              </div>
            </div>
            <span className={styles.storyUsername}>
              {user.username}
            </span>
          </button>
        );
      })}

      <AnimatePresence>
        {showCreateModal && (
          <CreateStoryModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateStory}
            isUploading={isUploading}
          />
        )}
        {selectedStoryIndex !== null && (
          <StoryModal
            stories={sortedStories[selectedStoryIndex]?.stories || []}
            currentIndex={0}
            onClose={() => setSelectedStoryIndex(null)}
            currentUser={currentUser}
            onNavigateToProfile={handleNavigateToProfile}
            onStoryViewed={markStoryAsViewed}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoriesList;
