"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IoImageOutline } from "react-icons/io5";
import { FaUserTag } from "react-icons/fa";
import TagFriendsModal from "../modals/TagFriendsModal";
import styles from "./CreatePost.module.css";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [taggedFriends, setTaggedFriends] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    // Créer l'URL de prévisualisation pour l'image sélectionnée
    if (selectedImage) {
      const objectUrl = URL.createObjectURL(selectedImage);
      setPreviewImage(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedImage]);

  const createPost = async () => {
    if (!content.trim() && !selectedImage) return;

    setIsLoading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("content", content);
    if (selectedImage) {
      if (selectedImage.size > 10 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 10MB");
        setIsLoading(false);
        return;
      }

      if (!selectedImage.type.match(/^image\/(jpeg|png|gif|jpg)$/)) {
        setError("Format d'image non supporté. Utilisez JPG, PNG ou GIF");
        setIsLoading(false);
        return;
      }

      formData.append("image", selectedImage);
    }
    if (taggedFriends.length > 0) {
      formData.append(
        "taggedUsers",
        JSON.stringify(taggedFriends.map((friend) => friend._id))
      );
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const newPost = await response.json();

      // Créer des notifications pour les amis tagués
      if (taggedFriends.length > 0) {
        await Promise.all(
          taggedFriends.map((friend) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                type: "POST_TAG",
                recipient: friend._id,
                postId: newPost._id,
                text: `${user.username} vous a mentionné dans sa publication`,
              }),
            })
          )
        );
      }

      setContent("");
      setSelectedImage(null);
      setPreviewImage(null);
      setTaggedFriends([]);
      if (onPostCreated) {
        onPostCreated(newPost);
      }
      toast.success("Post créé avec succès!");
    } catch (error) {
      console.error("Error creating post:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleTagFriends = (selectedFriends) => {
    setTaggedFriends(selectedFriends);
  };

  const removeTaggedFriend = (friendId) => {
    setTaggedFriends((prev) =>
      prev.filter((friend) => friend._id !== friendId)
    );
  };

  const autoResizeTextArea = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  return (
    <div className={styles.createPost}>
      <div className={styles.createPostHeader}>
        <Image
          src={
            user?.avatar
              ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`
              : "/images/default-cover.jpg"
          }
          alt="User Avatar"
          width={40}
          height={40}
          className={styles.avatar}
        />
        <textarea
          placeholder={`Que voulez-vous partager ${user?.username} ?`}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            autoResizeTextArea(e);
          }}
          className={styles.input}
          rows={1}
        />
      </div>

      {/* Section des amis tagués */}
      {taggedFriends.length > 0 && (
        <div className={styles.taggedFriends}>
          est avec{" "}
          {taggedFriends.map((friend, index) => (
            <span key={friend._id} className={styles.taggedFriendContainer}>
              <Link
                href={`/profile/${friend._id}`}
                className={styles.taggedFriend}
              >
                @{friend.username}
              </Link>
              <button
                onClick={() => removeTaggedFriend(friend._id)}
                className={styles.removeTagButton}
              >
                ×
              </button>
              {index < taggedFriends.length - 1 && ", "}
            </span>
          ))}
        </div>
      )}

      {/* Prévisualisation de l'image */}
      {previewImage && (
        <div className={styles.imagePreview}>
          <Image
            src={previewImage}
            alt="Preview"
            width={0}
            height={0}
            sizes="100vw"
            className={styles.previewImg}
          />
          <button
            onClick={() => {
              setSelectedImage(null);
              setPreviewImage(null);
            }}
            className={styles.removeImage}
          >
            ×
          </button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <div className={styles.buttons}>
          <label className={styles.imageButton}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
            <IoImageOutline size={24} />
            <span>Image</span>
          </label>

          <button
            className={styles.tagButton}
            onClick={() => setShowTagModal(true)}
          >
            <FaUserTag size={20} />
            <span>Taguer</span>
          </button>
        </div>
      <button
        onClick={createPost}
        disabled={isLoading || (!content && !selectedImage)}
        className={`${styles.submitButton} ${
          isLoading ? styles.loading : ""
        }`}
      >
        {isLoading ? "Publication..." : "Publier"}
      </button>
      </div>

      <div>
        <TagFriendsModal 
          isOpen={showTagModal} 
          onClose={() => setShowTagModal(false)} 
          onTagFriends={handleTagFriends}
        />
      </div>
    </div>
  );
}

// export default CreatePost;
