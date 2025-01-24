"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaThumbsUp, FaComment, FaPaperPlane, FaEllipsisV, FaTrash, FaPencilAlt } from "react-icons/fa";
import TimeAgo from "../utils/TimeAgo";
import Comment from './Comment';
import styles from "./Post.module.css";
import { toast } from 'react-hot-toast';

const Post = ({ post, currentUser, onPostUpdate, onPostDelete }) => {
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState(null);
  const [postUser, setPostUser] = useState(post.user || null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

  const isAuthor = currentUser?.id === post.user?.id;

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      const userStr = window.localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
          if (post.likes) {
            setIsLiked(post.likes.includes(userData.id));
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
  }, [post.likes]);

  useEffect(() => {
    const fetchPostUser = async () => {
      if (!post.user || (typeof post.user === 'object' && post.user.username && post.user.avatar)) {
        setPostUser(post.user);
        return;
      }

      try {
        const userId = typeof post.user === 'string' ? post.user : post.user?.id || post.user?._id;
        if (!userId) {
          console.error('User ID not found in post:', post);
          return;
        }

        const token = typeof window !== 'undefined' ? window.localStorage.getItem("token") : null;
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        setPostUser(userData);
      } catch (error) {
        console.error("Error fetching post user:", error);
        setPostUser({
          username: "Utilisateur inconnu",
          avatar: "/images/default-avatar.jpg"
        });
      }
    };

    fetchPostUser();
  }, [post.user]);

  const checkIfLiked = useCallback((currentUser, postLikes) => {
    if (!currentUser || !postLikes) return false;
    const userId = currentUser.id; 
    return Array.isArray(postLikes) && postLikes.includes(userId);
  }, []);

  const handleLike = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      if (!user) {
        toast.error("Vous devez être connecté pour liker");
        return;
      }

      const userId = user.id; 
      if (!userId) {
        console.error("User ID not found:", user);
        toast.error("Erreur: ID utilisateur non trouvé");
        return;
      }

      const token = typeof window !== 'undefined' ? window.localStorage.getItem("token") : null;
      if (!token) {
        toast.error("Vous devez être connecté pour liker");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        const updatedPost = await response.json();
        const newIsLiked = checkIfLiked(user, updatedPost.likes);
        setIsLiked(newIsLiked);
        setLikesCount(updatedPost.likes.length);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du like");
      }
    } catch (error) {
      console.error("Erreur like:", error);
      toast.error(error.message);
    }
  };

  

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Erreur lors de la suppression')

      onPostDelete(post._id)
      toast.success('Post supprimé avec succès')
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Impossible de supprimer le post')
    }
  }

  const handleEdit = async () => {
    if (!editedContent.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editedContent }),
      })

      if (!response.ok) throw new Error('Erreur lors de la modification')

      const updatedPost = await response.json()
      onPostUpdate(updatedPost)
      setIsEditing(false)
      toast.success('Post modifié avec succès')
    } catch (error) {
      console.error('Erreur modification:', error)
      toast.error('Impossible de modifier le post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const token = typeof window !== 'undefined' ? window.localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Vous devez être connecté pour commenter");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: comment.trim(),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'ajout du commentaire");
      }

      const newComment = await response.json();
      setComments(prevComments => [newComment, ...prevComments]);
      setComment("");
      toast.success("Commentaire ajouté avec succès");

    } catch (error) {
      console.error("Erreur commentaire:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      if (!showComments) return;
      
      try {
        setIsLoadingComments(true);
        const token = typeof window !== 'undefined' ? window.localStorage.getItem("token") : null;
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des commentaires");
        }

        const data = await response.json();
        if (data.comments) {
          setComments(data.comments);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast.error("Impossible de charger les commentaires");
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [post._id, showComments]);

  const handleCommentUpdate = (updatedComment) => {
    setComments(prevComments =>
      prevComments.map(c =>
        c._id === updatedComment._id ? updatedComment : c
      )
    )
  }

  const handleCommentDelete = (commentId) => {
    setComments(prevComments =>
      prevComments.filter(c => c._id !== commentId)
    )
  }

  const autoResizeTextArea = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  if (!isClient) {
    return null; // ou un composant de chargement
  }

  return (
    <div 
      className={styles.post} 
      id={`post-${post._id}`}
    >
      {/* En-tête du post */}
      <div className={styles.postHeader}>
        <Link 
          href={`/profile/${typeof postUser === 'string' ? postUser : postUser?.id || postUser?._id}`} 
          className={styles.userInfo}
        >
          <Image
            src={postUser?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${postUser.avatar}` : "/images/default-avatar.jpg"}
            alt={postUser?.username || "Utilisateur"}
            width={40}
            height={40}
            className={styles.avatar}
            onError={(e) => {
              e.target.src = "/images/default-avatar.jpg";
            }}
          />
          <div className={styles.userDetails}>
            <span className={styles.username}>{postUser?.username || "Utilisateur inconnu"}</span>
            <span className={styles.postDate}>
              <TimeAgo timestamp={post.createdAt} />
            </span>
          </div>
        </Link>
        {isAuthor && (
          <div className={styles.menuContainer}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={styles.menuButton}
            >
              <FaEllipsisV />
            </button>
            {showMenu && (
              <div className={styles.menu}>
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setShowMenu(false)
                  }}
                  className={styles.menuItem}
                >
                  <FaPencilAlt /> Modifier
                </button>
                <button
                  onClick={() => {
                    handleDelete()
                    setShowMenu(false)
                  }}
                  className={styles.menuItem}
                >
                  <FaTrash /> Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenu du post */}
      {isEditing ? (
        <div className={styles.editContainer}>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className={styles.editInput}
            placeholder="Modifier votre publication..."
          />
          <div className={styles.editButtons}>
            <button
              onClick={() => setIsEditing(false)}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              onClick={handleEdit}
              className={styles.saveButton}
              disabled={isSubmitting || !editedContent.trim()}
            >
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.postContent}>
          <p className={styles.text} style={{ whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>
          {post.image && (
            <div className={styles.imageContainer}>
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}${post.image}`}
                alt="Post image"
                width={500}
                height={300}
                className={styles.image}
              />
            </div>
          )}
        </div>
      )}

      {/* Section des interactions */}
      <div className={styles.interactionStats}>
        <div className={styles.likeSummary}>
          <FaThumbsUp 
            className={`${styles.thumbIcon} ${isLiked ? styles.liked : ''}`}
          />
          <span>{likesCount}</span>
        </div>
        <div className={styles.commentSummary}>
          {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className={styles.actionButtons}>
        <button
          type="button"
          className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
          onClick={handleLike}
          data-testid="like-button"
        >
          <FaThumbsUp className={`${styles.buttonIcon} ${isLiked ? styles.liked : ''}`} />
          J&apos;aime
        </button>
        
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setShowComments(!showComments)}
          data-testid="comment-button"
        >
          <FaComment className={styles.buttonIcon} />
          Commenter
        </button>
      </div>

      {/* Section des commentaires */}
      <div className={styles.commentsSection}>
        {/* <button
          onClick={() => setShowComments(!showComments)}
          className={styles.showCommentsButton}
        >
          <FaComment />
          <span>{comments.length} commentaire{comments.length !== 1 ? 's' : ''}</span>
        </button> */}

        {showComments && (
          <>
            {/* Formulaire de commentaire */}
            <div className={styles.commentForm}>
              <Image
                src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : "/images/default-avatar.jpg"}
                alt={user?.username || "User"}
                width={40}
                height={40}
                className={styles.commentAvatar}
              />
              <div className={styles.commentInputContainer}>
                <textarea
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    autoResizeTextArea(e);
                  }}
                  onInput={autoResizeTextArea}
                  placeholder="Écrire un commentaire..."
                  className={styles.commentInput}
                />
                <button
                  type="submit"
                  className={`${styles.commentSubmit} ${isSubmitting ? styles.loading : ''}`}
                  disabled={!comment.trim() || isSubmitting}
                  onClick={handleComment}
                >
                  {isSubmitting ? (
                    <div className={styles.spinnerSmall}></div>
                  ) : (
                    <FaPaperPlane />
                  )}
                </button>
              </div>
            </div>

            {/* Liste des commentaires */}
            <div className={styles.commentsList}>
              {isLoadingComments ? (
                <div className={styles.loading}>Chargement des commentaires...</div>
              ) : (
                comments.map(comment => (
                  <Comment
                    key={comment._id}
                    comment={comment}
                    postId={post._id}
                    currentUser={user}
                    onCommentUpdate={handleCommentUpdate}
                    onCommentDelete={handleCommentDelete}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Post;
