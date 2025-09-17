"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// --- 1. FIX: Import 'getDoc' along with the others ---
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firestore, storage } from '../../../firebase'; 
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { FiEdit2, FiSave, FiX, FiHeart, FiMessageCircle, FiUpload, FiLoader, FiLogOut } from 'react-icons/fi';

// --- (Interfaces and StoryCard component remain the same) ---
interface Story {
    id: string;
    title: string;
    thumbnailUrl: string;
    genre: string;
    likeCount?: number;
    commentCount?: number;
}

interface UserProfile {
    uid: string;
    name: string;
    username: string;
    bio: string;
    profilePictureUrl: string;
    coverPhotoUrl: string;
}

const StoryCard = ({ story }: { story: Story }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
        <Link href={`/story/${story.id}`}>
            <div className="relative h-48 w-full">
                <Image src={story.thumbnailUrl} alt={story.title} fill style={{ objectFit: 'cover' }} className="transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="p-4">
                <p className="text-sm font-semibold text-indigo-600">{story.genre}</p>
                <h3 className="text-lg font-bold text-gray-800 truncate mt-1">{story.title}</h3>
                <div className="flex items-center text-gray-500 mt-3 text-sm gap-5">
                    <div className="flex items-center gap-1.5">
                        <FiHeart className="w-4 h-4 text-red-500" />
                        <span>{story.likeCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <FiMessageCircle className="w-4 h-4 text-blue-500" />
                        <span>{story.commentCount || 0}</span>
                    </div>
                </div>
            </div>
        </Link>
    </div>
);


export default function ProfilePage() {
    // --- 2. FIX: Destructure 'logout' from useAuth() ---
    const { user: currentUser, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [publishedStories, setPublishedStories] = useState<Story[]>([]);
    const [stats, setStats] = useState({ totalStories: 0, totalLikes: 0, totalComments: 0 });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!currentUser) {
            router.push('/login');
            return;
        }

        const fetchProfileData = async () => {
            setLoading(true);
            const userDocRef = doc(firestore, 'users', currentUser.uid);
            // 'getDoc' will now be correctly recognized
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                console.error("User document not found!");
                setLoading(false);
                return;
            }

            const userData = userDoc.data();
            const userProfileData = {
                uid: userDoc.id,
                name: userData.name || 'Anonymous',
                username: userData.username,
                bio: userData.bio || '',
                profilePictureUrl: userData.photoURL || '/default-avatar.png',
                coverPhotoUrl: userData.coverPhotoUrl || '/default-cover.png',
            };
            setProfile(userProfileData);
            setEditName(userProfileData.name);
            setEditBio(userProfileData.bio);

            // Fetch stories and calculate advanced stats
            const storiesQuery = query(collection(firestore, 'stories'), where('authorId', '==', currentUser.uid));
            const storiesSnapshot = await getDocs(storiesQuery);
            
            let totalLikes = 0;
            let totalComments = 0;
            const storiesPromises = storiesSnapshot.docs.map(async (storyDoc) => {
                const storyData = storyDoc.data();
                const [likesSnap, commentsSnap] = await Promise.all([
                    getDocs(collection(firestore, 'stories', storyDoc.id, 'likes')),
                    getDocs(collection(firestore, 'stories', storyDoc.id, 'comments'))
                ]);
                totalLikes += likesSnap.size;
                totalComments += commentsSnap.size;
                return {
                    id: storyDoc.id,
                    title: storyData.title,
                    thumbnailUrl: storyData.thumbnailUrl,
                    genre: storyData.genre,
                    likeCount: likesSnap.size,
                    commentCount: commentsSnap.size,
                };
            });

            const stories = await Promise.all(storiesPromises);
            setPublishedStories(stories);
            setStats({ totalStories: stories.length, totalLikes, totalComments });
            setLoading(false);
        };

        fetchProfileData();
    }, [currentUser, authLoading, router]);

    const handleSaveProfile = async () => {
        // ... (This function remains unchanged)
         if (!profile) return;
        setIsUploading(true);

        let profilePictureUrl = profile.profilePictureUrl;
        if (profileImageFile) {
            const storageRef = ref(storage, `profile_pictures/${profile.uid}`);
            await uploadBytes(storageRef, profileImageFile);
            profilePictureUrl = await getDownloadURL(storageRef);
        }

        let coverPhotoUrl = profile.coverPhotoUrl;
        if (coverImageFile) {
            const storageRef = ref(storage, `cover_photos/${profile.uid}`);
            await uploadBytes(storageRef, coverImageFile);
            coverPhotoUrl = await getDownloadURL(storageRef);
        }

        const updatedData = {
            name: editName,
            bio: editBio,
            photoURL: profilePictureUrl,
            coverPhotoUrl: coverPhotoUrl,
        };

        const userDocRef = doc(firestore, 'users', profile.uid);
        await updateDoc(userDocRef, updatedData);

        setProfile(prev => prev ? { ...prev, name: editName, bio: editBio, profilePictureUrl, coverPhotoUrl } : null);
        setIsUploading(false);
        setIsEditing(false);
        setProfileImageFile(null);
        setCoverImageFile(null);
    };

    // --- (The rest of the JSX remains the same) ---
    if (loading || authLoading) {
        return <div className="flex justify-center items-center min-h-screen"><FiLoader className="animate-spin text-4xl text-indigo-600"/></div>;
    }

    if (!profile) {
        return <div className="text-center py-20 text-xl font-semibold">Could not load profile.</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                 <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                    <div className="relative h-56 sm:h-72">
                        <Image
                            src={coverImageFile ? URL.createObjectURL(coverImageFile) : profile.coverPhotoUrl}
                            alt="Cover photo"
                            fill
                            style={{ objectFit: 'cover' }}
                            className="bg-gradient-to-r from-purple-400 to-indigo-500"
                            priority
                        />
                        {isEditing && (
                             <label htmlFor="cover-upload" className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full cursor-pointer shadow-md hover:bg-white transition-colors">
                                <FiUpload className="text-gray-700"/>
                                <input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files ? e.target.files[0] : null)} />
                            </label>
                        )}
                        <div className="absolute top-4 right-4 flex gap-3">
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="bg-white/80 text-gray-700 p-2.5 rounded-full shadow-md hover:bg-white transition-transform hover:scale-110">
                                    <FiEdit2 />
                                </button>
                            )}
                            <button onClick={logout} className="bg-red-500/80 text-white p-2.5 rounded-full shadow-md hover:bg-red-500 transition-transform hover:scale-110">
                                <FiLogOut />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 relative">
                        <div className="absolute left-6 -top-20">
                            <div className="relative h-36 w-36 rounded-full border-4 border-white shadow-lg">
                                <Image
                                    src={profileImageFile ? URL.createObjectURL(profileImageFile) : profile.profilePictureUrl}
                                    alt={profile.name}
                                    fill
                                    className="rounded-full bg-gray-200"
                                    style={{ objectFit: 'cover' }}
                                />
                                {isEditing && (
                                    <label htmlFor="profile-upload" className="absolute bottom-1 right-1 bg-white/80 p-2 rounded-full cursor-pointer shadow-md hover:bg-white transition-colors">
                                        <FiUpload className="w-4 h-4 text-gray-700"/>
                                        <input id="profile-upload" type="file" className="hidden" accept="image/*" onChange={(e) => setProfileImageFile(e.target.files ? e.target.files[0] : null)} />
                                    </label>
                                )}
                            </div>
                        </div>
                        
                        <div className="pt-20">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="text-3xl font-bold w-full border-b-2 pb-1 focus:outline-none focus:border-indigo-500" />
                                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="text-gray-600 w-full border rounded-md p-2 mt-2 h-24" rows={3} placeholder="Tell your story..." />
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={handleSaveProfile} disabled={isUploading} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400">
                                            {isUploading ? <><FiLoader className="animate-spin"/> Saving...</> : <><FiSave /> Save</>}
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                                            <FiX /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-4xl font-extrabold text-gray-900">{profile.name}</h1>
                                    <p className="text-gray-500 mt-1">@{profile.username}</p>
                                    <p className="text-gray-700 mt-4">{profile.bio || "You haven't added a bio yet. Click 'Edit' to introduce yourself!"}</p>
                                </>
                            )}
                        </div>
                        
                        <div className="flex justify-around text-center border-t-2 border-gray-100 mt-6 pt-5">
                            <div><p className="text-2xl font-bold text-indigo-600">{stats.totalStories}</p><p className="text-sm text-gray-500 font-medium">Stories</p></div>
                            <div><p className="text-2xl font-bold text-red-500">{stats.totalLikes}</p><p className="text-sm text-gray-500 font-medium">Likes</p></div>
                            <div><p className="text-2xl font-bold text-blue-500">{stats.totalComments}</p><p className="text-sm text-gray-500 font-medium">Comments</p></div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Published Stories</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {publishedStories.length > 0 ? (
                            publishedStories.map(story => <StoryCard key={story.id} story={story} />)
                        ) : (
                            <div className="col-span-full text-center text-gray-500 py-10 bg-white rounded-lg shadow-md">
                                <p className="font-semibold">You haven't published any stories yet.</p>
                                <Link href="/create-story" className="mt-4 inline-block bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                                    Write Your First Story
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

