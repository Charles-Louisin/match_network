'use client'

import { useEffect } from 'react'
import styles from './Modal.module.css'

export default function Modal({ children, onClose }) {
  useEffect(() => {
    // Empêcher le défilement du body quand le modal est ouvert
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  )
}
