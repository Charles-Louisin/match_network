'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import styles from '../styles/auth.module.css';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!email) {
      setError('L\'adresse email est requise');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Format d\'email invalide');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Une erreur est survenue';
        
        switch (response.status) {
          case 404:
            errorMessage = 'Aucun compte associé à cette adresse email';
            break;
          case 422:
            errorMessage = 'Format d\'email invalide';
            break;
          case 429:
            errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
            break;
          default:
            errorMessage = data.message || 'Erreur lors de l\'envoi du code';
        }
        
        throw new Error(errorMessage);
      }

      localStorage.setItem('resetEmail', email);
      toast.success('Un code de réinitialisation a été envoyé à votre adresse email');
      router.push('/verify-otp');
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setError('');
    setEmail(e.target.value);
  };

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
        <h1 className={styles.title}>Mot de passe oublié ?</h1>
        <p className={styles.subtitle}>
          Entrez votre email pour recevoir un code de réinitialisation
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleChange}
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder="exemple@email.com"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Envoi...' : 'Envoyer le code'}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/login" className={styles.link}>
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}