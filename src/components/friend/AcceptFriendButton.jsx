'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import styles from './FriendButton.module.css';

const AcceptFriendButton = ({ requestId, onAccepted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAcceptFriend = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/accept/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Invitation acceptée avec succès !');
        if (onAccepted) {
          onAccepted();
        }
        router.refresh();
        return;
      }

      // Si la réponse n'est pas ok, on essaie de récupérer le message d'erreur
      const data = await response.text();
      try {
        const errorData = JSON.parse(data);
        // Si c'est une erreur de type "déjà amis", on le traite comme un succès
        if (errorData.message.includes('déjà amis')) {
          toast.success(errorData.message);
          if (onAccepted) {
            onAccepted();
          }
          router.refresh();
          return;
        }
        throw new Error(errorData.message);
      } catch {
        throw new Error(&apos;Impossible d&apos;accepter l&apos;invitation&apos;);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error(error.message || &apos;Une erreur s&apos;est produite&apos;);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAcceptFriend}
      disabled={isLoading}
      className={styles.acceptButton}
    >
      {isLoading ? 'Acceptation...' : 'Accepter'}
    </button>
  );
};

export default AcceptFriendButton;
