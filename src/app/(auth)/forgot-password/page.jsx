'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './forgot-password.module.css'

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l&apos;envoi du code')
      }

      setSuccess('Code envoyé avec succès ! Vérifiez votre email.')
      // Stocker l'email pour la vérification OTP
      localStorage.setItem('resetEmail', email)
      // Rediriger vers la page de vérification OTP
      router.push('/verify-otp')
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1>Mot de passe oublié</h1>
        <p>Entrez votre email pour recevoir un code de réinitialisation</p>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit">Envoyer le code</button>

        <div className={styles.links}>
          <Link href="/login">Retour à la connexion</Link>
        </div>
      </form>
    </div>
  )
} 