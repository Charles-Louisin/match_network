'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Stories from '@/components/story/Stories'
import CreatePost from '@/components/post/CreatePost'
import PostList from '@/components/post/PostList'
import FriendSuggestions from '@/components/layout/FriendSuggestions'
import styles from './page.module.css'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))
    console.log(token);
    if (!token || !user) {
      router.push('/login')
    }
  }, [router])

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.feedContainer}>
          <Stories />
          <CreatePost />
          <PostList />
        </div>

        <aside className={styles.sidebar}>
          <FriendSuggestions />
        </aside>
      </main>
    </>
  )
}
