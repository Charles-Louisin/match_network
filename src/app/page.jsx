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

  useEffect(() => {
    setIsClient(true)
    const token = window?.localStorage?.getItem('token')
    const user = window?.localStorage?.getItem('user')
    if (!token || !user) {
      router.push('/login')
    }
  }, [router])

  const handlePostCreated = () => {
    setRefreshKey(prevKey => prevKey + 1)
  }

  if (!isClient) {
    return null // ou un loader
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.feedContainer}>
          <Stories />
          <CreatePost onPostCreated={handlePostCreated} />
          <PostList key={refreshKey} />
        </div>

        <aside className={styles.sidebar}>
          <FriendSuggestions />
        </aside>
      </main>
    </>
  )
}
