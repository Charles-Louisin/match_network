import Image from 'next/image';
import Link from 'next/link';
import styles from './FriendCard.module.css';

const FriendCard = ({ friend }) => {
  return (
    <div className={styles.friendCard}>
      <div className={styles.avatarContainer}>
        <Image
          src={friend.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${friend.avatar}` : '/images/default-avatar.jpg'}
          alt={friend.username}
          width={100}
          height={100}
          className={styles.avatar}
        />
      </div>
      <h3 className={styles.username}>{friend.username}</h3>
      <div className={styles.actions}>
        <Link href={`/profile/${friend._id}`} className={styles.profileButton}>
          Voir le profil
        </Link>
        <Link href={`/messages/${friend._id}`} className={styles.messageButton}>
          Envoyer un message
        </Link>
      </div>
    </div>
  );
};

export default FriendCard;
