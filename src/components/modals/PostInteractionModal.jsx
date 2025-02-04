'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaThumbsUp, FaTimes, FaReply, FaComment } from 'react-icons/fa'
import TimeAgo from 'timeago-react'
import * as timeago from 'timeago.js'
import fr from 'timeago.js/lib/lang/fr'
import styles from './PostInteractionModal.module.css'
import { toast } from 'react-hot-toast'

// Enregistrer le français comme langue
timeago.register('fr', fr)

const PostInteractionModal = ({
  isOpen,
  onClose,
  postId,
  currentUser,
  initialTab = 'likes',
  onPostUpdate,
  initialComments = [],
  initialLikes = [],
  highlightCommentId
}) => {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [likes, setLikes] = useState([])
  const [comments, setComments] = useState(initialComments)
  const [isLoading, setIsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [tagPosition, setTagPosition] = useState(0)
  const [friends, setFriends] = useState([])
  const [selectedFriends, setSelectedFriends] = useState([])
  const [isTagModalVisible, setIsTagModalVisible] = useState(false)
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [selectedCommentLikes, setSelectedCommentLikes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const textareaRef = useRef(null)
  const [post, setPost] = useState(null)
  const [currentUserData, setCurrentUserData] = useState(null)
  const highlightedCommentRef = useRef(null)

  // Charger l'utilisateur depuis le localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = window.localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.log('User data loaded:', userData);
          setCurrentUserData(userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
  }, []);

  // Mettre à jour currentUserData quand currentUser change aussi
  useEffect(() => {
    if (currentUser) {
      setCurrentUserData(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (response.ok) {
          const userData = await response.json()
          setCurrentUserData(userData)
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error)
      }
    }

    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
      setComments(initialComments)
      fetchData()
    }
  }, [isOpen, postId, initialTab, initialComments])

  useEffect(() => {
    if (highlightCommentId) {
      setActiveTab('comments');
      
      // Attendre que les commentaires soient chargés et le DOM mis à jour
      setTimeout(() => {
        const commentElement = document.getElementById(`comment-${highlightCommentId}`);
        if (commentElement) {
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          commentElement.classList.add(styles.highlighted);
          setTimeout(() => {
            commentElement.classList.remove(styles.highlighted);
          }, 2000);
        }
      }, 500);
    }
  }, [highlightCommentId]);

  const autoResizeTextarea = (ref) => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }

  useEffect(() => {
    autoResizeTextarea(textareaRef)
  }, [newComment])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Token d\'authentification manquant')

      console.log('Chargement des données du post:', postId)
      const postResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!postResponse.ok) throw new Error(`Erreur lors du chargement du post: ${postResponse.status}`)

      const postData = await postResponse.json()
      console.log('Données du post reçues:', postData)
      setPost(postData)
      setComments(postData.comments || [])

      // Pré-charger les données utilisateur pour les commentaires
      const userIds = new Set([
        ...postData.comments.map(comment => comment.user._id),
      ])

      // Charger les données utilisateur en parallèle
      const userPromises = Array.from(userIds).map(async userId => {
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const userData = await userResponse.json()
        return { userId, userData }
      })

      const userResults = await Promise.all(userPromises)
      const newUserCache = {}
      userResults.forEach(({ userId, userData }) => {
        newUserCache[userId] = userData
      })

      // Fetch likes
      if (postData.likes && Array.isArray(postData.likes) && postData.likes.length > 0) {
        console.log('Fetching user details for likes:', postData.likes)
        const usersPromises = postData.likes.map(async (like) => {
          try {
            const userId = typeof like === 'object' ? like.userId : like
            console.log('Fetching user details for ID:', userId)
            const userResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/${userId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )
            if (!userResponse.ok) {
              console.error(`Erreur pour l'utilisateur ${userId}:`, userResponse.status)
              const errorText = await userResponse.text()
              console.error('Error response text:', errorText)
              try {
                const errorJson = JSON.parse(errorText)
                console.error('Error response JSON:', errorJson)
              } catch (e) {
                console.error('Could not parse error as JSON')
              }
              return {
                _id: userId,
                username: "Utilisateur inconnu",
                avatar: "/images/default-avatar.jpg"
              }
            }
            const userData = await userResponse.json()
            console.log('User data received:', userData)
            return userData
          } catch (error) {
            console.error('Error fetching user:', error)
            return {
              _id: userId,
              username: "Utilisateur inconnu",
              avatar: "/images/default-avatar.jpg"
            }
          }
        })

        const usersData = await Promise.all(usersPromises)
        console.log('All users data:', usersData)
        const validUsers = usersData
          .filter(user => user !== null)
          .map(user => ({
            _id: user._id,
            username: user.username,
            avatar: user.avatar
          }))
        console.log('Valid users:', validUsers)
        setLikes(validUsers)
      } else {
        console.log('No likes found or invalid likes array')
        setLikes([])
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  // Charger les amis
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('Pas de token trouvé')
          return
        }

        console.log('Chargement des amis...')
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/friends/list`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (!response.ok) {
          const text = await response.text()
          console.error('Erreur lors du chargement des amis:', response.status, text)
          return
        }

        const data = await response.json()
        console.log('Amis chargés:', data)
        
        // Formater les données des amis
        const formattedFriends = data.map(friend => ({
          _id: friend._id,
          username: friend.username,
          avatar: friend.avatar
        }))
        
        console.log('Amis formatés:', formattedFriends)
        setFriends(formattedFriends)
      } catch (error) {
        console.error('Erreur lors du chargement des amis:', error)
      }
    }

    if (isOpen && currentUserData) {
      fetchFriends()
    }
  }, [isOpen, currentUserData])

  // Animation du modal
  useEffect(() => {
    if (showTagModal) {
      // Petit délai pour l'animation
      setTimeout(() => setIsTagModalVisible(true), 50)
    } else {
      setIsTagModalVisible(false)
    }
  }, [showTagModal])

  // Filtrer les amis basé sur la recherche
  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Extraire les mentions du texte
  const extractMentions = (text) => {
    const matches = text.match(/@\{([^}]+)\}/g) || [];
    return matches.map(match => match.slice(2, -1));
  };

  // Créer une notification
  const createNotification = async (notifData, token) => {
    try {
      console.log('Envoi des données de notification:', notifData);
      const notifResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(notifData),
        }
      );

      if (!notifResponse.ok) {
        const error = await notifResponse.json();
        console.error('Erreur lors de la création de la notification:', error);
        return false;
      }
      
      console.log('Notification créée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return false;
    }
  };

  // Gérer la saisie de commentaire
  const handleCommentChange = (e) => {
    const value = e.target.value
    setNewComment(value)
    
    // Détecter quand @ est tapé
    if (value.charAt(e.target.selectionStart - 1) === '@') {
      console.log('@ détecté à la position:', e.target.selectionStart - 1)
      setTagPosition(e.target.selectionStart - 1)
      setShowTagModal(true)
    }
  }

  // Gérer la sélection d'amis dans le modal
  const handleFriendSelect = (friend) => {
    console.log('Sélection d\'ami:', friend)
    setSelectedFriends(prev => {
      const isAlreadySelected = prev.find(f => f._id === friend._id)
      if (isAlreadySelected) {
        return prev.filter(f => f._id !== friend._id)
      }
      return [...prev, friend]
    })
  }

  // Insérer les tags sélectionnés
  const handleTagsConfirm = () => {
    console.log('Confirmation des tags:', selectedFriends)
    const beforeTag = newComment.substring(0, tagPosition)
    const afterTag = newComment.substring(tagPosition + 1)
    
    const tags = selectedFriends
      .map(friend => `@{${friend.username}}`)
      .join(' ')
    
    const newValue = beforeTag + tags + ' ' + afterTag
    console.log('Nouveau commentaire:', newValue)
    
    setNewComment(newValue)
    setShowTagModal(false)
    setSelectedFriends([])
  }

  // Gérer la fermeture du modal de tag
  const handleCloseTagModal = (e) => {
    e.stopPropagation() // Empêcher la propagation vers le modal parent
    setShowTagModal(false)
    setSelectedFriends([])
  }

  // Afficher le modal des likes
  const handleShowLikes = async (commentId) => {
    try {
      const comment = comments.find(c => c._id === commentId)
      if (!comment || !comment.likes || comment.likes.length === 0) return

      const token = localStorage.getItem('token')
      const likesPromises = comment.likes.map(async userId => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        if (response.ok) {
          return await response.json()
        }
        return null
      })

      const likes = await Promise.all(likesPromises)
      setSelectedCommentLikes(likes.filter(Boolean))
      setShowLikesModal(true)
    } catch (error) {
      console.error('Erreur lors du chargement des likes:', error)
    }
  }

  // Publier un commentaire
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token || !currentUserData) {
        toast.error('Vous devez être connecté pour commenter');
        return;
      }

      const userData = {
        _id: currentUserData.id,
        username: currentUserData.username,
        avatar: currentUserData.avatar
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            content: newComment.trim(),
            userId: userData._id
          }),
        }
      );

      const newCommentData = await response.json();
      
      const commentWithUser = {
        ...newCommentData,
        user: userData,
        likes: [],
        createdAt: new Date().toISOString()
      };

      setComments(prevComments => [commentWithUser, ...prevComments]);
      setNewComment('');

      // Extraire les mentions du commentaire
      const mentions = extractMentions(newComment);
      console.log('Mentions trouvées:', mentions);
      
      // Créer des notifications pour chaque mention
      if (mentions.length > 0) {
        const mentionPromises = mentions.map(async (username) => {
          try {
            // Rechercher l'utilisateur mentionné
            const userResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/users/search?username=${username}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!userResponse.ok) {
              console.error('Erreur lors de la recherche de l\'utilisateur:', username);
              return;
            }
            
            const users = await userResponse.json();
            console.log('Utilisateurs trouvés:', users);
            const mentionedUser = users.find(u => u.username === username);
            
            if (mentionedUser && mentionedUser._id !== currentUserData.id) {
              await createNotification({
                type: 'COMMENT_MENTION',
                recipientId: mentionedUser._id,
                content: 'vous a mentionné dans un commentaire',
                reference: newCommentData._id,
                postId: postId,
                commentId: newCommentData._id,
                additionalData: {
                  commentContent: newComment.trim(),
                  postId: postId
                }
              }, token);
            } else {
              console.log('Utilisateur non trouvé ou auto-mention:', username);
            }
          } catch (error) {
            console.error('Erreur lors de la création de la notification pour', username, ':', error);
          }
        });

        await Promise.all(mentionPromises);
      }

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer le like d'un commentaire
  const handleLikeComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !currentUserData) {
        toast.error('Vous devez être connecté pour liker');
        return;
      }

      const commentToUpdate = comments.find(c => c._id === commentId);
      if (!commentToUpdate) {
        console.error('Commentaire non trouvé:', commentId);
        return;
      }

      const isCurrentlyLiked = commentToUpdate.likes?.includes(currentUserData?.id);
      const currentLikes = [...(commentToUpdate.likes || [])];

      // Mise à jour optimiste
      setComments(prevComments => 
        prevComments.map(c => 
          c._id === commentId 
            ? {
                ...c,
                likes: isCurrentlyLiked
                  ? currentLikes.filter(id => id !== currentUserData.id)
                  : [...currentLikes, currentUserData.id]
              }
            : c
        )
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments/${commentId}/like`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du like');
      }

      // Créer une notification si on ajoute un like
      if (!isCurrentlyLiked && commentToUpdate.user._id !== currentUserData.id) {
        await createNotification({
          type: 'COMMENT_LIKE',
          recipientId: commentToUpdate.user._id,
          content: 'a aimé votre commentaire',
          reference: commentToUpdate._id,
          postId: postId,
          commentId: commentId,
          additionalData: {
            commentContent: commentToUpdate.content,
            postId: postId
          }
        }, token);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
      
      // Rollback en cas d'erreur
      setComments(prevComments => 
        prevComments.map(c => 
          c._id === commentId 
            ? {
                ...c,
                likes: currentLikes
              }
            : c
        )
      );
    }
  };

  // Formater le contenu avec les tags en bleu
  const formatContent = (content) => {
    if (!content) return '';
    
    const parts = content.split(/(@\{[^}]+\})/g);
    return (
      <span className={styles.commentContent}>
        {parts.map((part, index) => {
          if (part.startsWith('@{') && part.endsWith('}')) {
            const username = part.slice(2, -1);
            const taggedUser = friends.find(f => f.username === username);
            return (
              <Link 
                key={index}
                href={`/profile/${taggedUser?._id || username}`}
                className={styles.taggedText}
                onClick={(e) => e.stopPropagation()}
              >
                @{username}
              </Link>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  // Formater le texte dans le champ de saisie
  const formatInputContent = (content) => {
    if (!content) return '';
    
    const parts = content.split(/(@\{[^}]+\})/g);
    return parts.map((part, index) => {
      if (part.startsWith('@{') && part.endsWith('}')) {
        const username = part.slice(2, -1);
        return (
          <span 
            key={index}
            className={styles.inputTaggedText}
          >
            @{username}
          </span>
        );
      }
      return part;
    });
  };

  // Trier les commentaires par date
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  }, [comments])

  // Formater le compteur de likes
  const formatLikeCount = (likes) => {
    if (!likes || likes.length === 0) return "0"
    
    const hasMyLike = likes.includes(currentUserData?.id)
    if (hasMyLike) {
      return likes.length > 1 
        ? `Vous et ${likes.length - 1} autre${likes.length > 2 ? 's' : ''}`
        : "Vous"
    }
    
    return likes.length.toString()
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tab} ${activeTab === 'likes' ? styles.active : ''}`}
              onClick={() => setActiveTab('likes')}
            >
              <FaThumbsUp className={styles.tabIcon} />
              <span className={styles.tabText}>
              {post?.likes?.length || 0}
                Likes
              </span>
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              <FaComment className={styles.tabIcon} />
              <span className={styles.tabText}>
              {comments.length}
                Commentaires
              </span>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>Chargement...</div>
          ) : activeTab === 'likes' ? (
            <div className={styles.likesList}>
              {console.log('Current likes state:', likes)}
              {!likes || likes.length === 0 ? (
                <div className={styles.emptyMessage}>Aucun like pour le moment</div>
              ) : (
                likes.map(user => {
                  console.log('Rendering user:', user)
                  return (
                    <Link
                      key={user._id}
                      href={`/profile/${user._id}`}
                      className={styles.userItem}
                    >
                      <Image
                        src={user.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : "/images/default-avatar.jpg"}
                        alt={user.username}
                        width={40}
                        height={40}
                        className={styles.userAvatar}
                      />
                      <span className={styles.username}>{user.username}</span>
                    </Link>
                  )
                })
              )}
            </div>
          ) : (
            <div className={styles.commentsSection}>
              <div className={styles.commentsContainer}>
                {sortedComments.map(comment => (
                  <div 
                    key={comment._id}
                    className={`${styles.comment} ${
                      comment._id === highlightCommentId ? styles.highlightedComment : ''
                    }`}
                    id={`comment-${comment._id}`}
                    ref={comment._id === highlightCommentId ? highlightedCommentRef : null}
                  >
                    <div className={styles.commentHeader}>
                      <Link
                        href={`/profile/${comment.user._id}`}
                        className={styles.userInfo}
                      >
                        <Image
                          src={comment.user.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${comment.user.avatar}` : "/images/default-avatar.jpg"}
                          alt={comment.user.username}
                          width={32}
                          height={32}
                          className={styles.commentAvatar}
                        />
                        <span className={styles.commentUsername}>
                          {comment.user.username}
                        </span>
                      </Link>
                      <TimeAgo
                        datetime={comment.createdAt}
                        locale='fr'
                        className={styles.timeAgo}
                      />
                    </div>
                    {formatContent(comment.content)}
                    <div className={styles.commentActions}>
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        className={`${styles.likeButton} ${comment.likes?.includes(currentUserData?.id) ? styles.liked : ''}`}
                      >
                        <FaThumbsUp />
                        <span>J&apos;aime</span>
                      </button>
                      {comment.likes?.length > 0 && (
                        <button
                          onClick={() => handleShowLikes(comment._id)}
                          className={`${styles.likeCounter} ${comment.likes?.includes(currentUserData?.id) ? styles.liked : ''}`}
                        >
                          <FaThumbsUp className={styles.icon} />
                          <span className={styles.count}>
                            {formatLikeCount(comment.likes)}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className={styles.commentForm}>
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={handleCommentChange}
                  placeholder="Ajouter un commentaire..."
                  className={styles.commentInput}
                  rows={1}
                >
                  {formatInputContent(newComment)}
                </textarea>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className={styles.submitButton}
                >
                  Publier
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal de sélection d'amis */}
      {showTagModal && (
        <div 
          className={`${styles.tagModal} ${isTagModalVisible ? styles.visible : ''}`}
          onClick={handleCloseTagModal}
        >
          <div 
            className={styles.tagModalContent}
            onClick={e => e.stopPropagation()} // Empêcher la fermeture quand on clique sur le contenu
          >
            <h3>Taguer des amis</h3>
            <div className={styles.searchContainer}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un ami..."
                className={styles.searchInput}
              />
            </div>
            <div className={styles.friendsList}>
              {filteredFriends.length === 0 ? (
                <div className={styles.emptyMessage}>
                  Aucun ami trouvé
                </div>
              ) : (
                filteredFriends.map(friend => (
                  <div 
                    key={friend._id}
                    className={styles.friendItem}
                  >
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedFriends.some(f => f._id === friend._id)}
                        onChange={() => handleFriendSelect(friend)}
                      />
                      <Image
                        src={friend.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${friend.avatar}` : "/images/default-avatar.jpg"}
                        alt={friend.username}
                        width={24}
                        height={24}
                        className={styles.friendAvatar}
                      />
                      <span>{friend.username}</span>
                    </label>
                  </div>
                ))
              )}
            </div>
            <div className={styles.tagModalButtons}>
              <button 
                onClick={handleCloseTagModal}
                className={styles.cancelButton}
              >
                Annuler
              </button>
              <button 
                onClick={handleTagsConfirm}
                className={styles.confirmButton}
                disabled={selectedFriends.length === 0}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal des likes */}
      {showLikesModal && (
        <div className={styles.commentOverlay} onClick={(e) => e.stopPropagation()}>
          <div className={styles.likesModal}>
            <div className={styles.likesModalHeader}>
              <button 
                onClick={() => setShowLikesModal(false)}
                className={styles.backButton}
              >
                <FaTimes />
              </button>
              <span className={styles.likesModalTitle}>J&apos;aime</span>
            </div>
            <div className={styles.likesList}>
              {selectedCommentLikes.map(user => (
                <Link
                  key={user._id}
                  href={`/profile/${user._id}`}
                  className={styles.likeItem}
                >
                  <Image
                    src={user.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : "/images/default-avatar.jpg"}
                    alt={user.username}
                    width={40}
                    height={40}
                    className={styles.likeUserAvatar}
                  />
                  <span className={styles.likeUsername}>{user.username}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostInteractionModal
