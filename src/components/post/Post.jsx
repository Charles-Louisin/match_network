"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaThumbsUp, FaComment, FaPaperPlane } from "react-icons/fa";
import TimeAgo from "../utils/TimeAgo";
import styles from "./Post.module.css";

export default function Post({ post, onPostUpdate }) {
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState(null);
  const [postUser, setPostUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPostUser = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Si l'utilisateur est déjà un objet complet avec username et avatar
        if (post.user && typeof post.user === 'object' && post.user.username && post.user.avatar) {
          setPostUser(post.user);
          return;
        }

        // Récupérer l'ID de l'utilisateur
        const userId = typeof post.user === 'string' ? post.user : post.user?._id;
        if (!token || !userId) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const userData = await response.json();
        setPostUser(userData);
      } catch (error) {
        console.error("Error fetching post user:", error);
      }
    };

    fetchPostUser();
  }, [post.user]);

  useEffect(() => {
    setIsClient(true);
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      setIsLiked(post.likes?.includes(parsedUser._id));
    }
  }, [post.likes]);

  useEffect(() => {
    console.log("Post data:", post); // Debug log
    console.log("Post user data:", post.user); // Debug log
  }, [post]);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Token utilisé:", token);
        if (!token) return;

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}`;
        console.log("Fetching post data from:", apiUrl);

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const updatedPost = await response.json();
          setLikesCount(updatedPost.likes?.length || 0);
          if (updatedPost.comments) {
            const processedComments = updatedPost.comments.map((comment) => ({
              ...comment,
              user: comment.user || updatedPost.user,
            }));
            setComments(processedComments);
          }
        }
      } catch (error) {
        const response = error.response;
        const errorData = await response.json();
        console.error("Error fetching post data:", errorData);
        throw new Error(
          errorData.message || "Erreur lors de la récupération du post"
        );
      }
    };

    if (showComments) {
      fetchPostData();
    }
  }, [post._id, showComments]);

  const isMyLike = (likeId) => {
    return user && likeId === user._id;
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      if (!token) {
        alert("Vous devez être connecté pour liker");
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
          body: JSON.stringify({ userId: user._id }),
        }
      );

      if (response.ok) {
        const updatedPost = await response.json();
        setIsLiked(!isLiked);
        setLikesCount(updatedPost.likes?.length || 0);
        console.log(updatedPost.likes?.length);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du like");
      }
    } catch (error) {
      console.error("Erreur like:", error);
      alert(error.message);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!isClient || !user || !comment.trim() || isSubmitting) return;

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
        throw new Error(
          error.message || "Erreur lors de l&apos;ajout du commentaire"
        );
      }

      const newComment = await response.json();
      console.log("New comment received:", newComment);

      // Ajouter le nouveau commentaire à la liste
      setComments((prevComments) => [...prevComments, newComment]);
      setComment("");

      // Notifier le parent pour rafraîchir les données si nécessaire
      if (onPostUpdate) {
        onPostUpdate();
      }
    } catch (error) {
      console.error("Erreur commentaire:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu des commentaires
  const renderComment = (comment, index) => {
    return (
      <div key={index} className={styles.comment}>
        <Link
          href={`/profile/${comment.user?._id}`}
          className={styles.commentUserInfo}
        >
          <Image
            src={comment.user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${comment.user.avatar}` : "/images/default-avatar.jpg"}
            alt={comment.user?.username || "User"}
            width={32}
            height={32}
            className={styles.commentAvatar}
            onError={(e) => {
              if (!e.target.src.includes("/images/default-avatar.jpg")) {
                e.target.src = "/images/default-avatar.jpg";
              }
            }}
          />
          <div className={styles.commentContent}>
            <span className={styles.commentUsername}>
              {comment.user.username}
              <span className={styles.commentTime}>
                <TimeAgo timestamp={comment.createdAt} />
              </span>
            </span>

            <span className={styles.commentText}>{comment.content}</span>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <div className={styles.post}>
      <div className={styles.header}>
        <Link
          href={`/profile/${postUser?._id}`}
          className={styles.userInfo}
        >
          <Image
            src={postUser?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${postUser.avatar}` : "/images/default-avatar.jpg"}
            alt={postUser?.username || "User"}
            width={40}
            height={40}
            className={styles.avatar}
            onError={(e) => {
              if (!e.target.src.includes("/images/default-avatar.jpg")) {
                e.target.src = "/images/default-avatar.jpg";
              }
            }}
          />
          <div>
            <h3>{postUser?.username || "User"}</h3>
            <span className={styles.postTime}>
              <TimeAgo timestamp={post.createdAt} />
            </span>
          </div>
        </Link>
      </div>

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
            height={300}
            style={{ objectFit: "contain", maxHeight: "400px", width: "100%" }}
          />
        </div>
      )}
      <div className={styles.actions}>
        <div className={styles.likeContainer}>
          <div className={styles.postFooter}>
            {/* Affichage du nombre de likes et commentaires */}
            <div className={styles.interactionStats}>
              <div className={styles.likeSummary}>
                <FaThumbsUp className={`${styles.thumbIcon} ${styles.liked}`} />
                <span>
                  {likesCount === 0
                    ? "Soyez le premier à aimer"
                    : isMyLike
                    ? likesCount === 1
                      ? "Vous aimez"
                      : likesCount === 2
                      ? "Vous et 1 autre personne"
                      : `Vous et ${likesCount - 1} autres personnes`
                    : `${likesCount} ${
                        likesCount === 1 ? "personne aime" : "personnes aiment"
                      }`}
                </span>
              </div>
              <div className={styles.commentSummary}>
                <span>
                  {comments.length}{" "}
                  {comments.length === 1 ? "commentaire" : "commentaires"}
                </span>
              </div>
            </div>
            {/* Boutons d'action */}
            <div className={styles.actionButtons}>
              <button
                className={`${styles.actionButton} ${
                  isLiked ? styles.liked : ""
                }`}
                onClick={handleLike}
              >
                <FaThumbsUp className={styles.buttonIcon} />
                <span>J&apos;aime</span>
              </button>
              <button
                className={styles.actionButton}
                onClick={() => setShowComments(!showComments)}
              >
                <FaComment className={styles.buttonIcon} />
                <span>Commenter</span>
              </button>
            </div>
          </div>
          {showComments && (
            <div className={styles.comments}>
              {comments.map((comment, index) => renderComment(comment, index))}
              <form onSubmit={handleComment} className={styles.commentForm}>
                <Image
                  src={
                    user?.avatar
                      ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`
                      : "/images/default-avatar.jpg"
                  }
                  alt="Your avatar"
                  width={32}
                  height={32}
                  className={styles.commentAvatar}
                />
                <input
                  type="text"
                  placeholder="Écrire un commentaire..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={styles.commentInput}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className={styles.sendButton}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
