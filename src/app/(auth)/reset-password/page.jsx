'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './reset-password.module.css'

export default function ResetPassword() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError(&apos;Les mots de passe ne correspondent pas&apos;)
      return
    }

    if (formData.newPassword.length < 6) {
      setError(&apos;Le mot de passe doit contenir au moins 6 caractères&apos;)
      return
    }

    try {
      const email = localStorage.getItem('resetEmail')
      const otp = localStorage.getItem('verifiedOtp')

      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || &apos;Erreur lors de la réinitialisation&apos;)
      }

      // Nettoyer le localStorage
      localStorage.removeItem('resetEmail')
      localStorage.removeItem('verifiedOtp')
      
      // Rediriger vers la page de connexion
      router.push('/login')
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1>Réinitialiser le mot de passe</h1>
        
        {error && <div className={styles.error}>{error}</div>}

        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={formData.newPassword}
          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
        />

        <input
          type="password"
          placeholder="Confirmer le nouveau mot de passe"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
        />

        <div className={styles.requirements}>
          <p>Le mot de passe doit contenir :</p>
          <ul>
            <li>Au moins 6 caractères</li>
            <li>Au moins une lettre majuscule</li>
            <li>Au moins un chiffre</li>
          </ul>
        </div>

        <button type="submit">Réinitialiser le mot de passe</button>
      </form>
    </div>
  )
} 