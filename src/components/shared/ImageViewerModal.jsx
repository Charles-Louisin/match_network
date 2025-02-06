import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineClose } from 'react-icons/ai';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import Image from 'next/image';
import { getImageUrl } from '@/utils/constants';
import styles from './ImageViewerModal.module.css';

const ImageViewerModal = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modalContent}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.closeButton} onClick={onClose}>
            <AiOutlineClose size={24} />
          </button>

          <div className={styles.imageContainer}>
            <Image
              src={getImageUrl(imageUrl)}
              alt="Image en plein écran"
              fill
              style={{ objectFit: 'contain' }}
              quality={100}
              priority
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageViewerModal;
