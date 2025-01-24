'use client'

import { useEffect } from 'react'
import styles from './Modal.module.css'

export default function Modal({ children, onClose }) {
  useEffect(() => {
    // Désactiver le défilement du body quand le modal est ouvert
    document.body.style.overflow = 'hidden'
    
    // Réactiver le défilement quand le modal est fermé
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Fermer le modal quand on clique sur l'overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  )
}
