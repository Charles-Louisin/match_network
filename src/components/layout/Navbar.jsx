'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaHome, FaBell, FaUsers, FaEnvelope, FaMoon, FaSun, FaSignOutAlt } from 'react-icons/fa';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';
import Avatar from '@/components/common/Avatar';
import styles from './Navbar.module.css';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, friendRequests } = useNotifications();

  useEffect(() => {
    // Écouter les changements dans le localStorage
    const handleStorageChange = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      } else {
        setUser(null);
      }
    };

    // Initialiser l'état
    handleStorageChange();

    // Ajouter l'écouteur d'événements
    window.addEventListener('storage', handleStorageChange);
    
    // Vérifier les changements toutes les 5 secondes
    const interval = setInterval(handleStorageChange, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isActive = (path) => pathname === path;

  return (
    <nav className={`${styles.navbar} ${theme === 'dark' ? styles.dark : ''}`}>
      <div className={styles.leftSection}>
        <Link href="/" className={styles.logo}>
          <Image 
            src="/images/logo.png" 
            alt="Logo" 
            width={40} 
            height={40}
            priority
          />
          <span className={styles.appName}>MATCH</span>
        </Link>
      </div>

      <div className={styles.centerSection}>
        <Link href="/" className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}>
          <FaHome className={styles.icon} />
          <span className={styles.linkText}>Accueil</span>
        </Link>
        
        <Link href="/notifications" className={`${styles.navLink} ${isActive('/notifications') ? styles.active : ''}`}>
          <div className={styles.notificationContainer}>
            <FaBell className={styles.icon} />
            {unreadCount > 0 && (
              <span className={styles.notificationBadge}>{unreadCount}</span>
            )}
          </div>
          <span className={styles.linkText}>Notifications</span>
        </Link>

        <Link href="/friends" className={`${styles.navLink} ${isActive('/friends') ? styles.active : ''}`}>
          <div className={styles.iconContainer}>
            <FaUsers className={styles.icon} />
            {friendRequests > 0 && (
              <span className={styles.badge}>{friendRequests}</span>
            )}
          </div>
          <span className={styles.linkText}>Amis</span>
        </Link>

        <Link href="/messages" className={`${styles.navLink} ${isActive('/messages') ? styles.active : ''}`}>
          <FaEnvelope className={styles.icon} />
          <span className={styles.linkText}>Messages</span>
        </Link>
      </div>

      <div className={styles.rightSection}>
        <button onClick={toggleTheme} className={styles.themeToggle}>
          {theme === 'light' ? <FaMoon className={styles.icon} /> : <FaSun className={styles.icon} />}
        </button>

        {user && (
          <>
            <Link href={`/profile/${user._id}`} className={styles.profileLink}>
              <Avatar
                src={user.avatar}
                alt={user.username}
                size="medium"
                priority
              />
            </Link>
            <button onClick={handleLogout} className={styles.logoutButton}>
              <FaSignOutAlt className={styles.icon} />
            </button>
          </>
        )}
      </div>
    </nav>
  );
}