import { useState, useRef } from 'react';
import styles from './EditProfileModal.module.css';
import { validateImage } from '@/utils/imageValidation';
import { toast } from 'react-hot-toast';

export default function EditProfileModal({ profile, onClose, onSave }) {
  const [editedProfile, setEditedProfile] = useState({
    username: profile.username || '',
    bio: profile.bio || '',
    location: profile.location || '',
    birthDate: profile.birthDate || '',
    birthPlace: profile.birthPlace || '',
    gender: profile.gender || '',
    education: profile.education || '',
    occupation: profile.occupation || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [previewCover, setPreviewCover] = useState(null);

  const handleImageUpload = async (file, type) => {
    const validation = validateImage(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return null;
    }

    // Créer l'URL de prévisualisation
    const previewUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      setPreviewAvatar(previewUrl);
      setIsUploadingAvatar(true);
    } else {
      setPreviewCover(previewUrl);
      setIsUploadingCover(true);
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      toast.error('Erreur lors du téléchargement de l\'image');
      return null;
    } finally {
      if (type === 'avatar') {
        setIsUploadingAvatar(false);
      } else {
        setIsUploadingCover(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!editedProfile.username.trim()) {
        toast.error('Username is required');
        return;
      }

      console.log("Submitting profile update:", editedProfile);
      await onSave(editedProfile);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Edit Profile</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Username*</label>
            <input
              type="text"
              value={editedProfile.username}
              onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter username"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bio</label>
            <textarea
              value={editedProfile.bio}
              onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Write something about yourself..."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Location</label>
            <input
              type="text"
              value={editedProfile.location}
              onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Add your location"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Birth Date</label>
            <input
              type="date"
              value={editedProfile.birthDate}
              onChange={(e) => setEditedProfile(prev => ({ ...prev, birthDate: e.target.value }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Birth Place</label>
            <input
              type="text"
              value={editedProfile.birthPlace}
              onChange={(e) => setEditedProfile(prev => ({ ...prev, birthPlace: e.target.value }))}
              placeholder="Add your birth place"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Gender</label>
            <select
              value={editedProfile.gender}
              onChange={(e) => setEditedProfile(prev => ({ ...prev, gender: e.target.value }))}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Education</label>
            <input
              type="text"
              value={editedProfile.education}
              onChange={(e) => setEditedProfile(prev => ({ ...prev, education: e.target.value }))}
              placeholder="Add your education"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Occupation</label>
            <input
              type="text"
              value={editedProfile.occupation}
              onChange={(e) => setEditedProfile(prev => ({ ...prev, occupation: e.target.value }))}
              placeholder="Add your occupation"
            />
          </div>

          <div className={styles.relative}>
            {isUploadingAvatar && (
              <div className={styles.absolute + ' ' + styles.inset0 + ' ' + styles.flex + ' ' + styles.itemsCenter + ' ' + styles.justifyCenter + ' ' + styles.bgBlack + ' ' + styles.bgOpacity50 + ' ' + styles.roundedFull}>
                <div className={styles.animateSpin + ' ' + styles.roundedFull + ' ' + styles.h8 + ' ' + styles.w8 + ' ' + styles.borderT2 + ' ' + styles.borderB2 + ' ' + styles.borderBlue500}></div>
              </div>
            )}
            {previewAvatar && (
              <img src={previewAvatar} alt="Avatar preview" className={styles.w24 + ' ' + styles.h24 + ' ' + styles.roundedFull} />
            )}
            <input
              type="file"
              onChange={(e) => handleImageUpload(e.target.files[0], 'avatar')}
              accept="image/*"
            />
          </div>

          <div className={styles.relative}>
            {isUploadingCover && (
              <div className={styles.absolute + ' ' + styles.inset0 + ' ' + styles.flex + ' ' + styles.itemsCenter + ' ' + styles.justifyCenter + ' ' + styles.bgBlack + ' ' + styles.bgOpacity50}>
                <div className={styles.animateSpin + ' ' + styles.roundedFull + ' ' + styles.h8 + ' ' + styles.w8 + ' ' + styles.borderT2 + ' ' + styles.borderB2 + ' ' + styles.borderBlue500}></div>
              </div>
            )}
            {previewCover && (
              <img src={previewCover} alt="Cover preview" className={styles.wFull + ' ' + styles.h48 + ' ' + styles.objectCover} />
            )}
            <input
              type="file"
              onChange={(e) => handleImageUpload(e.target.files[0], 'cover')}
              accept="image/*"
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingAvatar || isUploadingCover}
              className={styles.saveButton + ' ' + styles.bgBlue500 + ' ' + styles.textWhite + ' ' + styles.px4 + ' ' + styles.py2 + ' ' + styles.rounded + ' ' + styles.disabled + ' ' + styles.opacity50}
            >
              {isLoading ? (
                <div className={styles.flex + ' ' + styles.itemsCenter}>
                  <div className={styles.animateSpin + ' ' + styles.roundedFull + ' ' + styles.h4 + ' ' + styles.w4 + ' ' + styles.borderT2 + ' ' + styles.borderB2 + ' ' + styles.borderWhite + ' ' + styles.mr2}></div>
                  Sauvegarde...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
