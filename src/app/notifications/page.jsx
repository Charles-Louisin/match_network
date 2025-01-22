'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import styles from './notifications.module.css'
import TimeAgo from 'react-timeago'
import frenchStrings from 'react-timeago/lib/language-strings/fr'
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter'
import Image from 'next/image'
import Modal from '@/components/common/Modal'
import PostCard from '@/components/post/PostCard'
import Link from 'next/link'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState(null)
  const formatter = buildFormatter(frenchStrings)

  useEffect(() => {
    fetchNotifications()
    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationClick = async (notification) => {
    try {
      // Marquer la notification comme lue
      const token = localStorage.getItem('token')
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notification._id}/read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Si c'est une notification de post, like ou commentaire
      if (['POST_CREATED', 'POST_LIKE', 'POST_COMMENT'].includes(notification.type)) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${notification.reference}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (response.ok) {
          const post = await response.json()
          setSelectedPost(post)
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'POST_LIKE':
        return 'a aimé votre publication'
      case 'POST_COMMENT':
        return 'a commenté votre publication'
      case 'POST_CREATED':
        return 'a partagé une publication'
      case 'PROFILE_PHOTO_UPDATED':
        return 'a changé sa photo de profil'
      case 'COVER_PHOTO_UPDATED':
        return 'a changé sa photo de couverture'
      case 'FRIEND_REQUEST':
        return 'vous a envoyé une demande d\'ami'
      case 'FRIEND_ACCEPT':
        return 'a accepté votre demande d\'ami'
      default:
        return 'a interagi avec votre contenu'
    }
  }

  const getPreviewImage = (notification) => {
    if (!notification.reference) return null

    switch (notification.type) {
      case 'POST_CREATED':
      case 'POST_LIKE':
      case 'POST_COMMENT':
        return notification.reference.image
      case 'PROFILE_PHOTO_UPDATED':
        return notification.sender.avatar
      case 'COVER_PHOTO_UPDATED':
        return notification.sender.coverPhoto
      default:
        return null
    }
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <div className={styles.contentContainer}>
        <div className={styles.header}>
          <h1>Notifications</h1>
          {notifications.length > 0 && (
            <button
              className={styles.markAllRead}
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token')
                  await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read/all`,
                    {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  )
                  fetchNotifications()
                } catch (error) {
                  console.error('Error marking all as read:', error)
                }
              }}
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        <div className={styles.notificationsList}>
          {isLoading ? (
            <div className={styles.loading}>Chargement...</div>
          ) : notifications.length === 0 ? (
            <div className={styles.empty}>Aucune notification</div>
          ) : (
            notifications.map((notification) => (
              <Link
                href={notification.reference ? `/post/${notification.reference}` : `/profile/${notification.sender._id}`}
                key={notification._id}
                className={`${styles.notificationItem} ${
                  !notification.read ? styles.unread : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.notificationContent}>
                  <div className={styles.avatar}>
                    <Image
                      src={
                        notification.sender.avatar
                          ? `${process.env.NEXT_PUBLIC_API_URL}${notification.sender.avatar}`
                          : '/images/default-avatar.jpg'
                      }
                      alt={notification.sender.username}
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className={styles.notificationText}>
                    <span className={styles.username}>{notification.sender.username}</span>
                    <span className={styles.action}>{getNotificationText(notification)}</span>
                    <span className={styles.time}>
                      <TimeAgo
                        date={notification.createdAt}
                        formatter={formatter}
                      />
                    </span>
                  </div>
                  {getPreviewImage(notification) && (
                    <div className={styles.previewImage}>
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}${getPreviewImage(notification)}`}
                        alt="Preview"
                        width={60}
                        height={60}
                        objectFit="cover"
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {selectedPost && (
        <Modal onClose={() => setSelectedPost(null)}>
          <PostCard post={selectedPost} />
        </Modal>
      )}
    </div>
  )
}
