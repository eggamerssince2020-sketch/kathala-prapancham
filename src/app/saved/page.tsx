// src/app/saved/page.tsx
"use client";

import { useAuth } from '@/context/AuthContext';
import { firestore } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // <-- Import the Image component

// --- INTERFACE UPDATED ---
interface Story {
  id: string;
  title: string;
  authorUsername: string;
  thumbnailUrl: string; // <-- Add the thumbnail URL property
}

export default function SavedStoriesPage() {
    const { user } = useAuth();
    const [savedStories, setSavedStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavedStories = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const userRef = doc(firestore, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const storyIds = userSnap.data().savedStories || [];
                    if (storyIds.length === 0) {
                        setSavedStories([]);
                        setLoading(false);
                        return;
                    }
                    
                    const storyPromises = storyIds.map((storyId: string) => getDoc(doc(firestore, 'stories', storyId)));
                    const storyDocs = await Promise.all(storyPromises);
                    
                    const storiesData: Story[] = storyDocs
                        .filter(docSnap => docSnap.exists())
                        .map(docSnap => ({
                            id: docSnap.id,
                            ...docSnap.data(),
                        } as Story));
                    setSavedStories(storiesData);
                }
            } catch (error) {
                console.error("Error fetching saved stories: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSavedStories();
    }, [user]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <p className="text-gray-500 animate-pulse">Loading your saved stories...</p>
            </div>
        );
    }
    
    if (!user) {
         return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
                <p className="text-gray-600">You must be logged in to view saved stories.</p>
                <Link href="/login" className="mt-6 inline-block bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700">
                    Go to Log In
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="pb-5 border-b border-gray-200 mb-8">
                <h1 className="text-3xl font-bold leading-6 text-gray-900">My Saved Stories</h1>
                <p className="mt-2 text-sm text-gray-500">Your personal reading list. Click any story to start reading.</p>
            </div>

            {savedStories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {savedStories.map((story) => (
                        <Link href={`/story/${story.id}`} key={story.id} className="block group bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-200 overflow-hidden">
                            {/* --- IMAGE ADDED --- */}
                            <div className="relative h-40 w-full">
                                <Image
                                    src={story.thumbnailUrl}
                                    alt={story.title}
                                    layout="fill"
                                    objectFit="cover"
                                    className="transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-4">
                                <h2 className="text-lg font-bold text-gray-900 mb-2 truncate group-hover:text-blue-600">{story.title}</h2>
                                <p className="text-sm text-gray-500">by {story.authorUsername}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-6 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900">Your Reading List is Empty</h3>
                    <p className="mt-2 text-sm text-gray-500">Find a story you like and save it to read later.</p>
                    <Link href="/" className="mt-6 inline-block bg-blue-600 text-white font-medium py-2 px-5 rounded-md hover:bg-blue-700">
                        Explore Stories
                    </Link>
                </div>
            )}
        </div>
    );
}
