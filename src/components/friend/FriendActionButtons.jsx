'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import styles from './FriendActionButtons.module.css';
import ConfirmModal from '../common/ConfirmModal';

export default function FriendActionButtons({ userId, friendshipStatus: initialStatus, onStatusChange }) {
  const [isLoading, setIsLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const token = localStorage.getItem('token');

  // Effet pour gérer le chargement initial des demandes d'ami
  useEffect(() => {
    if (initialStatus === 'none' || initialStatus === 'self') {
      return;
    }

    // Charger l'état initial des demandes d'ami
    const pendingRequests = JSON.parse(localStorage.getItem('pendingFriendRequests') || '[]');
    if (pendingRequests.includes(userId) && initialStatus === 'none') {
      onStatusChange('pending_sent');
      return;
    }

    // Récupérer l'ID de la demande si elle existe
    const fetchRequestId = async () => {
      if (initialStatus !== 'pending_received' && initialStatus !== 'pending_sent') {
        return;
      }

      try {
        // Récupérer les demandes reçues
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/requests/pending`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const requests = await response.json();
          const request = requests.find(req => 
            (req.sender._id === userId || req.recipient._id === userId) && 
            req.status === 'pending'
          );
          
          if (request) {
            setRequestId(request._id);
          }
        }
      } catch (error) {
        console.error('Error fetching request ID:', error);
      }
    };

    fetchRequestId();
  }, [userId, initialStatus, onStatusChange]);

  const handleSendRequest = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/request/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la demande d\'ami');
      }

      // Sauvegarder l'état de la demande dans le localStorage
      const pendingRequests = JSON.parse(localStorage.getItem('pendingFriendRequests') || '[]');
      if (!pendingRequests.includes(userId)) {
        pendingRequests.push(userId);
        localStorage.setItem('pendingFriendRequests', JSON.stringify(pendingRequests));
      }
      onStatusChange('pending_sent');
      toast.success('Demande d\'ami envoyée !');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (isLoading) return;
    if (!requestId) {
      toast.error('Impossible de trouver la demande d\'ami');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/accept/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'acceptation de la demande d\'ami');
      }

      // Mettre à jour le statut d'ami immédiatement
      onStatusChange('friends');
      // Nettoyer le localStorage des demandes d'ami en attente
      const pendingRequests = JSON.parse(localStorage.getItem('pendingFriendRequests') || '[]');
      const updatedRequests = pendingRequests.filter(id => id !== userId);
      localStorage.setItem('pendingFriendRequests', JSON.stringify(updatedRequests));
      
      toast.success('Demande d\'ami acceptée !');
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation de la demande');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (isLoading) return;
    if (!requestId) {
      toast.error('Impossible de trouver la demande d\'ami');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/reject/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du rejet de la demande d\'ami');
      }

      // Mettre à jour le statut d'ami immédiatement
      onStatusChange('none');
      // Nettoyer le localStorage des demandes d'ami en attente
      const pendingRequests = JSON.parse(localStorage.getItem('pendingFriendRequests') || '[]');
      const updatedRequests = pendingRequests.filter(id => id !== userId);
      localStorage.setItem('pendingFriendRequests', JSON.stringify(updatedRequests));
      
      toast.success('Demande d\'ami rejetée');
    } catch (error) {
      toast.error('Erreur lors du rejet de la demande');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'ami');
      }

      // Nettoyer le localStorage des demandes d'ami en attente
      const pendingRequests = JSON.parse(localStorage.getItem('pendingFriendRequests') || '[]');
      const updatedRequests = pendingRequests.filter(id => id !== userId);
      localStorage.setItem('pendingFriendRequests', JSON.stringify(updatedRequests));
      
      onStatusChange('none');
      toast.success('Ami supprimé avec succès');
      setShowConfirmModal(false);
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'ami');
    } finally {
      setIsLoading(false);
    }
  };

  const renderButtons = () => {
    switch (initialStatus) {
      case 'self':
        return null;  // Ne rien afficher si c'est le profil de l'utilisateur
      case 'none':
        return (
          <button
            onClick={handleSendRequest}
            disabled={isLoading}
            className={`${styles.button} ${styles.addButton}`}
          >
            {isLoading ? (
              <div className={styles.loader}></div>
            ) : (
              'Ajouter en ami'
            )}
          </button>
        );

      case 'pending_sent':
        return (
          <button
            disabled={true}
            className={`${styles.button} ${styles.pendingButton}`}
          >
            Demande envoyée
          </button>
        );

      case 'pending_received':
        return (
          <div className={styles.actionButtons}>
            <button
              onClick={handleAcceptRequest}
              disabled={isLoading}
              className={`${styles.button} ${styles.acceptButton}`}
            >
              {isLoading ? (
                <div className={styles.loader}></div>
              ) : (
                'Accepter'
              )}
            </button>
            <button
              onClick={handleRejectRequest}
              disabled={isLoading}
              className={`${styles.button} ${styles.rejectButton}`}
            >
              {isLoading ? (
                <div className={styles.loader}></div>
              ) : (
                'Refuser'
              )}
            </button>
          </div>
        );

      case 'friends':
        return (
          <>
            <button
              className={`${styles.button} ${styles.removeButton}`}
              onClick={() => setShowConfirmModal(true)}
              disabled={isLoading}
            >
              {isLoading ? 'Suppression...' : 'Retirer des amis'}
            </button>
            <ConfirmModal
              isOpen={showConfirmModal}
              onClose={() => setShowConfirmModal(false)}
              onConfirm={handleRemoveFriend}
              title="Supprimer cet ami"
              message="Êtes-vous sûr de vouloir supprimer cet ami ? Cela supprimera également toutes les demandes d'ami associées."
            />
          </>
        );

      default:
        return null;
    }
  };

  return <div className={styles.container}>{renderButtons()}</div>;
}
