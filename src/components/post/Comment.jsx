'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaThumbsUp, FaReply, FaEllipsisV, FaTrash, FaPencilAlt } from 'react-icons/fa'
import TimeAgo from '../utils/TimeAgo'
import styles from './Comment.module.css'
import { toast } from 'react-hot-toast'

export default function Comment({ comment, postId, currentUser, onCommentUpdate, onCommentDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(comment.content)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAuthor = currentUser?.id === comment.user?._id
  const isPostAuthor = currentUser?.id === comment.postUserId
  const isLiked = comment.likes && Array.isArray(comment.likes) && currentUser?.id 
    ? comment.likes.includes(currentUser.id)
    : false

  const formatContent = (content) => {
    if (!content) return '';
    
    const tagMatch = content.match(/@(\w+)/);
    if (tagMatch) {
      const username = tagMatch[1];
      const parts = content.split(`@${username}`);
      const taggedUser = comment.user;
      
      return (
        <>
          <Link href={`/profile/${taggedUser._id}`} className={styles.taggedUser}>
            @{username}
          </Link>
          {parts[1]}
        </>
      );
    }
    return content;
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments/${comment._id}/like`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Erreur lors du like')

      const updatedComment = await response.json()
      
      // Créer une notification pour le like du commentaire
      if (!isLiked && currentUser?.id !== comment.user._id) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: 'comment_like',
              recipient: comment.user._id,
              post: postId,
              comment: comment._id,
              user: currentUser.id,
            }),
          })
        } catch (error) {
          console.error('Erreur création notification:', error)
        }
      }

      onCommentUpdate(updatedComment)
    } catch (error) {
      console.error('Erreur like:', error)
      toast.error('Impossible de liker le commentaire')
    }
  }

  const handleEdit = async () => {
    if (!editedContent.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments/${comment._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: editedContent.trim() }),
        }
      )

      if (!response.ok) throw new Error('Erreur lors de la modification')

      const updatedComment = await response.json()
      onCommentUpdate(updatedComment)
      setIsEditing(false)
      toast.success('Commentaire modifié')
    } catch (error) {
      console.error('Erreur modification:', error)
      toast.error('Impossible de modifier le commentaire')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments/${comment._id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la suppression')
      }

      onCommentDelete(comment._id)
      toast.success('Commentaire supprimé')
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error(error.message || 'Impossible de supprimer le commentaire')
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments/${comment._id}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: `@${comment.user.username} ${replyContent.trim()}`,
            postUserId: comment.postUserId,
          }),
        }
      )

      if (!response.ok) throw new Error('Erreur lors de la réponse')

      const newReply = await response.json()

      // Créer une notification pour la réponse
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'comment_reply',
            recipient: comment.user._id,
            post: postId,
            comment: comment._id,
            reply: newReply._id,
          }),
        })
      } catch (error) {
        console.error('Erreur création notification:', error)
      }

      onCommentUpdate({ ...comment, replies: [...(comment.replies || []), newReply] })
      setReplyContent('')
      setIsReplying(false)
      toast.success('Réponse ajoutée')
    } catch (error) {
      console.error('Erreur réponse:', error)
      toast.error("Impossible d'ajouter la réponse")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.comment} id={`comment-${comment._id}`}>
      <div className={styles.commentMain}>
        <Link href={`/profile/${comment.user?._id}`} className={styles.avatar}>
          <Image
            src={comment.user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${comment.user.avatar}` : "/images/default-avatar.jpg"}
            alt={comment.user?.username || "Utilisateur"}
            width={40}
            height={40}
            className={styles.avatarImage}
          />
        </Link>

        <div className={styles.commentContent}>
          <div className={styles.commentHeader}>
            <div className={styles.userInfo}>
              <Link href={`/profile/${comment.user?._id}`} className={styles.username}>
                {comment.user?.username}
              </Link>
              <span className={styles.time}>
                <TimeAgo timestamp={comment.createdAt} />
              </span>
            </div>
            {(isAuthor || isPostAuthor) && (
              <div className={styles.menuContainer}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={styles.menuButton}
                >
                  <FaEllipsisV />
                </button>
                {showMenu && (
                  <div className={styles.menu}>
                    {isAuthor && (
                      <button
                        onClick={() => {
                          setIsEditing(true)
                          setShowMenu(false)
                        }}
                        className={styles.menuItem}
                      >
                        <FaPencilAlt /> Modifier
                      </button>
                    )}
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

          {isEditing ? (
            <div className={styles.editContainer}>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className={styles.editInput}
                placeholder="Modifier votre commentaire..."
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
                  disabled={isSubmitting}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <p className={styles.commentText}>{formatContent(comment.content)}</p>
          )}

          <div className={styles.commentActions}>
            <button
              onClick={handleLike}
              className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
            >
              <FaThumbsUp className={styles.actionIcon} />
              <span>{comment.likes?.length || 0}</span>
            </button>

            <button
              onClick={() => setIsReplying(!isReplying)}
              className={styles.actionButton}
            >
              <FaReply className={styles.actionIcon} />
              <span>Répondre</span>
            </button>
          </div>
        </div>
      </div>

      {isReplying && (
        <div className={styles.replyContainer}>
          <div className={styles.replyForm}>
            <Image
              src={currentUser?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${currentUser.avatar}` : "/images/default-avatar.jpg"}
              alt="Votre avatar"
              width={32}
              height={32}
              className={styles.replyAvatar}
            />
            <div className={styles.replyInputContainer}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className={styles.replyInput}
                placeholder={`Répondre à @${comment.user?.username}...`}
              />
              <div className={styles.replyButtons}>
                <button
                  onClick={() => setIsReplying(false)}
                  className={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleReply}
                  className={styles.submitButton}
                  disabled={isSubmitting || !replyContent.trim()}
                >
                  Répondre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map((reply) => (
            <Comment
              key={reply._id}
              comment={reply}
              postId={postId}
              currentUser={currentUser}
              onCommentUpdate={(updatedReply) => {
                const updatedReplies = comment.replies.map((r) =>
                  r._id === updatedReply._id ? updatedReply : r
                );
                onCommentUpdate({ ...comment, replies: updatedReplies });
              }}
              onCommentDelete={(replyId) => {
                const updatedReplies = comment.replies.filter((r) => r._id !== replyId);
                onCommentUpdate({ ...comment, replies: updatedReplies });
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
