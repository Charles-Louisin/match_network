"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-hot-toast";
import PostList from "@/components/post/PostList";
import PhotoUpload from "@/components/profile/PhotoUpload";
import Avatar from "@/components/common/Avatar";
import FriendActionButtons from '@/components/friend/FriendActionButtons';
import LocationIcon from "@/components/icons/LocationIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
import formatDate from "@/utils/formatDate";
import styles from "./profile.module.css";
import Navbar from "@/components/layout/Navbar";
import CreatePost from "@/components/post/CreatePost";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { FaCamera, FaEdit } from "react-icons/fa";
import ProfilePosts from "@/components/profile/ProfilePosts";
import { useRef } from "react";

export default function Profile() {
  const params = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    bio: "",
    avatar: null,
    coverPhoto: null,
    location: "",
    birthDate: "",
    birthPlace: "",
  });
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState('none');
  const [isFriend, setIsFriend] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const avatarInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    // console.log("Stored user:", user);
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        // console.log("Parsed user:", parsedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        // console.error("Error parsing user:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    // console.log("Current user:", currentUser);
    // console.log("Profile ID:", params.id);
    fetchProfileData();
  }, [params.id, currentUser]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const currentUser = JSON.parse(userStr);
      const isOwner =
        currentUser.id === params.id || currentUser._id === params.id;
      setIsCurrentUser(isOwner);
    }
  }, [params.id]);

  useEffect(() => {
    if (profile) {
      setEditData({
        username: profile.username,
        bio: profile.bio || "",
        avatar: null,
        coverPhoto: null,
        location: profile.location || "",
        birthDate: profile.birthDate || "",
        birthPlace: profile.birthPlace || "",
      });
    }
  }, [profile]);

  const fetchProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Veuillez vous connecter pour voir ce profil");
        return;
      }

      // Récupération du profil
      const profileResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!profileResponse.ok) {
        const error = await profileResponse.text();
        try {
          const jsonError = JSON.parse(error);
          throw new Error(
            jsonError.message || "Erreur lors du chargement du profil"
          );
        } catch {
          throw new Error("Erreur lors du chargement du profil");
        }
      }

      const profileData = await profileResponse.json();
      console.log("Profile data received:", profileData); // Debug log
      setProfile(profileData);

      // Vérification du statut d'ami
      if (!isCurrentUser) {  
        fetchFriendshipStatus();
      } else {
        // Si c'est le profil de l'utilisateur courant
        setIsFriend(false);
        setFriendshipStatus('self');
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error(error.message || "Erreur lors du chargement du profil");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, isCurrentUser]);

  useEffect(() => {
    if (params.id) {
      fetchProfileData();
    }
  }, [params.id, fetchProfileData]);

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to create a post");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: postContent }),
        }
      );

      if (response.ok) {
        const newPost = await response.json();
        setPosts((prev) => [newPost, ...prev]);
        setPostContent("");
        toast.success("Post created successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    }
  };

  const handleUpdateAvatar = async (file) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Veuillez vous reconnecter");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/upload-avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Mettre à jour le localStorage avec la nouvelle photo
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          const updatedUser = {
            ...userData,
            avatar: result.avatar
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        
        toast.success("Photo de profil mise à jour avec succès");
        // Forcer le rafraîchissement de la page pour mettre à jour tous les composants
        window.location.reload();
      } else {
        const error = await response.text();
        console.error("Erreur upload avatar:", error);
        toast.error("Erreur lors de la mise à jour de la photo de profil");
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Erreur lors de la mise à jour de la photo de profil");
    }
  };

  const handleUpdateCoverPhoto = async (file) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Veuillez vous reconnecter");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/upload-coverPhoto`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Mettre à jour le localStorage avec la nouvelle photo de couverture
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          const updatedUser = {
            ...userData,
            coverPhoto: result.coverPhoto
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        
        toast.success("Photo de couverture mise à jour avec succès");
        // Forcer le rafraîchissement de la page pour mettre à jour tous les composants
        window.location.reload();
      } else {
        const error = await response.text();
        console.error("Erreur upload cover:", error);
        toast.error("Erreur lors de la mise à jour de la photo de couverture");
      }
    } catch (error) {
      console.error("Error updating cover photo:", error);
      toast.error("Erreur lors de la mise à jour de la photo de couverture");
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditData({
      username: profile.username,
      bio: profile.bio || "",
      avatar: null,
      coverPhoto: null,
      location: profile.location || "",
      birthDate: profile.birthDate || "",
      birthPlace: profile.birthPlace || "",
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      username: "",
      bio: "",
      avatar: null,
      coverPhoto: null,
      location: "",
      birthDate: "",
      birthPlace: "",
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData((prev) => ({
        ...prev,
        avatar: file,
      }));
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Veuillez vous reconnecter");
        return;
      }

      // Vérifier les champs obligatoires
      if (!editData.username.trim()) {
        toast.error("Le nom d'utilisateur est requis");
        return;
      }

      // Préparer les données
      const profileData = {
        username: editData.username.trim(),
        bio: editData.bio.trim(),
        location: editData.location.trim(),
        birthDate: editData.birthDate,
        birthPlace: editData.birthPlace.trim()
      };

      // Log des données envoyées
      console.log("Données à envoyer:", profileData);
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`;
      console.log("URL de l'API:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      console.log("Status de la réponse:", response.status);
      console.log("Status text:", response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Texte d'erreur complet:", errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error("Données d'erreur parsées:", errorData);
          toast.error(errorData.message || "Erreur lors de la mise à jour du profil");
        } catch (e) {
          console.error("Erreur lors du parsing de l'erreur:", e);
          toast.error(`Erreur ${response.status}: ${response.statusText}`);
        }
        return;
      }

      const updatedProfile = await response.json();
      console.log("Profil mis à jour:", updatedProfile);

      setProfile(updatedProfile);
      
      // Mettre à jour le localStorage
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        const updatedUser = {
          ...userData,
          username: updatedProfile.username
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setShowEditModal(false);
      toast.success("Profil mis à jour avec succès");
      fetchProfileData();
    } catch (error) {
      console.error("Erreur complète:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    }
  };

  const fetchProfilePosts = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/user/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();
      // S'assurer que chaque post a les informations complètes de l'utilisateur
      const postsWithUser = data.map((post) => ({
        ...post,
        user: {
          _id: profile._id,
          username: profile.username,
          avatar: profile.avatar,
          // Ajouter d'autres champs du profil si nécessaire
          email: profile.email,
          bio: profile.bio,
        },
      }));

      setPosts(postsWithUser);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    if (params.id && profile) {
      fetchProfilePosts();
    }
  }, [params.id, profile]);

  // Fonction pour charger le statut d'ami
  const fetchFriendshipStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/friends/status/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFriendshipStatus(data.status);
        setIsFriend(data.isFriend);

        // Mettre à jour le localStorage pour les demandes en attente
        if (data.status === 'pending_sent') {
          const pendingRequests = JSON.parse(localStorage.getItem('pendingFriendRequests') || '[]');
          if (!pendingRequests.includes(params.id)) {
            pendingRequests.push(params.id);
            localStorage.setItem('pendingFriendRequests', JSON.stringify(pendingRequests));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching friendship status:', error);
    }
  }, [params.id]);

  // Gestionnaire de changement de statut d'ami
  const handleFriendshipStatusChange = useCallback((newStatus) => {
    setFriendshipStatus(newStatus);
    if (newStatus === 'friends') {
      setIsFriend(true);
    } else if (newStatus === 'none') {
      setIsFriend(false);
      // Nettoyer le localStorage des demandes en attente
      const pendingRequests = JSON.parse(localStorage.getItem('pendingFriendRequests') || '[]');
      const updatedRequests = pendingRequests.filter(id => id !== params.id);
      localStorage.setItem('pendingFriendRequests', JSON.stringify(updatedRequests));
    }
  }, [params.id]);

  // Charger le statut d'ami au chargement de la page
  useEffect(() => {
    if (!isCurrentUser) {
      fetchFriendshipStatus();
    }
  }, [isCurrentUser, fetchFriendshipStatus]);

  if (isLoading) {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  if (!profile) {
    return <div className={styles.error}>Profile not found</div>;
  }

  return (
    <>
      <Navbar />
      <div className={styles.profilePage}>
        <div className={styles.coverSection}>
          {profile.coverPhoto ? (
            <Image
              src={
                profile.coverPhoto
                  ? `${process.env.NEXT_PUBLIC_API_URL}${profile.coverPhoto}`
                  : "/images/default-cover.jpg"}
              alt="Cover photo"
              width={1200}
              height={300}
              className={styles.coverPhoto}
            />
          ) : (
            <div className={styles.defaultCover} />
          )}
          {isCurrentUser && (
            <div className={`${styles.cameraIcon} ${styles.cameraIconMobile}`} onClick={() => coverPhotoInputRef.current?.click()}>
              <FaCamera />
              <input
                type="file"
                ref={coverPhotoInputRef}
                hidden
                accept="image/*"
                onChange={(e) => handleUpdateCoverPhoto(e.target.files[0])}
              />
            </div>
          )}
        </div>

        <div className={styles.profileContainer}>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <div className={styles.leftSection}>
                <div className={styles.avatarContainer}>
                  <Image
                    src={
                      profile.avatar
                        ? `${process.env.NEXT_PUBLIC_API_URL}${profile.avatar}`
                        : "/images/default-avatar.jpg"
                    }
                    alt="Profile"
                    width={150}
                    height={150}
                    className={styles.avatar}
                  />
                  {isCurrentUser && (
                    <div className={styles.cameraIcon} onClick={() => avatarInputRef.current?.click()}>
                      <FaCamera />
                      <input
                        type="file"
                        ref={avatarInputRef}
                        hidden
                        accept="image/*"
                        onChange={(e) => handleUpdateAvatar(e.target.files[0])}
                      />
                    </div>
                  )}
                </div>
                <div className={styles.userDetails}>
                  <h1>{profile.username}</h1>
                  <p className={styles.bio}>{profile.bio || "Aucune bio"}</p>
                </div>
              </div>

              <div className={styles.rightSection}>
                {isCurrentUser ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className={styles.editButton}
                  >
                    <FaEdit /> Modifier le profil
                  </button>
                ) : (
                  <div className={styles.friendActionContainer}>
                    <FriendActionButtons
                      userId={params.id}
                      friendshipStatus={friendshipStatus}
                      onStatusChange={handleFriendshipStatusChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.profileContent}>
          <div className={styles.leftColumn}>
            <div className={styles.infoSection}>
              <h3>About</h3>
              <div className={styles.infoItem}>
                <LocationIcon className={styles.infoIcon} />
                <span className={styles.infoValue}>
                  {profile.location || "Location not set"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <CalendarIcon className={styles.infoIcon} />
                <span className={styles.infoValue}>
                  {profile.birthDate
                    ? formatDate(profile.birthDate)
                    : "Birth date not set"}
                </span>
              </div>
              {profile.birthPlace && (
                <div className={styles.infoItem}>
                  <LocationIcon className={styles.infoIcon} />
                  <span className={styles.infoValue}>
                    Born in {profile.birthPlace}
                  </span>
                </div>
              )}
              {profile.gender && (
                <div className={styles.infoItem}>
                  <span className={styles.infoValue}>
                    {profile.gender.charAt(0).toUpperCase() +
                      profile.gender.slice(1)}
                  </span>
                </div>
              )}
              {profile.education && (
                <div className={styles.infoItem}>
                  <span className={styles.infoValue}>
                    Studied at {profile.education}
                  </span>
                </div>
              )}
              {profile.occupation && (
                <div className={styles.infoItem}>
                  <span className={styles.infoValue}>
                    Works as {profile.occupation}
                  </span>
                </div>
              )}
              <div className={styles.infoItem}>
                <CalendarIcon className={styles.infoIcon} />
                <span className={styles.infoValue}>
                  Joined {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>

            <div className={styles.statsSection}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{posts.length}</div>
                <div className={styles.statLabel}>Posts</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {profile.followers?.length || 0}
                </div>
                <div className={styles.statLabel}>Followers</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {profile.following?.length || 0}
                </div>
                <div className={styles.statLabel}>Following</div>
              </div>
            </div>
          </div>

          <div className={styles.mainColumn}>
            {isCurrentUser && <CreatePost onPostCreated={fetchProfilePosts} />}
            <ProfilePosts posts={posts} userId={profile._id} />
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Modifier le profil</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              

              <div className={styles.editSection}>
                <div className={styles.formGroup}>
                  <label>Nom d&apos;utilisateur</label>
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    className={styles.editInput}
                    placeholder="Nom d'utilisateur"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Bio</label>
                  <textarea
                    className={styles.editInput}
                    placeholder="DItes quelque choses sur vous..."
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Date de naissance</label>
                    <input
                      type="date"
                      value={editData.birthDate ? editData.birthDate.split('T')[0] : ''}
                      onChange={(e) =>
                        setEditData({ ...editData, birthDate: e.target.value })
                      }
                      className={styles.editInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Lieu de naissance</label>
                    <input
                      type="text"
                      value={editData.birthPlace}
                      onChange={(e) =>
                        setEditData({ ...editData, birthPlace: e.target.value })
                      }
                      className={styles.editInput}
                      placeholder="Ville de naissance"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Localisation actuelle</label>
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className={styles.editInput}
                    placeholder="Ville actuelle"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={styles.cancelButton}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveProfile}
                  className={styles.saveButton}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
