import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AiOutlineClose } from 'react-icons/ai';
import { BsImage, BsTextareaT } from 'react-icons/bs';
import styles from './Stories.module.css';
import TextareaAutosize from 'react-textarea-autosize';

const CreateStoryModal = ({ onClose, onCreate }) => {
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [background, setBackground] = useState('#1877f2');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximum : 10MB');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    try {
      console.log('=== DÉBUT CRÉATION STORY ===');
      console.log('État actuel:', {
        activeTab,
        text: text.trim(),
        background,
        hasFile: !!selectedFile,
        hasCaption: !!caption.trim()
      });

      if (activeTab === 'text' && !text.trim()) {
        alert('Veuillez entrer du texte pour votre story');
        return;
      }

      if (activeTab === 'media' && !selectedFile) {
        alert('Veuillez sélectionner un fichier');
        return;
      }

      if (activeTab === 'text') {
        console.log('Préparation story texte');
        const textContentObj = {
          text: text.trim(),
          background: background
        };
        console.log('Contenu texte préparé:', textContentObj);

        // Pour les stories texte, on envoie directement l'objet
        const storyData = {
          type: 'text',
          textContent: textContentObj
        };
        console.log('Données story texte à envoyer:', storyData);
        
        try {
          onCreate(storyData);
          console.log('Données envoyées avec succès au StoriesList');
        } catch (error) {
          console.error('Erreur lors de l\'envoi au StoriesList:', error);
          throw error;
        }
      } else {
        console.log('Préparation story média');
        // Pour les stories média, on utilise FormData
        const formData = new FormData();
        const type = selectedFile.type.startsWith('video/') ? 'video' : 'image';
        formData.append('type', type);
        formData.append('media', selectedFile);
        if (caption.trim()) {
          formData.append('caption', caption.trim());
        }
        console.log('FormData préparé avec:', {
          type,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          hasCaption: !!caption.trim()
        });
        
        try {
          onCreate(formData);
          console.log('FormData envoyé avec succès au StoriesList');
        } catch (error) {
          console.error('Erreur lors de l\'envoi au StoriesList:', error);
          throw error;
        }
      }

      console.log('=== FIN PRÉPARATION STORY ===');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la préparation de la story:', error);
      console.error('Stack trace:', error.stack);
      alert('Une erreur est survenue lors de la création de la story');
    }
  };

  const colorOptions = [
    '#1877f2', // Facebook blue
    '#E4405F', // Instagram pink
    '#34B7F1', // Light blue
    '#833AB4', // Purple
    '#FD1D1D', // Red
    '#F77737', // Orange
  ];

  return (
    <motion.div
      className={styles.createModalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.createStoryModal}
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className={styles.modalHeader}>
          <h3>Créer une story</h3>
          <button onClick={onClose} className={styles.modalCloseButton}>
            <AiOutlineClose size={24} />
          </button>
        </div>

        <div className={styles.tabButtons}>
          <button
            className={`${styles.tabButton} ${activeTab === 'text' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <BsTextareaT size={20} />
            <span>Texte</span>
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'media' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <BsImage size={20} />
            <span>Media</span>
          </button>
        </div>

        <div className={styles.modalContent}>
          {activeTab === 'text' ? (
            <div className={styles.textEditor}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Écrivez votre texte ici..."
                style={{ background }}
              />
              <div className={styles.colorPicker}>
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    className={`${styles.colorButton} ${background === color ? styles.activeColor : ''}`}
                    style={{ background: color }}
                    onClick={() => setBackground(color)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.mediaUpload}>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className={styles.fileInput}
                id="story-file"
              />
              {previewUrl ? (
                <div className={styles.mediaPreviewContainer}>
                  <div className={styles.mediaPreview}>
                    {selectedFile?.type.startsWith('video/') ? (
                      <video src={previewUrl} controls />
                    ) : (
                      <img src={previewUrl} alt="Preview" />
                    )}
                  </div>
                  <TextareaAutosize
                    minRows={2}
                    maxRows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ajouter une légende..."
                    className={styles.captionInput}
                  />
                </div>
              ) : (
                <label htmlFor="story-file" className={styles.uploadZone}>
                  <BsImage size={32} />
                  <p>Cliquez pour choisir une image ou une vidéo</p>
                  <span className={styles.supportedFormats}>
                    Formats supportés: JPG, PNG, MP4
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={activeTab === 'text' ? !text.trim() : !selectedFile}
          >
            Partager
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateStoryModal;
