import { useState } from 'react';
import styles from './EditProfileModal.module.css';
import { toast } from 'sonner';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editedProfile.username.trim()) {
      toast.error('Username is required');
      return;
    }

    try {
      console.log("Submitting profile update:", editedProfile);
      await onSave(editedProfile);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
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

          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
