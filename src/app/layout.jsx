'use client';

import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import Navbar from '@/components/layout/Navbar';
import { usePathname } from 'next/navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Pages d'authentification
const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = authPages.includes(pathname);

  return (
    <html lang="fr">
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            <NotificationProvider>
              <Toaster position="top-center" richColors />
              {!isAuthPage && <Navbar />}
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
