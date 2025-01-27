'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './PhotoUpload.module.css'
import { FaCamera } from 'react-icons/fa'
import { toast } from 'react-hot-toast'

export default function PhotoUpload({ type, currentImage, onUpload }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`L'image ne doit pas dépasser 10MB`)
        return
      }
      setSelectedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
      setIsModalOpen(true)
    }
  }

  const handleUpload = async () => {
    if (selectedImage) {
      try {
        setIsLoading(true)
        await onUpload(selectedImage)
        setIsModalOpen(false)
        setSelectedImage(null)
        setPreviewUrl(null)
        toast.success('Photo mise à jour avec succès')
      } catch (error) {
        console.error('Erreur lors de l&apos;upload:', error)
        toast.error(error.message || `Erreur lors de l'upload de l'image`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className={styles.container}>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: 'none' }}
        id={`${type}-upload`}
      />
      <label htmlFor={`${type}-upload`} className={`${styles.uploadButton} ${isLoading ? styles.loading : ''}`}>
        <FaCamera />
        {/* <div className={styles.loadingDot}></div> */}
      </label>

      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Aperçu de l&lsquo;image</h3>
            <div className={`${styles.previewContainer} ${type === 'avatar' ? styles.avatarPreview : styles.coverPreview}`}>
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className={styles.preview}
                />
              )}
            </div>
            <div className={styles.modalButtons}>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedImage(null)
                  setPreviewUrl(null)
                }}
                className={styles.cancelButton}
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                className={styles.saveButton}
                onClick={handleUpload}
                disabled={isLoading}
              >
                {isLoading ? 'Chargement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}