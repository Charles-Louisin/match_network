'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import styles from '../styles/auth.module.css';

export default function VerifyOTP() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('resetEmail');
    if (!storedEmail) {
      router.push('/forgot-password');
    } else {
      setEmail(storedEmail);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Code invalide');
      }

      localStorage.setItem('verifiedOtp', otp);
      toast.success('Code vérifié avec succès !');
      router.push('/reset-password');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <Image
          src="/images/logo.png"
          alt="Match Logo"
          width={80}
          height={80}
          className={styles.logo}
          priority
        />
        <h1 className={styles.title}>Vérification du code</h1>
        <p className={styles.subtitle}>
          Entrez le code à 6 chiffres envoyé à {email}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="otp" className={styles.label}>
              Code de vérification
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={styles.input}
              placeholder="000000"
              maxLength={6}
              pattern="[0-9]{6}"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Vérification...' : 'Vérifier le code'}
          </button>
        </form>

        <div className={styles.links}>
          <button
            onClick={() => router.push('/forgot-password')}
            className={styles.link}
          >
            Renvoyer le code
          </button>
        </div>
      </div>
    </div>
  );
}