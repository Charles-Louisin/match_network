'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { FiHome, FiUsers, FiMessageSquare, FiBell, FiLogOut, FiSun, FiMoon } from 'react-icons/fi';
import styles from './Navbar.module.css';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    setMounted(true);
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('User data:', parsedUser);
      setUser(parsedUser);
    }
  }, []);

  useEffect(() => {
    const fetchPendingRequestsCount = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/requests/pending`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        console.log('Pending requests:', data);
        setPendingRequests(data.length);
      } catch (error) {
        console.error('Error fetching pending requests count:', error);
      }
    };

    if (user) {
      // Vérifier les demandes toutes les 30 secondes
      fetchPendingRequestsCount();
      const interval = setInterval(fetchPendingRequestsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
              alt="Match Logo"
              width={52}
              height={52}
              className={styles.logoImage}
              priority
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
            <FiBell size={20} />
            <span>Notifications</span>
          </Link>
          <Link href="/messagerie" className={`${styles.navLink} ${pathname === '/messagerie' ? styles.active : ''}`}>
            <FiMessageSquare size={20} />
            <span>Messages</span>
          </Link>
        </div>

        <div className={styles.rightSection}>
          <button
            className={styles.iconButton}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          {user && (
            <Link href={`/profile/${user.id}`} className={styles.profileLink}>
              <Image
                src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : '/images/default-avatar.jpg'}
                alt="Profile"
                width={32}
                height={32}
                className={styles.profileImage}
                priority
                onError={(e) => {
                  if (!e.target.src.includes('/images/default-avatar.jpg')) {
                    e.target.src = '/images/default-avatar.jpg';
                  }
                }}
              />
            </Link>
          )}
          <button 
            className={styles.iconButton} 
            onClick={handleLogout}
            aria-label="Logout"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>

      {/* Version Mobile */}
      <div className={styles.topBar}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/images/logo.png"
            alt="Match Logo"
            width={25}
            height={25}
            className={styles.logoImage}
            priority
          />
          <span className={styles.logoText}>Match</span>
        </Link>

        <div className={styles.rightControls}>
          <button 
            className={styles.iconButton} 
            onClick={handleLogout}
            aria-label="Logout"
          >
            <FiLogOut size={20} />
          </button>
          <button
            className={styles.iconButton}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
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
            <FiBell size={20} />
            <span>Notifications</span>
          </Link>
          <Link href="/messagerie" className={`${styles.navLink} ${pathname === '/messagerie' ? styles.active : ''}`}>
            <FiMessageSquare size={20} />
            <span>Messages</span>
          </Link>
          {user && (
            <Link 
              href={`/profile/${user.id}`} 
              className={`${styles.navLink} ${pathname === `/profile/${user.id}` ? styles.active : ''}`}
            >
              <Image
                src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : '/images/default-avatar.jpg'}
                alt="Profile"
                width={24}
                height={24}
                className={styles.profileImage}
                priority
                onError={(e) => {
                  if (!e.target.src.includes('/images/default-avatar.jpg')) {
                    e.target.src = '/images/default-avatar.jpg';
                  }
                }}
              />
              <span>Profil</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}