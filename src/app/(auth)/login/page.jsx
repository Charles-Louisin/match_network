'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import styles from '../styles/auth.module.css';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!formData.email) {
      setError('L\'adresse email est requise');
      return false;
    }
    if (!formData.password) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Une erreur est survenue';
        
        // Messages d'erreur spécifiques basés sur le code d'erreur
        switch (response.status) {
          case 401:
            errorMessage = 'Email ou mot de passe incorrect';
            break;
          case 404:
            errorMessage = 'Compte non trouvé. Veuillez vous inscrire';
            break;
          case 422:
            errorMessage = 'Format d\'email invalide';
            break;
          default:
            errorMessage = data.message || 'Erreur de connexion';
        }
        
        throw new Error(errorMessage);
      }

      // Stocker les informations de l'utilisateur
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Afficher un message de succès avec le nom d'utilisateur
      toast.success(`Bienvenue ${data.user.username} ! Vous allez être redirigé vers la page d'accueil.`);

      // Rediriger après un court délai
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        <h1 className={styles.title}>Bienvenue sur Match</h1>
        <p className={styles.subtitle}>Connectez-vous pour continuer</p>

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
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${error && error.includes('email') ? styles.inputError : ''}`}
              placeholder="exemple@email.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${error && error.includes('mot de passe') ? styles.inputError : ''}`}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className={styles.divider}>ou</div>

        <button className={`${styles.button} ${styles.googleButton}`}>
          <FcGoogle size={20} />
          Continuer avec Google
        </button>

        <div className={styles.links}>
          <Link href="/forgot-password" className={styles.link}>
            Mot de passe oublié ?
          </Link>
          <p>
            Pas encore de compte ?{' '}
            <Link href="/register" className={styles.link}>
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}