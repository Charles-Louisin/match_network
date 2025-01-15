"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaThumbsUp, FaComment, FaPaperPlane } from "react-icons/fa";
import TimeAgo from "../utils/TimeAgo";
import styles from "./Post.module.css";
import { toast } from 'react-hot-toast';

const Post = ({ post, onPostUpdate }) => {
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

  useEffect(() => {
    setIsClient(true);
    const userStr = localStorage.getItem("user");
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

        const token = localStorage.getItem("token");
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

      const token = localStorage.getItem("token");
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

  const getLikeText = () => {
    if (!user) return "Connectez-vous pour liker";
    
    if (likesCount === 0) {
      return "Soyez le premier à liker";
    }
    
    if (isLiked) {
      if (likesCount === 1) {
        return "Vous avez liké";
      } else if (likesCount === 2) {
        return "Vous et une autre personne avez liké";
      } else {
        return `Vous et ${likesCount - 1} autres personnes avez liké`;
      }
    } else {
      if (likesCount === 1) {
        return "1 personne a liké";
      } else {
        return `${likesCount} personnes ont liké`;
      }
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    if (!user) {
      toast.error("Vous devez être connecté pour commenter");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
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
        const token = localStorage.getItem("token");
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

  const renderComment = (comment, index) => {
    return (
      <div key={index} className={styles.comment}>
        <Link href={`/profile/${typeof comment.user === 'string' ? comment.user : comment.user?.id || comment.user?._id}`} className={styles.commentUserInfo}>
          <Image
            src={comment.user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${comment.user.avatar}` : "/images/default-avatar.jpg"}
            alt={comment.user?.username || "User"}
            width={40}
            height={40}
            className={styles.commentAvatar}
          />
        </Link>
        <div className={styles.commentContent}>
          <div className={styles.commentHeader}>
            <span className={styles.commentUsername}>
              {comment.user?.username}
            </span>
            <span className={styles.commentTime}>
              <TimeAgo timestamp={comment.createdAt} />
            </span>
          </div>
          <p className={styles.commentText}>{comment.content}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.post}>
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
      </div>

      {/* Contenu du post */}
      {post.content && (
        <div className={styles.content}>
          <p>{post.content}</p>
        </div>
      )}

      {post.image && (
        <div className={styles.imageContainer}>
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL}${post.image}`}
            alt="Post image"
            width={500}
            height={500}
            className={styles.postImage}
            priority
          />
        </div>
      )}

      {/* Section des interactions */}
      <div className={styles.interactionStats}>
        <div className={styles.likeSummary}>
          <FaThumbsUp 
            className={`${styles.thumbIcon} ${isLiked ? styles.liked : ''}`}
          />
          <span>{getLikeText()}</span>
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
        >
          <FaThumbsUp className={`${styles.buttonIcon} ${isLiked ? styles.liked : ''}`} />
          J&apos;aime
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setShowComments(!showComments)}
        >
          <FaComment className={styles.buttonIcon} />
          Commenter
        </button>
      </div>

      {/* Section des commentaires */}
      {showComments && (
        <div className={styles.comments}>
          <form onSubmit={handleComment} className={styles.commentForm}>
            <Image
              src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : "/images/default-avatar.jpg"}
              alt="Your avatar"
              width={32}
              height={32}
              className={styles.commentAvatar}
              onError={(e) => {
                e.target.src = "/images/default-avatar.jpg";
              }}
            />
            <div className={styles.commentInputWrapper}>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Écrivez un commentaire..."
                className={styles.commentInput}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className={`${styles.commentSubmit} ${isSubmitting ? styles.loading : ''}`}
                disabled={!comment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <div className={styles.spinnerSmall}></div>
                ) : (
                  <FaPaperPlane />
                )}
              </button>
            </div>
          </form>

          <div className={styles.commentsList}>
            {isLoadingComments ? (
              <div className={styles.loadingComments}>
                <div className={styles.spinner}></div>
                <span>Chargement des commentaires...</span>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment, index) => renderComment(comment, index))
            ) : (
              <p className={styles.noComments}>Aucun commentaire pour le moment</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
