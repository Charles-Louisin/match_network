"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaThumbsUp,
  FaComment,
  FaPaperPlane,
  FaEllipsisV,
  FaTrash,
  FaPencilAlt,
} from "react-icons/fa";
import TimeAgo from "../utils/TimeAgo";
import Comment from "./Comment";
import PostInteractionModal from "../modals/PostInteractionModal";
import ImageViewerModal from '../shared/ImageViewerModal';
import styles from "./Post.module.css";
import { toast } from "react-hot-toast";
import frenchStrings from "react-timeago/lib/language-strings/fr";
import buildFormatter from "react-timeago/lib/formatters/buildFormatter";

const formatter = buildFormatter(frenchStrings);

const Post = ({
  post,
  currentUser,
  onPostUpdate,
  onPostDelete,
  onPostClick,
}) => {
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState("likes");
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const isAuthor = currentUser?.id === post.user?.id;

  useEffect(() => {
    setIsClient(true);
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setIsLiked(post.likes?.includes(userData.id));
      setLikesCount(post.likes?.length || 0);
    }
  }, []);

  useEffect(() => {
    if (user && post._id) {
      setIsLiked(post.likes?.includes(user.id));
      setLikesCount(post.likes?.length || 0);
    }
  }, [post._id]);

  const checkIfLiked = useCallback((currentUser, postLikes) => {
    if (!currentUser || !postLikes) return false;
    const userId = currentUser.id;
    return Array.isArray(postLikes) && postLikes.includes(userId);
  }, []);

  const formatLikeCount = useCallback(() => {
    if (likesCount === 0) return "Aucun like";
    if (isLiked) {
      return likesCount > 1
        ? `Vous et ${likesCount - 1} autre${likesCount > 2 ? "s" : ""}`
        : "Vous";
    }
    return likesCount.toString();
  }, [likesCount, isLiked]);

  const handleLike = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      toast.error("Vous devez être connecté pour aimer un post");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount((prev) => prev + (newIsLiked ? 1 : -1));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        setIsLiked(!newIsLiked);
        setLikesCount((prev) => prev + (newIsLiked ? -1 : 1));
        throw new Error("Erreur lors du like");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      onPostDelete(post._id);
      toast.success("Post supprimé avec succès");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Impossible de supprimer le post");
    }
  };

  const handleEdit = async () => {
    if (!editedContent.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: editedContent }),
        }
      );

      if (!response.ok) throw new Error("Erreur lors de la modification");

      const updatedPost = await response.json();
      onPostUpdate(updatedPost);
      setIsEditing(false);
      toast.success("Post modifié avec succès");
    } catch (error) {
      console.error("Erreur modification:", error);
      toast.error("Impossible de modifier le post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("token")
          : null;
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
          error.message || "Erreur lors de l'ajout du commentaire"
        );
      }

      const newComment = await response.json();
      setComments((prevComments) => [newComment, ...prevComments]);
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
        const token =
          typeof window !== "undefined"
            ? window.localStorage.getItem("token")
            : null;
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
    setComments((prevComments) =>
      prevComments.map((c) =>
        c._id === updatedComment._id ? updatedComment : c
      )
    );
  };

  const handleCommentDelete = (commentId) => {
    setComments((prevComments) =>
      prevComments.filter((c) => c._id !== commentId)
    );
  };

  const autoResizeTextArea = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  const openModal = (tab) => {
    setModalInitialTab(tab);
    setIsModalOpen(true);
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    if (onPostClick) {
      onPostClick(post._id);
    }
  };

  const handlePostClick = () => {
    if (onPostClick) {
      onPostClick(post._id);
    }
  };

  if (!isClient) {
    return null; // ou un composant de chargement
  }

  return (
    <div
      className={styles.post}
      id={`post-${post._id}`}
      onClick={handlePostClick}
      style={{ cursor: "pointer" }}
    >
      {/* En-tête du post */}
      <div className={styles.postHeader}>
        <div className={styles.userInfo}>
          <Link href={`/profile/${postUser?._id}`}>
            <Image
              src={
                postUser?.avatar
                  ? `${process.env.NEXT_PUBLIC_API_URL}${postUser.avatar}`
                  : "/images/default-cover.jpg"
              }
              alt={postUser?.username}
              width={40}
              height={40}
              className={styles.avatar}
            />
          </Link>
          <div className={styles.userMeta}>
            <div className={styles.nameAndTags}>
              <Link
                href={`/profile/${postUser?._id}`}
                className={styles.username}
              >
                {postUser?.username}
              </Link>
              {post.taggedUsers && post.taggedUsers.length > 0 && (
                <span className={styles.taggedUsers}>
                  {" "}
                  est avec{" "}
                  {post.taggedUsers.map((taggedUser, index) => (
                    <span key={taggedUser._id}>
                      <Link
                        href={`/profile/${taggedUser._id}`}
                        className={styles.taggedUser}
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{taggedUser.username}
                      </Link>
                      {index < post.taggedUsers.length - 1 && ", "}
                    </span>
                  ))}
                </span>
              )}
            </div>
            <TimeAgo date={post.createdAt} formatter={formatter} />
          </div>
        </div>
        {/* Menu du post */}
        {isAuthor && (
          <div className={styles.postMenu}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={styles.menuButton}
            >
              <FaEllipsisV />
            </button>
            {showMenu && (
              <div className={styles.menu}>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className={styles.menuItem}
                >
                  <FaPencilAlt /> Modifier
                </button>
                <button
                  onClick={() => {
                    handleDelete();
                    setShowMenu(false);
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
          <p className={styles.text} style={{ whiteSpace: "pre-wrap" }}>
            {post.content}
          </p>
          {post.image && (
            <div 
              className={styles.imageContainer}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(`${process.env.NEXT_PUBLIC_API_URL}${post.image}`);
                setShowImageViewer(true);
              }}
              style={{ cursor: "pointer" }}
            >
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}${post.image}`}
                alt="Image du post"
                width={500}
                height={300}
                className={styles.postImage}
              />
            </div>
          )}
        </div>
      )}

      <div className={styles.postStats}>
        <button
          onClick={() => {
            setModalInitialTab("likes");
            setIsModalOpen(true);
          }}
          className={`${styles.likeCounter} ${isLiked ? styles.liked : ""}`}
        >
          <FaThumbsUp className={styles.icon} />
          <span className={styles.count}>{formatLikeCount()}</span>
        </button>
        <span className={styles.statsDivider}>•</span>
        <button
          onClick={() => openModal("comments")}
          className={styles.statsButton}
        >
          {comments.length}{" "}
          {comments.length === 1 ? "commentaire" : "commentaires"}
        </button>
      </div>

      <div className={styles.postActions}>
        <button
          onClick={handleLike}
          className={`${styles.actionButton} ${isLiked ? styles.liked : ""}`}
        >
          <FaThumbsUp className={styles.actionIcon} />
          <span>J&apos;aime</span>
        </button>
        <button onClick={() => openModal("comments")} className={styles.actionButton}>
          <FaComment className={styles.actionIcon} />
          <span>Commenter</span>
        </button>
      </div>

      <PostInteractionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postId={post._id}
        currentUser={currentUser}
        initialTab={modalInitialTab}
        onPostUpdate={(updatedPost) => {
          if (updatedPost.likes) {
            setLikesCount(updatedPost.likes.length);
          }
          if (updatedPost.comments) {
            setComments(updatedPost.comments);
          }
          onPostUpdate(updatedPost);
        }}
        initialComments={comments}
        initialLikes={post.likes}
      />
      {showImageViewer && (
        <ImageViewerModal
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          imageUrl={selectedImage}
        />
      )}
    </div>
  );
}

export default Post;
