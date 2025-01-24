'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import styles from './notifications.module.css'
import TimeAgo from 'react-timeago'
import frenchStrings from 'react-timeago/lib/language-strings/fr'
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter'
import Image from 'next/image'
import Link from 'next/link'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const formatter = buildFormatter(frenchStrings)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const currentUser = JSON.parse(localStorage.getItem('user'))
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      
      // Filtrer les notifications
      const filteredNotifications = data.filter(notif => {
        // Vérifier que la notification a une référence valide
        if (!notif.reference) return false;
        
        // Pour les likes et commentaires sur un post
        if (['POST_LIKE', 'POST_COMMENT'].includes(notif.type)) {
          return notif.reference.user?._id === currentUser.id;
        }
        
        // Pour les autres types de notifications
        return true;
      });

      console.log('Notifications filtrées:', filteredNotifications); // Pour le debug
      setNotifications(filteredNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationClick = async (notification, e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const currentUser = JSON.parse(localStorage.getItem('user'))

      // Marquer la notification comme lue
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notification._id}/read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n._id === notification._id ? { ...n, read: true } : n
        )
      )

      let targetUrl = ''
      let hash = ''

      // Pour les likes et commentaires
      if (['POST_LIKE', 'POST_COMMENT'].includes(notification.type)) {
        // Toujours rediriger vers le profil du propriétaire du post
        targetUrl = `/profile/${notification.reference.user._id}`
        hash = notification.type === 'POST_COMMENT' 
          ? `#post-${notification.reference._id}-comment-${notification.comment?._id}`
          : `#post-${notification.reference._id}`
      }
      // Pour les nouvelles publications et photos
      else if (['POST_CREATED', 'PROFILE_PHOTO_UPDATED', 'COVER_PHOTO_UPDATED'].includes(notification.type)) {
        targetUrl = `/profile/${notification.sender._id}`
        hash = `#post-${notification.reference._id}`
      }
      // Pour les autres notifications
      else {
        targetUrl = `/profile/${notification.sender._id}`
      }

      if (hash) {
        sessionStorage.setItem('notificationAction', JSON.stringify({
          type: notification.type,
          postId: notification.reference._id,
          commentId: notification.comment?._id
        }))
      }

      router.push(targetUrl + hash)
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }

  const getNotificationText = (notification) => {
    const truncateText = (text) => {
      if (!text) return '';
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    };

    switch (notification.type) {
      case 'POST_LIKE':
        return 'a aimé votre publication'
      case 'POST_COMMENT':
        return `a commenté votre publication: "${truncateText(notification.comment?.content)}"`
      case 'POST_CREATED':
        return `a partagé une publication: "${truncateText(notification.reference?.content)}"`
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

    let imageUrl = null
    switch (notification.type) {
      case 'POST_CREATED':
      case 'POST_LIKE':
      case 'POST_COMMENT':
        imageUrl = notification.reference.image
        break
      case 'PROFILE_PHOTO_UPDATED':
      case 'COVER_PHOTO_UPDATED':
        imageUrl = notification.reference
        break
      default:
        return null
    }

    if (!imageUrl) return null
    
    if (!imageUrl.startsWith('/')) {
      imageUrl = `/${imageUrl}`
    }

    return `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`
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
                  setNotifications(prevNotifications =>
                    prevNotifications.map(n => ({ ...n, read: true }))
                  )
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
            <div className={styles.loading}>Chargement des notifications...</div>
          ) : notifications.length === 0 ? (
            <div className={styles.empty}>Aucune notification</div>
          ) : (
            notifications.map((notification) => {
              const previewImage = getPreviewImage(notification)
              return (
                <Link
                  key={notification._id}
                  href={`/profile/${notification.sender._id}`}
                  className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                  onClick={(e) => handleNotificationClick(notification, e)}
                >
                  <div className={styles.notificationContent}>
                    <div className={styles.avatar}>
                      <Image
                        src={notification.sender.avatar
                          ? `${process.env.NEXT_PUBLIC_API_URL}${notification.sender.avatar}`
                          : '/images/default-avatar.jpg'}
                        alt={notification.sender.username}
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className={styles.notificationText}>
                      <div>
                        <span className={styles.username}>{notification.sender.username}</span>
                        <span className={styles.action}> {getNotificationText(notification)}</span>
                      </div>
                      <div className={styles.time}>
                        <TimeAgo date={notification.createdAt} formatter={formatter} />
                      </div>
                    </div>
                    {previewImage && (
                      <div className={styles.previewImage}>
                        <Image
                          src={previewImage}
                          alt="Aperçu"
                          width={60}
                          height={60}
                        />
                      </div>
                    )}
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
