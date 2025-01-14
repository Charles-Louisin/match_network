import { useFriends } from '@/hooks/useFriends';
import FriendCard from './FriendCard';
import styles from './FriendsList.module.css';

const FriendsList = () => {
  const { friends, isLoading } = useFriends();

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingSpinner}></span>
        <p>Chargement de vos amis...</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Vous n&apos;avez pas encore d&apos;amis.</p>
        <p>Découvrez des personnes intéressantes dans les suggestions !</p>
      </div>
    );
  }

  return (
    <div className={styles.friendsList}>
      {friends.map((friend) => (
        <FriendCard key={friend._id} friend={friend} />
      ))}
    </div>
  );
};

export default FriendsList;
