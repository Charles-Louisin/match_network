'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { FiHome, FiUsers, FiBell, FiMessageCircle, FiLogOut, FiSun, FiMoon } from 'react-icons/fi';
import { getImageUrl } from '@/utils/constants';
import { useNotifications } from '@/hooks/useNotifications';
import styles from './Navbar.module.css';

export default function Navbar({ user, posts }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const { unreadCount, fetchUnreadCount } = useNotifications();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        console.log('Navbar - User data loaded:', userData);
        setCurrentUser(userData);
      } catch (e) {
        console.error('Navbar - Error parsing user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Navbar - handleStorageChange appelé');
      const userStr = localStorage.getItem('user');
      console.log('Navbar - Données utilisateur du localStorage:', userStr);
      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log('Navbar - Données utilisateur parsées:', userData);
        console.log('Navbar - Avatar de l\'utilisateur:', userData.avatar);
        setCurrentUser(userData);
      }
    };

    // Initial load
    handleStorageChange();

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for avatar updates
    const handleAvatarUpdate = (event) => {
      console.log('Navbar - Mise à jour de l\'avatar détectée:', event.detail);
      handleStorageChange();
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);

    // Nouvel événement pour le rafraîchissement des images
    const handleImageRefresh = (event) => {
      console.log('Navbar - Rafraîchissement des images détecté:', event.detail);
      handleStorageChange();
    };
    window.addEventListener('refreshUserImages', handleImageRefresh);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
      window.removeEventListener('refreshUserImages', handleImageRefresh);
    };
  }, []);

  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      const { avatar } = event.detail;
      // setUser(prev => ({ ...prev, avatar }));
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, []);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (currentUser) {
        await fetchUnreadCount();
      }
    };

    loadUnreadCount();

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(loadUnreadCount, 30000);

    // Écouter les événements de notification
    const handleNewNotification = () => {
      loadUnreadCount();
    };

    window.addEventListener('newNotification', handleNewNotification);

    return () => {
      clearInterval(interval);
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, [currentUser, fetchUnreadCount]);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Trouver le dernier post de l'utilisateur actuel pour obtenir ses informations à jour
  const userPost = posts?.find(post => user && post.user._id === user._id);
  const userInfo = userPost?.user || user;

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
          {currentUser && (
            <>
              <Link href={`/profile/${currentUser.id}`} className={styles.iconButton}>
                <Image
                  src={currentUser.avatar ? getImageUrl(currentUser.avatar) : '/images/default-avatar.jpg'}
                  alt={currentUser.username || 'Avatar utilisateur'}
                  width={42}
                  height={42}
                  className={styles.avatar}
                  priority={true}
                  unoptimized={true}
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
          {currentUser && (
            <Link href={`/profile/${currentUser._id}`} className={`${styles.navLink} ${pathname === '/profile' ? styles.active : ''}`}>
              <Image
                src={currentUser.avatar ? getImageUrl(currentUser.avatar) : '/images/default-avatar.jpg'}
                alt={currentUser.username || 'Avatar utilisateur'}
                width={24}
                height={24}
                className={styles.avatar}
              />
              <span>Profil</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}