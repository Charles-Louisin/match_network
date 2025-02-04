'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import TimeAgo from 'react-timeago'
import frenchStrings from 'react-timeago/lib/language-strings/fr'
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter'
import { FaHeart, FaRegHeart, FaComment, FaReply } from 'react-icons/fa'
import styles from './PostCard.module.css'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ImageViewerModal from '../shared/ImageViewerModal';

export default function PostCard({ post: initialPost }) {
  const [post, setPost] = useState(initialPost)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [comment, setComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const formatter = buildFormatter(frenchStrings)
  const router = useRouter()

  useEffect(() => {
    setPost(initialPost)
    const userId = localStorage.getItem('userId')
    setIsLiked(initialPost.likes?.includes(userId))
    setLikesCount(initialPost.likes?.length || 0)
  }, [initialPost])

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}/like`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        setIsLiked(!isLiked)
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: comment }),
        }
      )

      if (response.ok) {
        const updatedPost = await response.json()
        setPost(updatedPost)
        setComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleReply = async (commentId) => {
    if (!replyContent.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}/comments/${commentId}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: replyContent }),
        }
      )

      if (response.ok) {
        const updatedPost = await response.json()
        setPost(updatedPost)
        setReplyContent('')
        setReplyingTo(null)
        
        // Recharger les données du post
        const refreshResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (refreshResponse.ok) {
          const refreshedPost = await refreshResponse.json()
          setPost(refreshedPost)
        }
      } else {
        const error = await response.text()
        console.error('Error adding reply:', error)
        toast.error("Impossible d'ajouter la réponse")
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error("Impossible d'ajouter la réponse")
    }
  }

  const getPostHeader = () => {
    if (post.type === 'PROFILE_PHOTO_UPDATE') {
      return 'a changé sa photo de profil'
    } else if (post.type === 'COVER_PHOTO_UPDATE') {
      return 'a changé sa photo de couverture'
    } else {
      return 'a partagé une publication'
    }
  }

  const formatCommentContent = (content, userId, username) => {
    const tagMatch = content.match(/@(\w+)/)
    if (tagMatch) {
      const taggedUsername = tagMatch[1]
      const parts = content.split(`@${taggedUsername}`)
      return (
        <>
          <Link href={`/profile/${userId}`} className={styles.userTag}>
            @{taggedUsername}
          </Link>
          {parts[1]}
        </>
      )
    }
    return content
  }

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <Link href={`/profile/${post.user._id}`} className={styles.userInfo}>
          <div className={styles.avatar}>
            <Image
              src={
                post.user.avatar
                  ? `${process.env.NEXT_PUBLIC_API_URL}${post.user.avatar}`
                  : '/images/default-avatar.jpg'
              }
              alt={post.user.username}
              width={40}
              height={40}
            />
          </div>
          <div className={styles.userMeta}>
            <span className={styles.username}>{post.user.username}</span>
            <span className={styles.postType}>{getPostHeader()}</span>
            <span className={styles.timestamp}>
              <TimeAgo date={post.createdAt} formatter={formatter} />
            </span>
          </div>
        </Link>
      </div>

      <div className={styles.postContent}>
        {post.content && <p className={styles.content}>{post.content}</p>}
        {post.image && (
          <div 
            className={styles.imageContainer}
            onClick={() => {
              setSelectedImage(`${process.env.NEXT_PUBLIC_API_URL}${post.image}`);
              setShowImageViewer(true);
            }}
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}${post.image}`}
              alt="Post image"
              width={500}
              height={300}
              style={{ objectFit: 'cover', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      <div className={styles.postActions}>
        <button
          className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
          onClick={handleLike}
        >
          {isLiked ? <FaHeart /> : <FaRegHeart />}
          <span>{likesCount}</span>
        </button>

        <button className={styles.actionButton}>
          <FaComment />
          <span>{post.comments?.length || 0}</span>
        </button>
      </div>

      {post.comments && post.comments.length > 0 && (
        <div className={styles.comments}>
          {post.comments.map((comment) => (
            <div key={comment._id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <Link href={`/profile/${comment.user._id}`} className={styles.commentUser}>
                  <div className={styles.commentAvatar}>
                    <Image
                      src={
                        comment.user.avatar
                          ? `${process.env.NEXT_PUBLIC_API_URL}${comment.user.avatar}`
                          : '/images/default-avatar.jpg'
                      }
                      alt={comment.user.username}
                      width={32}
                      height={32}
                    />
                  </div>
                  <span className={styles.commentUsername}>{comment.user.username}</span>
                </Link>
                <span className={styles.commentTime}>
                  <TimeAgo date={comment.createdAt} formatter={formatter} />
                </span>
              </div>

              <p className={styles.commentContent}>{comment.content}</p>

              <div className={styles.commentActions}>
                <button
                  className={styles.replyButton}
                  onClick={() => setReplyingTo(comment._id)}
                >
                  <FaReply className={styles.replyIcon} />
                  Répondre
                </button>
              </div>

              {replyingTo === comment._id && (
                <div className={styles.replyFormContainer}>
                  <div className={styles.replyForm}>
                    <div className={styles.replyInputWrapper}>
                      <Image
                        src={
                          localStorage.getItem('userAvatar')
                            ? `${process.env.NEXT_PUBLIC_API_URL}${localStorage.getItem('userAvatar')}`
                            : '/images/default-avatar.jpg'
                        }
                        alt="Your avatar"
                        width={24}
                        height={24}
                        className={styles.replyFormAvatar}
                      />
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Répondre à @${comment.user.username}...`}
                        className={styles.replyInputField}
                      />
                    </div>
                    <div className={styles.replyFormActions}>
                      <button
                        className={styles.cancelReplyButton}
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyContent('')
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        className={styles.submitReplyButton}
                        onClick={() => handleReply(comment._id)}
                        disabled={!replyContent.trim()}
                      >
                        Répondre
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className={styles.repliesContainer}>
                  {comment.replies.map((reply) => (
                    <div key={reply._id} className={styles.reply}>
                      <div className={styles.replyHeader}>
                        <Link href={`/profile/${reply.user._id}`} className={styles.replyUser}>
                          <div className={styles.replyAvatar}>
                            <Image
                              src={
                                reply.user.avatar
                                  ? `${process.env.NEXT_PUBLIC_API_URL}${reply.user.avatar}`
                                  : '/images/default-avatar.jpg'
                              }
                              alt={reply.user.username}
                              width={24}
                              height={24}
                            />
                          </div>
                          <span className={styles.replyUsername}>{reply.user.username}</span>
                        </Link>
                        <span className={styles.replyTime}>
                          <TimeAgo date={reply.createdAt} formatter={formatter} />
                        </span>
                      </div>
                      <p className={styles.replyContent}>
                        {formatCommentContent(reply.content, comment.user._id, comment.user.username)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form className={styles.commentForm} onSubmit={handleComment}>
        <input
          type="text"
          className={styles.commentInput}
          placeholder="Ajouter un commentaire..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!comment.trim()}
        >
          Envoyer
        </button>
      </form>

      {showImageViewer && (
        <ImageViewerModal
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          imageUrl={selectedImage}
        />
      )}
    </div>
  )
}
