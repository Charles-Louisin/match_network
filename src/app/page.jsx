'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Stories from '@/components/story/Stories'
import CreatePost from '@/components/post/CreatePost'
import PostList from '@/components/post/PostList'
import FriendSuggestions from '@/components/layout/FriendSuggestions'
import styles from './page.module.css'

export default function Home() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [posts, setPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    setIsClient(true)
    const token = window?.localStorage?.getItem('token')
    const userStr = window?.localStorage?.getItem('user')
    if (!token || !userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    setCurrentUser(user)
  }, [router])

  useEffect(() => {
    if (currentUser) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/user/${currentUser._id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPosts(data.posts)
          }
        })
        .catch(err => console.error('Erreur lors du chargement des posts:', err))
    }
  }, [currentUser])

  const handlePostCreated = () => {
    setRefreshKey(prevKey => prevKey + 1)
  }

  if (!isClient) {
    return null
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.feedContainer}>
          <Stories />
          <CreatePost 
            posts={posts} 
            userId={currentUser?._id} 
            onPostCreated={handlePostCreated} 
          />
          <PostList key={refreshKey} />
        </div>

        <aside className={styles.sidebar}>
          <FriendSuggestions />
        </aside>
      </main>
    </>
  )
}
