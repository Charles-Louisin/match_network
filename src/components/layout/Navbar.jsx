'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { FiHome, FiUsers, FiBell, FiMessageCircle, FiLogOut, FiSun, FiMoon } from 'react-icons/fi';
import { getImageUrl } from '@/utils/imageUtils';
import { useNotifications } from '@/hooks/useNotifications';
import styles from './Navbar.module.css';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const { unreadCount, fetchUnreadCount } = useNotifications();

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/requests/pending`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const receivedRequests = data.filter(request => !request.isCurrentUserSender);
          setPendingRequests(receivedRequests.length || 0);
        }
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };

    if (user) {
      fetchPendingRequests();
      const interval = setInterval(fetchPendingRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!mounted) return null;

  return (
    <nav className={styles.navbar}>
      {/* Version PC */}
      <div className={styles.navContainer}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={52}
              height={52}
              className={styles.logoImage}
            />
            <span className={styles.logoText}>Match</span>
          </Link>
        </div>

        <div className={styles.centerSection}>
          <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}>
            <FiHome size={20} />
            <span>Accueil</span>
          </Link>
          <Link href="/friends" className={`${styles.navLink} ${pathname === '/friends' ? styles.active : ''}`}>
            <div className={styles.iconContainer}>
              <FiUsers size={20} />
              {pendingRequests > 0 && (
                <span className={styles.badge}>{pendingRequests}</span>
              )}
            </div>
            <span>Amis</span>
          </Link>
          <Link href="/notifications" className={`${styles.navLink} ${pathname === '/notifications' ? styles.active : ''}`}>
            <div className={styles.iconContainer}>
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount}</span>
              )}
            </div>
            <span>Notifications</span>
          </Link>
          <Link href="/messagerie" className={`${styles.navLink} ${pathname === '/messagerie' ? styles.active : ''}`}>
            <FiMessageCircle size={20} />
            <span>Messagerie</span>
          </Link>
        </div>

        <div className={styles.rightSection}>
          <button
            className={styles.iconButton}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          {user && (
            <>
              <Link href={`/profile/${user.id}`} className={styles.iconButton}>
                <Image
                  src={user.avatar ? getImageUrl(user.avatar) : '/images/default-avatar.jpg'}
                  alt="Profile"
                  width={32}
                  height={32}
                  className={styles.profileImage}
                />
              </Link>
              <button onClick={handleLogout} className={styles.iconButton}>
                <FiLogOut size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Version Mobile */}
      <div className={styles.topBar}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={25}
            height={25}
            className={styles.logoImage}
          />
          <span className={styles.logoText}>Match</span>
        </Link>
        <div className={styles.rightControls}>
          <button
            className={styles.iconButton}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          <button onClick={handleLogout} className={styles.iconButton}>
            <FiLogOut size={20} />
          </button>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.navigation}>
          <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}>
            <FiHome size={20} />
            <span>Accueil</span>
          </Link>
          <Link href="/friends" className={`${styles.navLink} ${pathname === '/friends' ? styles.active : ''}`}>
            <div className={styles.iconContainer}>
              <FiUsers size={20} />
              {pendingRequests > 0 && (
                <span className={styles.badge}>{pendingRequests}</span>
              )}
            </div>
            <span>Amis</span>
          </Link>
          <Link href="/notifications" className={`${styles.navLink} ${pathname === '/notifications' ? styles.active : ''}`}>
            <div className={styles.iconContainer}>
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount}</span>
              )}
            </div>
            <span>Notifications</span>
          </Link>
          <Link href="/messagerie" className={`${styles.navLink} ${pathname === '/messagerie' ? styles.active : ''}`}>
            <FiMessageCircle size={20} />
            <span>Messagerie</span>
          </Link>
          {user && (
            <Link href={`/profile/${user.id}`} className={`${styles.navLink} ${pathname === '/profile' ? styles.active : ''}`}>
              <Image
                src={user.avatar ? getImageUrl(user.avatar) : '/images/default-avatar.jpg'}
                alt="Profile"
                width={24}
                height={24}
                className={styles.profileImage}
              />
              <span>Profil</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}