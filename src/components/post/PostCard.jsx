'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import TimeAgo from 'react-timeago'
import frenchStrings from 'react-timeago/lib/language-strings/fr'
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter'
import { FaHeart, FaRegHeart, FaComment } from 'react-icons/fa'
import styles from './PostCard.module.css'

export default function PostCard({ post: initialPost }) {
  const [post, setPost] = useState(initialPost)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [comment, setComment] = useState('')
  const formatter = buildFormatter(frenchStrings)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    setIsLiked(post.likes?.includes(userId))
    setLikesCount(post.likes?.length || 0)
  }, [post])

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

  const getPostHeader = () => {
    if (post.type === 'PROFILE_PHOTO_UPDATE') {
      return 'a changé sa photo de profil'
    } else if (post.type === 'COVER_PHOTO_UPDATE') {
      return 'a changé sa photo de couverture'
    } else {
      return 'a partagé une publication'
    }
  }

  return (
    <div 
      className={styles.postCard} 
      id={`post-${post._id}`}
    >
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

      {post.content && <p className={styles.content}>{post.content}</p>}

      {post.image && (
        <div className={styles.imageContainer}>
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL}${post.image}`}
            alt="Post image"
            width={500}
            height={500}
            objectFit="contain"
          />
        </div>
      )}

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
              <p className={styles.commentContent}>{comment.content}</p>
              <span className={styles.commentTime}>
                <TimeAgo date={comment.createdAt} formatter={formatter} />
              </span>
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
    </div>
  )
}
