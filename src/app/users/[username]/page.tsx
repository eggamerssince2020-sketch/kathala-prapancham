"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firestore, storage } from '../../../../firebase'; // Adjust this path
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { FiEdit2, FiSave, FiX, FiHeart, FiMessageCircle, FiUpload, FiLoader } from 'react-icons/fi';

// --- INTERFACES AND STORYCARD COMPONENT ---
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
    followersCount?: number;
    followingCount?: number;
}

const StoryCard = ({ story }: { story: Story }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
        <Link href={`/story/${story.id}`}>
            <div className="relative h-48 w-full"><Image src={story.thumbnailUrl} alt={story.title} fill style={{ objectFit: 'cover' }} className="transition-transform duration-300 group-hover:scale-110" /></div>
            <div className="p-4">
                <p className="text-sm font-semibold text-indigo-600">{story.genre}</p>
                <h3 className="text-lg font-bold text-gray-800 truncate mt-1">{story.title}</h3>
                <div className="flex items-center text-gray-500 mt-3 text-sm gap-5">
                    <div className="flex items-center gap-1.5"><FiHeart className="w-4 h-4 text-red-500" /><span>{story.likeCount || 0}</span></div>
                    <div className="flex items-center gap-1.5"><FiMessageCircle className="w-4 h-4 text-blue-500" /><span>{story.commentCount || 0}</span></div>
                </div>
            </div>
        </Link>
    </div>
);


export default function PublicProfilePage() {
    const params = useParams();
    const { user: currentUser, loading: authLoading } = useAuth();
    const username = params.username as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [publishedStories, setPublishedStories] = useState<Story[]>([]);
    const [stats, setStats] = useState({ totalStories: 0, totalLikes: 0, totalComments: 0 });
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    // --- State for In-Place Editing ---
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const isOwnProfile = currentUser && profile && currentUser.uid === profile.uid;

    useEffect(() => {
        if (!username) return;

        const fetchProfileData = async () => {
            setLoading(true);
            const usersQuery = query(collection(firestore, "users"), where("username", "==", username));
            const querySnapshot = await getDocs(usersQuery);

            if (querySnapshot.empty) {
                setLoading(false);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const userProfileData: UserProfile = {
                uid: userDoc.id,
                name: userData.name || 'Anonymous',
                username: userData.username,
                bio: userData.bio || '',
                profilePictureUrl: userData.photoURL || '/default-avatar.png',
                coverPhotoUrl: userData.coverPhotoUrl || '/default-cover.png',
                followersCount: userData.followersCount || 0,
                followingCount: userData.followingCount || 0,
            };
            setProfile(userProfileData);
            setEditName(userProfileData.name);
            setEditBio(userProfileData.bio);

            // Fetch Follow Status
            if (currentUser && userDoc.id !== currentUser.uid) {
                const followRef = doc(firestore, `users/${userDoc.id}/followers/${currentUser.uid}`);
                const followSnap = await getDoc(followRef);
                setIsFollowing(followSnap.exists());
            }

            // Fetch stories and calculate advanced stats
            const storiesQuery = query(collection(firestore, "stories"), where("authorId", "==", userDoc.id));
            const storiesSnapshot = await getDocs(storiesQuery);
            
            let totalLikes = 0, totalComments = 0;
            const storiesPromises = storiesSnapshot.docs.map(async (storyDoc) => {
                const storyData = storyDoc.data();
                const [likesSnap, commentsSnap] = await Promise.all([
                    getDocs(collection(firestore, 'stories', storyDoc.id, 'likes')),
                    getDocs(collection(firestore, 'stories', storyDoc.id, 'comments'))
                ]);
                totalLikes += likesSnap.size; totalComments += commentsSnap.size;
                return { id: storyDoc.id, ...storyData, likeCount: likesSnap.size, commentCount: commentsSnap.size } as Story;
            });

            const stories = await Promise.all(storiesPromises);
            setPublishedStories(stories);
            setStats({ totalStories: stories.length, totalLikes, totalComments });
            setLoading(false);
        };

        fetchProfileData();
    }, [username, currentUser]);

    const handleFollowToggle = async () => {
        if (!currentUser || !profile || isOwnProfile) return;
        const followRef = doc(firestore, `users/${profile.uid}/followers/${currentUser.uid}`);
        const followingRef = doc(firestore, `users/${currentUser.uid}/following/${profile.uid}`);

        if (isFollowing) {
            await deleteDoc(followRef);
            await deleteDoc(followingRef);
            setIsFollowing(false);
            setProfile(p => p ? { ...p, followersCount: (p.followersCount || 1) - 1 } : null);
        } else {
            await setDoc(followRef, { followedAt: new Date() });
            await setDoc(followingRef, { followingAt: new Date() });
            setIsFollowing(true);
            setProfile(p => p ? { ...p, followersCount: (p.followersCount || 0) + 1 } : null);
        }
    };
    
    const handleSaveProfile = async () => {
        if (!profile) return;
        setIsUploading(true);
        let profilePictureUrl = profile.profilePictureUrl, coverPhotoUrl = profile.coverPhotoUrl;
        if (profileImageFile) {
            const profileRef = ref(storage, `profile_pictures/${profile.uid}`);
            await uploadBytes(profileRef, profileImageFile);
            profilePictureUrl = await getDownloadURL(profileRef);
        }
        if (coverImageFile) {
            const coverRef = ref(storage, `cover_photos/${profile.uid}`);
            await uploadBytes(coverRef, coverImageFile);
            coverPhotoUrl = await getDownloadURL(coverRef);
        }
        const updatedData = { name: editName, bio: editBio, photoURL: profilePictureUrl, coverPhotoUrl };
        await updateDoc(doc(firestore, 'users', profile.uid), updatedData);
        setProfile(prev => prev ? { ...prev, ...updatedData } : null);
        setIsUploading(false); setIsEditing(false);
    };

    if (loading || authLoading) {
        return <div className="flex justify-center items-center min-h-screen"><FiLoader className="animate-spin text-4xl text-indigo-600"/></div>;
    }

    if (!profile) {
        return <div className="text-center py-20 text-xl font-semibold">User not found.</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                    <div className="relative h-56 sm:h-72">
                        <Image src={coverImageFile ? URL.createObjectURL(coverImageFile) : profile.coverPhotoUrl} alt="Cover" fill style={{ objectFit: 'cover' }} className="bg-gradient-to-r from-purple-400 to-indigo-500" priority />
                        {isOwnProfile && isEditing && (<label htmlFor="cover-upload" className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full cursor-pointer shadow-md hover:bg-white"><FiUpload className="text-gray-700"/><input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files ? e.target.files[0] : null)} /></label>)}
                        {isOwnProfile && !isEditing && (<div className="absolute top-4 right-4"><button onClick={() => setIsEditing(true)} className="bg-white/80 text-gray-700 p-2.5 rounded-full shadow-md hover:bg-white"><FiEdit2 /></button></div>)}
                    </div>
                    <div className="p-6 relative">
                        <div className="flex justify-end items-center absolute right-6 -top-8">
                            {!isOwnProfile && currentUser && (
                                <button onClick={handleFollowToggle} className={`font-bold py-2 px-6 rounded-full transition-colors ${isFollowing ? 'bg-gray-200 text-gray-800' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>
                        <div className="absolute left-6 -top-20">
                            <div className="relative h-36 w-36 rounded-full border-4 border-white shadow-lg">
                                <Image src={profileImageFile ? URL.createObjectURL(profileImageFile) : profile.profilePictureUrl} alt={profile.name} fill className="rounded-full bg-gray-200" style={{ objectFit: 'cover' }} />
                                {isOwnProfile && isEditing && (<label htmlFor="profile-upload" className="absolute bottom-1 right-1 bg-white/80 p-2 rounded-full cursor-pointer shadow-md hover:bg-white"><FiUpload className="w-4 h-4 text-gray-700"/><input id="profile-upload" type="file" className="hidden" accept="image/*" onChange={(e) => setProfileImageFile(e.target.files ? e.target.files[0] : null)} /></label>)}
                            </div>
                        </div>
                        <div className="pt-20">
                            {isOwnProfile && isEditing ? (
                                <div className="space-y-4">
                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="text-3xl font-bold w-full border-b-2 focus:outline-none focus:border-indigo-500" />
                                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="text-gray-600 w-full border rounded-md p-2 mt-2" rows={3} />
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={handleSaveProfile} disabled={isUploading} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400">{isUploading ? <><FiLoader className="animate-spin"/> Saving...</> : <><FiSave /> Save</>}</button>
                                        <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-300"><FiX /> Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-4xl font-extrabold text-gray-900">{profile.name}</h1>
                                    <p className="text-gray-500 mt-1">@{profile.username}</p>
                                    <p className="text-gray-700 mt-4">{profile.bio || "This author hasn't added a bio yet."}</p>
                                </>
                            )}
                        </div>
                        <div className="flex justify-around text-center border-t-2 mt-6 pt-5">
                            <div><p className="text-2xl font-bold text-indigo-600">{stats.totalStories}</p><p className="text-sm text-gray-500 font-medium">Stories</p></div>
                            <div><p className="text-2xl font-bold text-red-500">{stats.totalLikes}</p><p className="text-sm text-gray-500 font-medium">Likes</p></div>
                            <div><p className="text-2xl font-bold text-blue-500">{stats.totalComments}</p><p className="text-sm text-gray-500 font-medium">Comments</p></div>
                            <div className="hidden sm:block"><p className="text-2xl font-bold">{profile.followersCount}</p><p className="text-sm text-gray-500 font-medium">Followers</p></div>
                            <div className="hidden sm:block"><p className="text-2xl font-bold">{profile.followingCount}</p><p className="text-sm text-gray-500 font-medium">Following</p></div>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Published Stories</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {publishedStories.length > 0 ? (publishedStories.map(story => <StoryCard key={story.id} story={story} />)) : (<p className="col-span-full text-center text-gray-500 py-10">This author hasn't published any stories yet.</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
}

