import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AiOutlineClose, AiOutlineHeart, AiFillHeart, AiOutlineEye } from 'react-icons/ai';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import styles from './Stories.module.css';

const STORY_DURATION = 5000; // 5 secondes par story

const getMediaUrl = (path) => {
  if (!path) return '/images/default-cover.jpg';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
};

const StoryModal = ({ stories, currentIndex = 0, onClose, currentUser, onNavigateToProfile }) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [progress, setProgress] = useState(0);
  const [storyData, setStoryData] = useState(stories);
  const [liked, setLiked] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);

  const currentStory = storyData[activeIndex];
  const isCurrentUser = currentStory?.user?._id === currentUser?.id;
  const videoRef = useRef(null);

  useEffect(() => {
    if (!currentStory) return;

    setProgress(0);
    setLiked(currentStory.likes?.some?.(like => like?._id === currentUser?.id) || false);
    setViewCount(currentStory.viewers?.length || 0);
    setLikeCount(currentStory.likes?.length || 0);
    setIsLoading(currentStory.type === 'video');
    setVideoDuration(null);

    let timer;
    if (!isPaused) {
      const duration = currentStory.type === 'video' ? videoDuration : STORY_DURATION;
      if (duration) {
        timer = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              if (activeIndex < storyData.length - 1) {
                setActiveIndex(activeIndex + 1);
                return 0;
              } else {
                clearInterval(timer);
                onClose();
                return 100;
              }
            }
            return prev + (100 / (duration / 100));
          });
        }, 100);
      }
    }

    return () => clearInterval(timer);
  }, [activeIndex, currentStory, storyData.length, onClose, currentUser, isCurrentUser, isPaused, videoDuration]);

  useEffect(() => {
    if (showLikes || showViews) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  }, [showLikes, showViews]);

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories/${currentStory._id}/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const updatedStory = await response.json();
        setStoryData(prevStories => {
          const newStories = [...prevStories];
          newStories[activeIndex] = updatedStory;
          return newStories;
        });
        setLiked(!liked);
        setLikeCount(updatedStory.likes?.length || 0);
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  const handleNext = useCallback(() => {
    if (activeIndex < storyData.length - 1) {
      setActiveIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [activeIndex, storyData.length, onClose]);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [activeIndex]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrev, onClose]);

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (showLikes || showViews) {
      setShowLikes(false);
      setShowViews(false);
    }
  };

  const toggleLikes = (e) => {
    e.stopPropagation();
    setShowViews(false);
    setShowLikes(!showLikes);
  };

  const toggleViews = (e) => {
    e.stopPropagation();
    setShowLikes(false);
    setShowViews(!showViews);
  };

  if (!currentStory) return null;

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.storyModalContent}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={styles.progressContainer}>
          {storyData.map((_, index) => (
            <div key={index} className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: index === activeIndex ? `${progress}%` : 
                         index < activeIndex ? '100%' : '0%'
                }}
              />
            </div>
          ))}
        </div>

        <div className={styles.userInfo}>
          <Image
            src={getMediaUrl(currentStory.user?.avatar)}
            alt={currentStory.user?.username}
            width={40}
            height={40}
            className={styles.userAvatar}
          />
          <div className={styles.userDetails}>
            <span className={styles.username}>{currentStory.user?.username}</span>
            <span className={styles.storyTime}>
              {formatDistanceToNow(new Date(currentStory.createdAt), {
                addSuffix: true,
                locale: fr
              })}
            </span>
          </div>
        </div>

        <button className={styles.closeButton} onClick={onClose}>
          <AiOutlineClose size={24} />
        </button>

        <div className={styles.mediaContainer} onClick={handleImageClick}>
          {currentStory.type === 'text' ? (
            <div className={styles.storyContainer}>
              <div 
                className={styles.textContent}
                style={{ 
                  background: currentStory.textContent?.background || '#000000',
                  color: currentStory.textContent?.color || '#ffffff'
                }}
              >
                <span className={styles.textWrapper}>
                  {currentStory.textContent?.text}
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.mediaContainer}>
              {currentStory.type === 'video' ? (
                <div>
                  {isLoading && (
                    <div className={styles.loader}>
                      <div className={styles.spinner}></div>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    src={getMediaUrl(currentStory.media)}
                    className={styles.storyMedia}
                    autoPlay
                    playsInline
                    muted={false}
                    onLoadedMetadata={(e) => {
                      const video = e.target;
                      setVideoDuration(video.duration * 1000); // Convertir en millisecondes
                      video.play();
                    }}
                    onLoadStart={() => setIsLoading(true)}
                    onCanPlay={() => {
                      setIsLoading(false);
                      setIsPaused(false);
                    }}
                    onPlay={() => {
                      setIsPaused(false);
                    }}
                    onPause={() => {
                      setIsPaused(true);
                    }}
                    onEnded={() => {
                      setIsPaused(false);
                      handleNext();
                    }}
                  />
                  {currentStory.caption && (
                    <div className={styles.caption}>
                      {currentStory.caption}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.mediaContainer}>
                  <Image
                    src={getMediaUrl(currentStory.media)}
                    alt="Story media"
                    fill
                    className={styles.storyMedia}
                    priority
                    unoptimized
                  />
                  {currentStory.caption && (
                    <div className={styles.caption}>
                      {currentStory.caption}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.storyActions}>
          {isCurrentUser && (
            <>
              <button className={styles.actionButton} onClick={toggleViews}>
                <div className={styles.actionItem}>
                  <AiOutlineEye size={24} />
                  <span>{viewCount}</span>
                </div>
              </button>
              <button className={styles.actionButton} onClick={toggleLikes}>
                {liked ? <AiFillHeart size={24} color="red" /> : <AiOutlineHeart size={24} />}
                <span>{likeCount}</span>
              </button>
            </>
          )}
          {!isCurrentUser && (
            <button 
              className={styles.actionButton}
              onClick={handleLike}
            >
              <div className={styles.actionItem}>
                {liked ? (
                  <AiFillHeart size={24} className={styles.likedIcon} />
                ) : (
                  <AiOutlineHeart size={24} />
                )}
              </div>
            </button>
          )}
        </div>

        {activeIndex > 0 && (
          <button className={`${styles.navButton} ${styles.prevButton}`} onClick={handlePrev}>
            <BsChevronLeft size={24} />
          </button>
        )}
        {activeIndex < storyData.length - 1 && (
          <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleNext}>
            <BsChevronRight size={24} />
          </button>
        )}

        <AnimatePresence>
          {showViews && (
            <ViewersModal
              viewers={currentStory.viewers}
              onClose={() => setShowViews(false)}
              onNavigateToProfile={onNavigateToProfile}
            />
          )}
          {showLikes && (
            <LikesModal
              likes={currentStory.likes}
              onClose={() => setShowLikes(false)}
              onNavigateToProfile={onNavigateToProfile}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const ViewersModal = ({ viewers = [], onClose, onNavigateToProfile }) => {
  return (
    <motion.div
      className={styles.interactionModalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>Vues</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <AiOutlineClose size={20} />
          </button>
        </div>
        <div className={styles.modalList}>
          {!viewers || viewers.length === 0 ? (
            <div className={styles.emptyState}>
              Aucune vue pour le moment
            </div>
          ) : (
            viewers.map(viewer => {
              if (!viewer || !viewer._id) return null;
              return (
                <div key={viewer._id} className={styles.modalItem} onClick={() => onNavigateToProfile(viewer._id)}>
                  <div className={styles.modalItemLeft}>
                    <Image
                      src={getMediaUrl(viewer.avatar)}
                      alt={viewer.username || 'Utilisateur'}
                      width={44}
                      height={44}
                      className={styles.modalAvatar}
                    />
                    <div className={styles.modalItemInfo}>
                      <span className={styles.modalItemUsername}>{viewer.username || 'Utilisateur'}</span>
                      <span className={styles.modalItemTime}>
                        {formatDistanceToNow(new Date(viewer.viewedAt || viewer.createdAt || new Date()), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const LikesModal = ({ likes = [], onClose, onNavigateToProfile }) => {
  return (
    <motion.div
      className={styles.interactionModalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>J&apos;aime</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <AiOutlineClose size={20} />
          </button>
        </div>
        <div className={styles.modalList}>
          {!likes || likes.length === 0 ? (
            <div className={styles.emptyState}>
              Aucun j&apos;aime pour le moment
            </div>
          ) : (
            likes.map(like => {
              if (!like || !like._id) return null;
              return (
                <div key={like._id} className={styles.modalItem} onClick={() => onNavigateToProfile(like._id)}>
                  <div className={styles.modalItemLeft}>
                    <Image
                      src={getMediaUrl(like.avatar)}
                      alt={like.username || 'Utilisateur'}
                      width={44}
                      height={44}
                      className={styles.modalAvatar}
                    />
                    <div className={styles.modalItemInfo}>
                      <span className={styles.modalItemUsername}>{like.username || 'Utilisateur'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StoryModal;
