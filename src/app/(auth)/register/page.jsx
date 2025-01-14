'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './register.module.css'

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    gender: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          gender: formData.gender,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l&apos;inscription')
      }

      // Stocker le token et rediriger
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/')
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1>Créer un compte</h1>
        
        <input
          type="text"
          placeholder="Nom d&apos;utilisateur"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
        />

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />

        <select
          value={formData.gender}
          onChange={(e) => setFormData({...formData, gender: e.target.value})}
        >
          <option value="">Sélectionnez votre genre</option>
          <option value="male">Homme</option>
          <option value="female">Femme</option>
          <option value="other">Autre</option>
        </select>

        <input
          type="password"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />

        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
        />

        <button type="submit">S&apos;inscrire</button>

        <div className={styles.links}>
          <Link href="/login">Déjà inscrit ? Se connecter</Link>
        </div>
      </form>
    </div>
  )
} 