'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function useFriendship() {
  const [friends, setFriends] = useState(new Set());
  const [sentRequests, setSentRequests] = useState(new Set());
  const [receivedRequests, setReceivedRequests] = useState(new Set());
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchFriends(), fetchPendingRequests()]);
    };
    loadData();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erreur lors de la récupération des amis');

      const friendsList = await response.json();
      setFriends(new Set(friendsList.map(friend => friend._id)));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/requests/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erreur lors de la récupération des demandes');

      const requests = await response.json();
      const currentUserId = JSON.parse(localStorage.getItem('user'))._id;
      const sent = new Set();
      const received = new Set();

      setPendingRequests(requests);

      requests.forEach(request => {
        if (request.isCurrentUserSender) {
          sent.add(request.recipient._id);
        } else {
          received.add(request.sender._id);
        }
      });

      setSentRequests(sent);
      setReceivedRequests(received);
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vous devez être connecté');
        return false;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/request/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'envoi de la demande');
      }

      setSentRequests(prev => new Set([...prev, userId]));
      toast.success('Demande envoyée !');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelFriendRequest = async (userId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vous devez être connecté');
        return false;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/request/${userId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'annulation');
      }

      setSentRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      
      toast.success('Demande annulée');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptFriendRequest = async (userId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vous devez être connecté');
        return false;
      }

      const request = pendingRequests.find(req => 
        !req.isCurrentUserSender && req.sender._id === userId
      );

      if (!request) {
        throw new Error('Demande non trouvée');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/accept/${request._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'acceptation');
      }

      setReceivedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      setFriends(prev => new Set([...prev, userId]));
      
      await fetchPendingRequests();
      await fetchFriends();
      
      toast.success('Demande acceptée');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectFriendRequest = async (userId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vous devez être connecté');
        return false;
      }

      const request = pendingRequests.find(req => 
        !req.isCurrentUserSender && req.sender._id === userId
      );

      if (!request) {
        throw new Error('Demande non trouvée');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/reject/${request._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du refus');
      }

      setReceivedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      
      await fetchPendingRequests();
      
      toast.success('Demande refusée');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFriend = async (friendId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vous devez être connecté');
        return false;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/remove/${friendId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }

      setFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
      
      await fetchFriends();
      
      toast.success('Ami retiré');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    friends,
    sentRequests,
    receivedRequests,
    isLoading,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    fetchPendingRequests,
    fetchFriends
  };
}
