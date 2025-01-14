import Image from 'next/image';
import Link from 'next/link';
import styles from './NotificationCard.module.css';

const NotificationCard = ({ notification, onAccept, onReject }) => {
  const { sender } = notification;
  
  return (
    <div className={styles.notificationCard}>
      <div className={styles.userInfo}>
        <Image
          src={sender.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${sender.avatar}` : '/images/default-avatar.jpg'}
          alt={sender.username}
          width={50}
          height={50}
          className={styles.avatar}
        />
        <div className={styles.details}>
          <Link href={`/profile/${sender._id}`} className={styles.username}>
            {sender.username}
          </Link>
          <p className={styles.message}>vous a envoyé une demande d&apos;ami</p>
        </div>
      </div>
      <div className={styles.actions}>
        <button 
          onClick={() => onAccept(notification._id)} 
          className={styles.acceptButton}
        >
          Accepter
        </button>
        <button 
          onClick={() => onReject(notification._id)} 
          className={styles.rejectButton}
        >
          Refuser
        </button>
      </div>
    </div>
  );
};

export default NotificationCard;
