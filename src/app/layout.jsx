'use client';

import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import Navbar from '@/components/layout/Navbar';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Pages d'authentification
const authPages = ['/login', '/register', '/forgot-password', '/reset-password']

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = authPages.includes(pathname);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Nettoyer les URLs dans le localStorage au démarrage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        
        // Fonction pour nettoyer une URL
        const cleanImageUrl = (url) => {
          if (!url) return null;
          // Si l'URL contient déjà l'API URL, extraire le chemin relatif
          if (url.includes('http://localhost:')) {
            const match = url.match(/(?:uploads\/[^"]+)/);
            return match ? `/${match[0]}` : null;
          }
          return url.startsWith('/') ? url : `/${url}`;
        };
        
        // Nettoyer les URLs des images
        const cleanedUser = {
          ...userData,
          avatar: cleanImageUrl(userData.avatar),
          coverPhoto: cleanImageUrl(userData.coverPhoto)
        };
        
        // Sauvegarder les données nettoyées
        localStorage.setItem('user', JSON.stringify(cleanedUser));
      }
    } catch (error) {
      console.error('Error cleaning localStorage:', error);
    }
  }, []);

  useEffect(() => {
    // Charger les posts de l'utilisateur connecté
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/user/${userData._id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPosts(data.posts);
          }
        })
        .catch(err => console.error('Erreur lors du chargement des posts:', err));
    }
  }, []);

  return (
    <html lang="fr">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            <NotificationProvider>
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: '#333',
                    color: '#fff',
                  },
                }}
              />
              {!isAuthPage && <Navbar posts={posts} />}
              <main className="container">
                {children}
              </main>
            </NotificationProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
