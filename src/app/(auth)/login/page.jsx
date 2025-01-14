'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import styles from './login.module.css'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion')
      }

      // Stockage du token et des données utilisateur
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Notification de succès
      toast.success('Connexion réussie')
      
      // Redirection
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Erreur de connexion:', error)
      toast.error(error.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1>Connexion</h1>
        
        <div className={styles.formGroup}>
          <input
            type="email"
            name="email"
            placeholder="Nom d&apos;utilisateur ou email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </button>

        <div className={styles.links}>
          <Link href="/register">
            Pas encore inscrit ? S&apos;inscrire
          </Link>
          <Link href="/forgot-password">
            Mot de passe oublié ?
          </Link>
        </div>
      </form>
    </div>
  )
}