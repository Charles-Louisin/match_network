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
      const token = localStorage.getItem('token');
      
      if (userStr && token) {
        try {
          const userData = JSON.parse(userStr);
          // Normaliser l'ID utilisateur
          if (userData && (userData._id || userData.id)) {
            const normalizedUser = {
              ...userData,
              _id: userData._id || userData.id // Utiliser _id ou id
            };
            setUser(normalizedUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    // Initialiser l'état
    handleStorageChange();

    // Ajouter l'écouteur d'événements
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    console.log('Current user state:', user);
  }, [user]);

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
            width={70} 
            height={70}
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

        {user && (user._id || user.id) && (
          <>
            <Link 
              href={`/profile/${user._id || user.id}`} 
              className={styles.profileLink}
            >
              <Image
                src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : "/images/default-avatar.jpg"}
                alt="Profile"
                width={40}
                height={40}
                className={styles.userAvatar}
                onError={(e) => {
                  if (!e.target.src.includes("/images/default-avatar.jpg")) {
                    e.target.src = "/images/default-avatar.jpg";
                  }
                }}
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