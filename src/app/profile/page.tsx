"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../../../firebase";
import { useEffect, useState } from "react";

// Define a type for the profile data we expect from Firestore
interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: 'reader' | 'author';
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Wait until the initial authentication check is complete
    if (loading) {
      return; 
    }
    // If auth is done and there's no user, redirect them
    if (!user) {
      router.push("/login");
      return;
    }
    // If auth is done AND we have a user, fetch their Firestore profile
    const fetchProfile = async () => {
      const userDocRef = doc(firestore, "users", user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        console.error("CRITICAL ERROR: User is authenticated but has no profile document.");
      }
    };
    fetchProfile();
  }, [user, loading, router]); // This hook runs when auth state changes

  const becomeAuthor = async () => {
    if (!user) return;
    const userDocRef = doc(firestore, "users", user.uid);
    try {
      await updateDoc(userDocRef, { role: 'author' });
      // Instantly update the UI for a good user experience
      setProfile(prev => prev ? { ...prev, role: 'author' } : null);
      alert("Congratulations! You are now an author.");
    } catch (error) {
      alert("Failed to update role. Please try again.");
    }
  };

  // While we wait for auth and the Firestore fetch, show this
  if (!profile) {
    return <p className="text-center p-8">Loading Profile...</p>;
  }

  // Once the profile is loaded, show the page
  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <div className="space-y-4">
        <p><strong>Username:</strong> {profile.username}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Role:</strong> <span className="capitalize">{profile.role}</span></p>
      </div>
      {profile.role === 'reader' && (
        <div className="mt-8 border-t pt-6">
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
  );
}
