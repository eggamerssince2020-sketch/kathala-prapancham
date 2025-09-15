"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { firestore } from "../../../../firebase";
import { useAuth } from "@/context/AuthContext";
import Image from 'next/image';
import Link from 'next/link';

// Interfaces for our data structures
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
  followersCount?: number;
  followingCount?: number;
}

export default function UserProfilePage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publishedStories, setPublishedStories] = useState<Story[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to fetch the profile and follow status
  useEffect(() => {
    if (!username) return;

    const fetchUserProfile = async () => {
      setIsLoading(true);
      const usersQuery = query(collection(firestore, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(usersQuery);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const profileData = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
        setProfile(profileData);

        // Fetch stories if the user is an author
        if (profileData.role === 'author') {
          const storiesQuery = query(collection(firestore, "stories"), where("authorId", "==", profileData.uid));
          const storiesSnapshot = await getDocs(storiesQuery);
          const storiesList = storiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
          setPublishedStories(storiesList);
        }

        // Check follow status if a user is logged in
        if (currentUser && profileData.uid !== currentUser.uid) {
          const followRef = doc(firestore, `users/${profileData.uid}/followers/${currentUser.uid}`);
          const followSnap = await getDoc(followRef);
          setIsFollowing(followSnap.exists());
        }
      }
      setIsLoading(false);
    };

    fetchUserProfile();
  }, [username, currentUser]);

  // Handler for the follow/unfollow button
  const handleFollowToggle = async () => {
    if (!currentUser || !profile || currentUser.uid === profile.uid) return;

    const followRef = doc(firestore, `users/${profile.uid}/followers/${currentUser.uid}`);

    if (isFollowing) {
      // Unfollow logic
      await deleteDoc(followRef);
      setIsFollowing(false);
    } else {
      // Follow logic
      await setDoc(followRef, { followerId: currentUser.uid });
      setIsFollowing(true);
    }
    // Note: The follower counts will update automatically via your Cloud Functions!
  };
  
  if (isLoading || authLoading) {
    return <p className="text-center p-8">Loading Profile...</p>;
  }

  if (!profile) {
    return <p className="text-center p-8">User not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 sm:p-8">
      {/* Profile Header */}
      <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Image src={profile.photoURL || '/default-avatar.png'} alt="Profile" width={120} height={120} className="rounded-full object-cover shadow-md"/>
          <div className="text-center sm:text-left flex-grow">
            <h1 className="text-4xl font-bold">{profile.username}</h1>
            <div className="flex justify-center sm:justify-start space-x-4 mt-4">
              <div className="text-center">
                <p className="font-bold text-lg">{profile.followersCount || 0}</p>
                <p className="text-sm text-gray-500">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{profile.followingCount || 0}</p>
                <p className="text-sm text-gray-500">Following</p>
              </div>
            </div>
          </div>
          {/* Follow Button */}
          {currentUser && profile.uid !== currentUser.uid && (
            <button
              onClick={handleFollowToggle}
              className={`font-bold py-2 px-6 rounded-full transition-colors ${isFollowing ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Profile Content (Bio and Stories) */}
      <div className="bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">About</h2>
        <p className="text-gray-700 whitespace-pre-wrap mb-8">
          {profile.bio || "This user hasn't written a bio yet."}
        </p>

        {profile.role === 'author' && (
          <div>
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Published Stories</h2>
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
            ) : (<p className="text-gray-600">This author hasn't published any stories yet.</p>)}
          </div>
        )}
      </div>
    </div>
  );
}
