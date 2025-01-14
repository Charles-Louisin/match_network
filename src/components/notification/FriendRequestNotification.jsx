import Image from 'next/image';
import Link from 'next/link';
import { useFriends } from '@/hooks/useFriends';
import { toast } from 'sonner';
import styles from './FriendRequestNotification.module.css';

const FriendRequestNotification = ({ request, onActionComplete }) => {
  const { acceptFriendRequest, rejectFriendRequest, isLoading } = useFriends();

  const handleAccept = async () => {
    try {
      await acceptFriendRequest(request._id);
      toast.success(`Demande d'ami acceptée !`);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      toast.error(`Erreur lors de l'acceptation de la demande`);
    }
  };

  const handleReject = async () => {
    try {
      await rejectFriendRequest(request._id);
      toast.success(`Demande d'ami refusée`);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      toast.error('Erreur lors du refus de la demande');
    }
  };

  return (
    <div className={styles.notification}>
      <Link href={`/profile/${request.sender._id}`} className={styles.userInfo}>
        <div className={styles.avatarContainer}>
          <Image
            src={request.sender.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${request.sender.avatar}` : '/images/default-avatar.jpg'}
            alt={request.sender.username}
            width={50}
            height={50}
            className={styles.avatar}
          />
        </div>
        <span className={styles.username}>{request.sender.username}</span>
      </Link>
      <p className={styles.message}>vous a envoyé une demande d&apos;ami</p>
      <div className={styles.actions}>
        <button
          className={`${styles.actionButton} ${styles.acceptButton}`}
          onClick={handleAccept}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.loadingSpinner}></span>
          ) : (
            'Accepter'
          )}
        </button>
        <button
          className={`${styles.actionButton} ${styles.refuseButton}`}
          onClick={handleReject}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.loadingSpinner}></span>
          ) : (
            'Refuser'
          )}
        </button>
      </div>
    </div>
  );
};

export default FriendRequestNotification;
