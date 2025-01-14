'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './verify-otp.module.css'

export default function VerifyOTP() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))])

    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpValue = otp.join('')
    const email = localStorage.getItem('resetEmail')

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpValue
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Code OTP invalide')
      }

      // Stocker l'OTP vérifié pour la réinitialisation du mot de passe
      localStorage.setItem('verifiedOtp', otpValue)
      router.push('/reset-password')
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1>Vérification du code</h1>
        <p>Entrez le code reçu par email</p>
        
        <div className={styles.otpInputs}>
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>

        <button type="submit">Vérifier</button>
      </form>
    </div>
  )
} 