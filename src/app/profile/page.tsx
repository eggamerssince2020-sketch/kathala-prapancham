"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore, storage } from "../../../firebase"; // Ensure storage is exported from your firebase.ts
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import Image from 'next/image';

// --- 1. Updated UserProfile Interface ---
// We've added optional fields for the user's photo URL and bio.
interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: 'reader' | 'author';
  photoURL?: string; // Optional: URL for the profile picture
  bio?: string;      // Optional: A short user biography
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // --- 2. New State for Editing Functionality ---
  const [isEditing, setIsEditing] = useState(false);
  const [editableBio, setEditableBio] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    
    const fetchProfile = async () => {
      const userDocRef = doc(firestore, "users", user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setProfile(profileData);
        // Pre-fill the bio for the edit form
        setEditableBio(profileData.bio || "");
      } else {
        console.error("CRITICAL ERROR: User is authenticated but has no profile document.");
      }
    };
    fetchProfile();
  }, [user, loading, router]);

  // --- 3. Handler to Save All Profile Changes ---
  const handleSaveChanges = async () => {
    if (!user) return;
    setIsUploading(true);

    let photoURL = profile?.photoURL; // Start with the existing photo URL

    // Step 1: Upload new profile picture if one was selected
    if (profileImageFile) {
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);
      try {
        await uploadBytes(storageRef, profileImageFile);
        photoURL = await getDownloadURL(storageRef); // Get the new URL
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image. Please try again.");
        setIsUploading(false);
        return;
      }
    }

    // Step 2: Prepare data and update Firestore
    const updatedData = {
      bio: editableBio,
      photoURL: photoURL,
    };

    try {
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, updatedData);

      // Step 3: Update local state to show changes instantly
      setProfile(prev => prev ? { ...prev, ...updatedData } : null);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsUploading(false);
      setIsEditing(false); // Exit edit mode
      setProfileImageFile(null); // Clear the selected file
    }
  };
  
  const becomeAuthor = async () => {
    // This function remains the same
    if (!user) return;
    const userDocRef = doc(firestore, "users", user.uid);
    try {
      await updateDoc(userDocRef, { role: 'author' });
      setProfile(prev => prev ? { ...prev, role: 'author' } : null);
      alert("Congratulations! You are now an author.");
    } catch (_error) {
      alert("Failed to update role. Please try again.");
    }
  };

  if (!profile) {
    return <p className="text-center p-8">Loading Profile...</p>;
  }
  
  // --- 4. Updated JSX with View and Edit Modes ---
  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
      
      {/* --- EDITING MODE UI --- */}
      {isEditing ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
          
          <div className="flex items-center space-x-4 mb-6">
            <Image
              src={profile.photoURL || '/default-avatar.png'} // Provide a default avatar in your /public folder
              alt="Profile Picture"
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
            <div>
              <label htmlFor="profile-picture-upload" className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-800">
                Change Picture
              </label>
              <input
                id="profile-picture-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProfileImageFile(e.target.files ? e.target.files[0] : null)}
              />
              {profileImageFile && <p className="text-xs text-gray-500 mt-1">{profileImageFile.name}</p>}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="bio" className="block text-sm font-bold text-gray-700 mb-2">Your Bio</label>
            <textarea
              id="bio"
              value={editableBio}
              onChange={(e) => setEditableBio(e.target.value)}
              placeholder="Tell everyone a little about yourself..."
              className="w-full p-2 border rounded-md h-24"
              maxLength={300}
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSaveChanges}
              disabled={isUploading}
              className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {isUploading ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* --- VIEW MODE UI --- */
        <div>
          <div className="flex items-center space-x-6 mb-6">
            <Image
              src={profile.photoURL || '/default-avatar.png'} // Use a default image if none exists
              alt="Profile Picture"
              width={100}
              height={100}
              className="rounded-full object-cover shadow-md"
            />
            <div>
              <h1 className="text-3xl font-bold">{profile.username}</h1>
              <p className="text-gray-600">{profile.email}</p>
              <p className="text-sm text-gray-500 capitalize mt-1">Role: {profile.role}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold border-b pb-2">About Me</h2>
            <p className="text-gray-700 mt-3 whitespace-pre-wrap">
              {profile.bio || "This user hasn't written a bio yet."}
            </p>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 mb-6"
          >
            Edit Profile
          </button>

          {profile.role === 'reader' && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold">Become an Author</h2>
              <p className="text-gray-600 mt-2">Ready to share your stories?</p>
              <button
                onClick={becomeAuthor}
                className="mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600"
              >
                Upgrade to Author
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
