"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { firestore, storage } from "../../../firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import Image from 'next/image';
import Link from 'next/link';

// Define interfaces for our data structures
interface Story {
  id: string;
  title: string;
  thumbnailUrl: string;
}

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: 'reader' | 'author';
  photoURL?: string;
  bio?: string;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // State for new features and editing
  const [publishedStories, setPublishedStories] = useState<Story[]>([]);
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [editableBio, setEditableBio] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Effect to fetch all user data (profile and stories)
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchProfileAndStories = async () => {
      const userDocRef = doc(firestore, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setProfile(profileData);
        setEditableBio(profileData.bio || "");

        // If the user is an author, also fetch their stories
        if (profileData.role === 'author') {
          const storiesQuery = query(collection(firestore, "stories"), where("authorId", "==", user.uid));
          const querySnapshot = await getDocs(storiesQuery);
          const storiesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
          setPublishedStories(storiesList);
        }
      } else {
        console.error("CRITICAL ERROR: User document not found.");
      }
    };

    fetchProfileAndStories();
  }, [user, loading, router]);

  // Handler to save profile picture and bio changes
  const handleSaveChanges = async () => {
    if (!user) return;
    setIsUploading(true);
    let photoURL = profile?.photoURL;

    if (profileImageFile) {
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);
      try {
        await uploadBytes(storageRef, profileImageFile);
        photoURL = await getDownloadURL(storageRef);
      } catch (error) {
        alert("Error uploading image.");
        setIsUploading(false);
        return;
      }
    }

    const updatedData = { bio: editableBio, photoURL };
    try {
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, updatedData);
      setProfile(prev => prev ? { ...prev, ...updatedData } : null);
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile.");
    } finally {
      setIsUploading(false);
      setIsEditing(false);
      setProfileImageFile(null);
    }
  };

  // --- NEW: Handler for the role toggle switch ---
  const handleRoleChange = async (newRole: 'reader' | 'author') => {
    if (!user || !profile) return;
    
    const oldRole = profile.role;
    setProfile({ ...profile, role: newRole }); // Update UI immediately

    if (newRole === 'reader') {
      setActiveTab('about'); // Force tab back to 'About' if they are no longer an author
    }

    try {
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, { role: newRole });
    } catch (error) {
      console.error("Failed to update role:", error);
      setProfile({ ...profile, role: oldRole }); // Revert on error
      alert("Failed to update role. Please try again.");
    }
  };

  if (!profile) {
    return <p className="text-center p-8">Loading Profile...</p>;
  }

  // --- Final JSX combining all features ---
  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 sm:p-8">
      {isEditing ? (
        // --- EDITING UI ---
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
          <div className="flex items-center space-x-4 mb-6">
            <Image src={profile.photoURL || '/default-avatar.png'} alt="Profile" width={80} height={80} className="rounded-full object-cover"/>
            <div>
              <label htmlFor="profile-picture-upload" className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-800">Change Picture</label>
              <input id="profile-picture-upload" type="file" accept="image/*" className="hidden" onChange={(e) => setProfileImageFile(e.target.files ? e.target.files[0] : null)}/>
              {profileImageFile && <p className="text-xs text-gray-500 mt-1">{profileImageFile.name}</p>}
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="bio" className="block text-sm font-bold text-gray-700 mb-2">Your Bio</label>
            <textarea id="bio" value={editableBio} onChange={(e) => setEditableBio(e.target.value)} placeholder="Tell everyone a little about yourself..." className="w-full p-2 border rounded-md h-24" maxLength={300}/>
          </div>
          <div className="flex space-x-4">
            <button onClick={handleSaveChanges} disabled={isUploading} className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-400">{isUploading ? "Saving..." : "Save Changes"}</button>
            <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      ) : (
        // --- VIEWING UI (WITH TABS) ---
        <div>
          <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
              <Image src={profile.photoURL || '/default-avatar.png'} alt="Profile" width={120} height={120} className="rounded-full object-cover shadow-md"/>
              <div className="text-center sm:text-left">
                <h1 className="text-4xl font-bold">{profile.username}</h1>
                <p className="text-gray-600">{profile.email}</p>
                <p className="text-sm text-gray-500 capitalize mt-1">Current Role: {profile.role}</p>
              </div>
            </div>
            <button onClick={() => setIsEditing(true)} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600">Edit Profile</button>
          </div>
          
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-6">
                <button onClick={() => setActiveTab('about')} className={`py-2 px-1 font-semibold ${activeTab === 'about' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>About</button>
                {profile.role === 'author' && (
                  <button onClick={() => setActiveTab('stories')} className={`py-2 px-1 font-semibold ${activeTab === 'stories' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Published Stories</button>
                )}
              </nav>
            </div>
            
            <div>
              {activeTab === 'about' && (
                <div>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.bio || "This user hasn't written a bio yet."}</p>
                  <div className="mt-8 border-t pt-6">
                    <h2 className="text-xl font-semibold">Account Role</h2>
                    <p className="text-gray-600 mt-2 mb-4">Switch between being a reader and an author.</p>
                    <label htmlFor="role-toggle" className="inline-flex items-center cursor-pointer">
                      <span className={`mr-3 font-medium ${profile.role === 'reader' ? 'text-blue-600' : 'text-gray-400'}`}>Reader</span>
                      <div className="relative">
                        <input id="role-toggle" type="checkbox" className="sr-only" checked={profile.role === 'author'} onChange={(e) => handleRoleChange(e.target.checked ? 'author' : 'reader')}/>
                        <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${profile.role === 'author' ? 'translate-x-6' : ''}`}></div>
                      </div>
                      <span className={`ml-3 font-medium ${profile.role === 'author' ? 'text-blue-600' : 'text-gray-400'}`}>Author</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'stories' && profile.role === 'author' && (
                <div>
                  {publishedStories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {publishedStories.map(story => (
                        <Link key={story.id} href={`/story/${story.id}`} className="block group">
                          <div className="flex flex-col rounded-lg shadow-md overflow-hidden h-full border hover:shadow-xl transition-shadow">
                            <Image src={story.thumbnailUrl} alt={story.title} width={400} height={200} className="h-40 w-full object-cover"/>
                            <div className="p-4 bg-white"><h3 className="text-lg font-semibold text-gray-900 group-hover:underline">{story.title}</h3></div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (<p className="text-gray-600">You haven't published any stories yet.</p>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
