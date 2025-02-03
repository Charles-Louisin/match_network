'use client';

import { useState, useEffect } from "react";
import StoriesList from '../stories/StoriesList';
import styles from "./Stories.module.css";
import { toast } from "react-hot-toast";

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = window.localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setCurrentUser(userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error('Vous devez être connecté pour voir les stories');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des stories');
      }

      const data = await response.json();
      setStories(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError(error.message);
      setLoading(false);
      toast.error(error.message);
    }
  };

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (loading) {
    return <div className={styles.loading}>Chargement des stories...</div>;
  }

  return (
    <div className={styles.storiesContainer}>
      <StoriesList stories={stories} currentUser={currentUser} />
    </div>
  );
};

export default Stories;