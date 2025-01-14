'use client';

import Image from 'next/image';
import { getImageUrl } from '@/utils/constants';
import styles from './Avatar.module.css';

const Avatar = ({ src, alt, size = 'medium', className = '', priority = false }) => {
  const defaultAvatar = '/images/default-avatar.jpg';
  const imageUrl = getImageUrl(src);

  const sizeMap = {
    small: 32,
    medium: 40,
    large: 96,
    xlarge: 128
  };

  const dimensions = sizeMap[size] || sizeMap.medium;

  const sizeClass = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
    xlarge: styles.xlarge
  }[size];

  return (
    <div className={`${styles.avatarContainer} ${sizeClass} ${className}`}>
      <Image
        src={imageUrl}
        alt={alt || 'Avatar'}
        width={dimensions}
        height={dimensions}
        className={styles.avatarImage}
        priority={priority}
        onError={(e) => {
          // Fallback vers l'avatar par défaut en cas d'erreur
          e.target.src = defaultAvatar;
        }}
      />
    </div>
  );
};

export default Avatar;
