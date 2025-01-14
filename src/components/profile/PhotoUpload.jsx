'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './PhotoUpload.module.css'

export default function PhotoUpload({ type, currentImage, onUpload }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La taille du fichier doit être inférieure à 5MB')
        return
      }
      setSelectedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
      setIsModalOpen(true)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (selectedImage) {
      try {
        await onUpload(selectedImage)
        setIsModalOpen(false)
        setSelectedImage(null)
        setPreviewUrl(null)
        setError(null)
      } catch (error) {
        setError(error.message || 'Erreur lors du téléchargement')
        console.error('Erreur lors du téléchargement:', error)
      }
    }
  }

  useEffect(() => {
    // Nettoyer l'URL de prévisualisation lors du démontage du composant
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <>
      <label className={type === 'coverPhoto' ? styles.editCoverButton : styles.editAvatarButton}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          hidden
        />
        <i className="fas fa-camera"></i>
        {type === 'coverPhoto' && 'Modifier la photo de couverture'}
      </label>

      {error && <div className={styles.error}>{error}</div>}

      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Aperçu de l'image</h3>
            
            <div className={styles.previewContainer}>
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className={styles.preview}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedImage(null)
                  setPreviewUrl(null)
                  setError(null)
                }}
              >
                Annuler
              </button>
              <button
                className={styles.saveButton}
                onClick={handleUpload}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}