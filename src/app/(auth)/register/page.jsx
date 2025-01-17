'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import styles from '../styles/auth.module.css';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    gender: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!formData.username) {
      setError('Le nom d\'utilisateur est requis');
      return false;
    }
    if (!formData.email) {
      setError('L\'adresse email est requise');
      return false;
    }
    if (!formData.gender) {
      setError('Le genre est requis');
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
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          gender: formData.gender,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Une erreur est survenue';
        
        switch (response.status) {
          case 409:
            errorMessage = 'Cet email ou nom d\'utilisateur existe déjà';
            break;
          case 422:
            errorMessage = 'Format d\'email invalide';
            break;
          case 400:
            errorMessage = data.message || 'Données invalides';
            break;
          default:
            errorMessage = data.message || 'Erreur lors de l\'inscription';
        }
        
        throw new Error(errorMessage);
      }

      toast.success('Inscription réussie ! Vous allez être redirigé vers la page de connexion.');
      setTimeout(() => {
        router.push('/login');
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
        <h1 className={styles.title}>Créer un compte</h1>
        <p className={styles.subtitle}>Rejoignez la communauté Match</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>
              Nom d&apos;utilisateur
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`${styles.input} ${error && error.includes('utilisateur') ? styles.inputError : ''}`}
              placeholder="votre_nom"
              required
            />
          </div>

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
            <label htmlFor="gender" className={styles.label}>
              Genre
            </label>
            <select
              value={formData.gender}
              onChange={handleChange}
              name="gender"
              className={`${styles.input} ${error && error.includes('genre') ? styles.inputError : ''}`}
              required
            >
              <option value="">Sélectionnez votre genre</option>
              <option value="male">Homme</option>
              <option value="female">Femme</option>
              <option value="other">Autre</option>
            </select>
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

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`${styles.input} ${error && error.includes('correspondent') ? styles.inputError : ''}`}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Inscription...' : 'Créer un compte'}
          </button>
        </form>

        <div className={styles.divider}>ou</div>

        <button className={`${styles.button} ${styles.googleButton}`}>
          <FcGoogle size={20} />
          Continuer avec Google
        </button>

        <div className={styles.links}>
          <p>
            Déjà inscrit ?{' '}
            <Link href="/login" className={styles.link}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}