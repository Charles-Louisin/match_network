"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import PostList from "@/components/post/PostList";
import PhotoUpload from "@/components/profile/PhotoUpload";
import Avatar from '@/components/common/Avatar';
import AddFriendButton from '@/components/friend/AddFriendButton';
import RemoveFriendButton from '@/components/friend/RemoveFriendButton';
import LocationIcon from "@/components/icons/LocationIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
import formatDate from "@/utils/formatDate";
import styles from "./profile.module.css";
import Navbar from "@/components/layout/Navbar";
import CreatePost from "@/components/post/CreatePost";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { FaCamera } from "react-icons/fa";
import ProfilePosts from '@/components/profile/ProfilePosts';

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

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
    // console.log("Profile ID:", id);
    fetchProfileData();
  }, [id, currentUser]);

  useEffect(() => {
    if (profile) {
      setEditedProfile({
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        birthDate: profile.birthDate || "",
        birthPlace: profile.birthPlace || "",
        gender: profile.gender || "",
        interests: profile.interests || [],
        education: profile.education || "",
        occupation: profile.occupation || "",
      });
    }
  }, [profile]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Veuillez vous connecter pour voir ce profil');
        return;
      }

      // Récupération du profil
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.text();
        try {
          const jsonError = JSON.parse(error);
          throw new Error(jsonError.message || 'Erreur lors du chargement du profil');
        } catch {
          throw new Error('Erreur lors du chargement du profil');
        }
      }

      const profileData = await profileResponse.json();
      setProfile(profileData);

      // Vérification du statut d'ami
      const friendshipResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/status/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (friendshipResponse.ok) {
        const friendshipData = await friendshipResponse.json();
        setIsFriend(friendshipData.isFriend);
        setIsCurrentUser(friendshipData.isCurrentUser);
      } else {
        console.warn('Impossible de vérifier le statut d\'ami');
        setIsFriend(false);
        setIsCurrentUser(false);
      }

    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(error.message || 'Erreur lors du chargement du profil');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfileData();
    }
  }, [id]);

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

  const handlePhotoUpload = async (type, file) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/upload-${type}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfile((prev) => ({
          ...prev,
          [type]: data.url,
        }));
        toast.success(
          `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`
        );
      } else {
        toast.error("Failed to upload photo");
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error("Failed to upload photo");
    }
  };

  const handleProfileUpdate = async (updatedProfile) => {
    try {
      const token = localStorage.getItem("token");
      console.log("Sending updated profile:", updatedProfile);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedProfile),
        }
      );

      if (response.ok) {
        const updatedData = await response.json();
        console.log("Profile updated successfully:", updatedData);
        setProfile(updatedData);
        setShowEditModal(false);
        toast.success("Profile updated successfully");
      } else {
        const error = await response.json();
        console.error("Error updating profile:", error);
        toast.error(error.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const fetchProfilePosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/user/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Impossible de charger les posts");
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfilePosts();
    }
  }, [id]);

  const isOwnProfile = useMemo(() => {
    if (!currentUser || !profile) {
      return false;
    }
    
    const isOwn = currentUser.id === profile._id;
    return isOwn;
  }, [currentUser, profile, id]);

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
          <div className={styles.coverPhotoContainer}>
            {profile.coverPhoto ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${profile.coverPhoto}`}
                alt="Cover photo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div className={styles.defaultCover} />
            )}
            {isOwnProfile && (
              <div className={styles.editCoverPhoto}>
                <PhotoUpload
                  onUpload={(file) => handlePhotoUpload("coverPhoto", file)}
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.profileHeader}>
          <div className={styles.avatarContainer}>
            {profile.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${profile.avatar}`}
                alt={profile.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img
                src="/images/default-avatar.jpg"
                alt="Default avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            {isOwnProfile && (
              <div className={styles.editAvatar}>
                <PhotoUpload
                  onUpload={(file) => handlePhotoUpload("avatar", file)}
                />
                <FaCamera className={styles.cameraIcon} />
              </div>
            )}
          </div>

          <div className={styles.userInfo}>
            <div className={styles.userInfoLeft}>
              {isEditing ? (
                <div className={styles.usernameEdit}>
                  <input
                    type="text"
                    className={styles.usernameInput}
                    value={editedProfile.username}
                    onChange={(e) =>
                      setEditedProfile((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="Enter username"
                  />
                </div>
              ) : (
                <h1>{profile.username}</h1>
              )}
              {isEditing ? (
                <textarea
                  className={styles.bioEdit}
                  value={editedProfile.bio}
                  onChange={(e) =>
                    setEditedProfile((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  placeholder="Write something about yourself..."
                />
              ) : (
                <p className={styles.bio}>{profile.bio || "No bio yet"}</p>
              )}
            </div>

            {isOwnProfile ? (
              <div className={styles.editButtonContainer}>
                <button
                  onClick={() => setShowEditModal(true)}
                  className={styles.editButton}
                >
                  Modifier le profil
                </button>
              </div>
            ) : (
              <div className={styles.profileActions}>
                {isCurrentUser ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className={styles.editButton}
                  >
                    Modifier le profil
                  </button>
                ) : (
                  <div className={styles.friendButtons}>
                    {!isFriend ? (
                      <AddFriendButton 
                        targetUserId={id} 
                        onRequestSent={() => {
                          toast.success('Demande d\'ami envoyée!');
                          fetchProfileData();
                        }}
                      />
                    ) : (
                      <RemoveFriendButton 
                        targetUserId={id}
                        onFriendRemoved={() => {
                          setIsFriend(false);
                          toast.success('Ami supprimé avec succès');
                          fetchProfileData();
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showEditModal && (
          <EditProfileModal
            profile={profile}
            onClose={() => setShowEditModal(false)}
            onSave={(updatedProfile) => handleProfileUpdate(updatedProfile)}
          />
        )}

        <div className={styles.profileContent}>
          <div className={styles.leftColumn}>
            <div className={styles.infoSection}>
              <h3>About</h3>
              {isEditing ? (
                <div className={styles.editInfo}>
                  <div className={styles.infoField}>
                    <label>Location</label>
                    <input
                      type="text"
                      value={editedProfile.location}
                      onChange={(e) =>
                        setEditedProfile((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      placeholder="Add your location"
                    />
                  </div>
                  <div className={styles.infoField}>
                    <label>Birth Date</label>
                    <input
                      type="date"
                      value={editedProfile.birthDate}
                      onChange={(e) =>
                        setEditedProfile((prev) => ({
                          ...prev,
                          birthDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className={styles.infoField}>
                    <label>Birth Place</label>
                    <input
                      type="text"
                      value={editedProfile.birthPlace}
                      onChange={(e) =>
                        setEditedProfile((prev) => ({
                          ...prev,
                          birthPlace: e.target.value,
                        }))
                      }
                      placeholder="Add your birth place"
                    />
                  </div>
                  <div className={styles.infoField}>
                    <label>Gender</label>
                    <select
                      value={editedProfile.gender}
                      onChange={(e) =>
                        setEditedProfile((prev) => ({
                          ...prev,
                          gender: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className={styles.infoField}>
                    <label>Education</label>
                    <input
                      type="text"
                      value={editedProfile.education}
                      onChange={(e) =>
                        setEditedProfile((prev) => ({
                          ...prev,
                          education: e.target.value,
                        }))
                      }
                      placeholder="Add your education"
                    />
                  </div>
                  <div className={styles.infoField}>
                    <label>Occupation</label>
                    <input
                      type="text"
                      value={editedProfile.occupation}
                      onChange={(e) =>
                        setEditedProfile((prev) => ({
                          ...prev,
                          occupation: e.target.value,
                        }))
                      }
                      placeholder="Add your occupation"
                    />
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
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
            {isOwnProfile && (
              <CreatePost onPostCreated={fetchProfilePosts} />
            )}
            <ProfilePosts posts={posts} userId={profile._id}/>
          </div>
        </div>
      </div>
    </>
  );
}
