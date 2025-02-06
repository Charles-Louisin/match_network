'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './PhotoUpload.module.css'
import { FaCamera } from 'react-icons/fa'
import { toast } from 'react-hot-toast'
import { getImageUrl } from '@/utils/constants';

export default function PhotoUpload({ type, currentImage, onUpload }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    console.log('PhotoUpload - Fichier sélectionné:', file);

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        console.log('PhotoUpload - Fichier trop grand');
        toast.error(`L'image ne doit pas dépasser 10MB`)
        return
      }

      console.log('PhotoUpload - Création de l\'URL de prévisualisation');
      setSelectedFile(file)
      const previewUrl = URL.createObjectURL(file)
      console.log('PhotoUpload - URL de prévisualisation créée:', previewUrl);
      setPreviewUrl(previewUrl)
      setIsModalOpen(true)
      // Empêcher l'ouverture de l'image
      e.preventDefault()
    }
  }

  const handleUpload = async () => {
    console.log('PhotoUpload - Début de handleUpload');
    try {
      if (!selectedFile) {
        console.log('PhotoUpload - Pas de fichier sélectionné');
        toast.error("Veuillez sélectionner une image");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.log('PhotoUpload - Pas de token');
        toast.error("Veuillez vous reconnecter");
        return;
      }

      console.log('PhotoUpload - Préparation du FormData');
      const formData = new FormData();
      formData.append("image", selectedFile);

      const endpoint = type === "avatar" ? "upload-avatar" : "upload-coverPhoto";
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/users/${endpoint}`;
      console.log('PhotoUpload - URL de l\'endpoint:', url);
      console.log('PhotoUpload - Type de fichier:', selectedFile.type);
      console.log('PhotoUpload - Taille du fichier:', selectedFile.size);

      console.log('PhotoUpload - Envoi de la requête');
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('PhotoUpload - Statut de la réponse:', response.status);
      const responseText = await response.text();
      console.log('PhotoUpload - Texte de la réponse:', responseText);

      // Construire le chemin de l'image basé sur le nom du fichier
      const imagePath = `/uploads/${selectedFile.name}`;
      console.log('PhotoUpload - Chemin de l\'image construit:', imagePath);

      // Mise à jour du localStorage avec la nouvelle image
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        const updatedUser = {
          ...userData,
          [type === "avatar" ? "avatar" : "coverPhoto"]: imagePath
        };
        console.log('PhotoUpload - Mise à jour du localStorage avec:', updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Émettre l'événement de mise à jour
        const updateEvent = new CustomEvent('avatarUpdated', {
          detail: updatedUser
        });
        window.dispatchEvent(updateEvent);

        // Forcer le rafraîchissement des composants qui utilisent l'image
        const refreshEvent = new CustomEvent('refreshUserImages', {
          detail: { type, path: imagePath }
        });
        window.dispatchEvent(refreshEvent);
      }

      setIsModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);

      if (onUpload) {
        console.log('PhotoUpload - Appel de onUpload avec:', { [type === "avatar" ? "avatar" : "coverPhoto"]: imagePath });
        onUpload({ [type === "avatar" ? "avatar" : "coverPhoto"]: imagePath });
      }

      toast.success(`${type === "avatar" ? "Photo de profil" : "Photo de couverture"} mise à jour avec succès`);
    } catch (error) {
      console.error('PhotoUpload - Erreur complète:', error);
      toast.error(`Erreur lors de la mise à jour de la ${type === "avatar" ? "photo de profil" : "photo de couverture"}`);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className={styles.container} onClick={(e) => e.stopPropagation()}>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: 'none' }}
        id={`${type}-upload`}
      />
      <label htmlFor={`${type}-upload`} className={`${styles.uploadButton} ${isLoading ? styles.loading : ''}`}>
        <FaCamera />
      </label>

      {isModalOpen && (
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalContent}>
            <h3>Aperçu de l&apos;image</h3>
            <div className={`${styles.previewContainer} ${type === 'avatar' ? styles.avatarPreview : styles.coverPreview}`}>
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className={styles.preview}
                />
              )}
              {currentImage && !previewUrl && (
                <Image
                  src={getImageUrl(currentImage)}
                  alt="Current"
                  width={100}
                  height={100}
                  className={styles.previewImage}
                />
              )}
            </div>
            <div className={styles.modalButtons}>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedFile(null)
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