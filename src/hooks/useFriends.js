import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useFriends = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const fetchFriends = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/friends', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des amis');
      }
      
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error('Erreur lors de la récupération des amis');
    }
  }, [currentUser]);

  const fetchPendingRequests = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/friends/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des demandes en attente');
      }
      
      const data = await response.json();
      setPendingRequests(data);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [currentUser, fetchFriends, fetchPendingRequests]);

  const hasPendingRequest = useCallback((userId) => {
    return pendingRequests.some(request => 
      request.sender._id === userId || request.recipient._id === userId
    );
  }, [pendingRequests]);

  const areFriends = useCallback((userId) => {
    return friends.some(friend => friend._id === userId);
  }, [friends]);

  return {
    friends,
    pendingRequests,
    suggestions,
    isLoading,
    hasPendingRequest,
    areFriends,
    fetchFriends,
    fetchPendingRequests
  };
};
