import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/utils/constants';
import styles from './PhotoNotificationModal.module.css';

const PhotoNotificationModal = ({ notification, onClose }) => {
  const isProfilePhoto = notification.type === 'PROFILE_PHOTO_UPDATED';
  const imageUrl = getImageUrl(notification.reference);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <Link href={`/profile/${notification.sender._id}`} className={styles.userInfo}>
            <Image
              src={getImageUrl(notification.sender.avatar)}
              alt={notification.sender.username}
              width={40}
              height={40}
              className={styles.avatar}
            />
            <span className={styles.username}>{notification.sender.username}</span>
          </Link>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.imageContainer}>
          <Image
            src={imageUrl}
            alt={`${isProfilePhoto ? 'Photo de profil' : 'Photo de couverture'} de ${notification.sender.username}`}
            width={500}
            height={isProfilePhoto ? 500 : 300}
            className={`${styles.photo} ${isProfilePhoto ? styles.profilePhoto : styles.coverPhoto}`}
          />
        </div>

        <div className={styles.footer}>
          <div className={styles.actions}>
            <button className={styles.likeButton}>
              <span className={styles.icon}>❤️</span>
              J&apos;aime
            </button>
            <button className={styles.commentButton}>
              <span className={styles.icon}>💬</span>
              Commenter
            </button>
          </div>
          <div className={styles.stats}>
            <span>2 personnes ont liké</span>
            <span>0 commentaires</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoNotificationModal;
