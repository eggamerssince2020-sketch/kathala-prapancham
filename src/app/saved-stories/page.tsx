"use client";

import { useState, useEffect } from 'react';
// Corrected import: 'collection' was removed as it was not being used.
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/../firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// We can reuse the Story interface from other pages
interface Story {
    id: string;
    title: string;
    thumbnailUrl: string;
    authorName: string;
}

export default function SavedStoriesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [savedStories, setSavedStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return; // Wait for authentication to finish
        if (!user) {
            router.push('/login'); // Redirect if not logged in
            return;
        }

        const fetchSavedStories = async () => {
            setLoading(true);
            const userRef = doc(firestore, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const savedStoryIds = userData.savedStories || [];

                if (savedStoryIds.length > 0) {
                    // Fetch each saved story's details
                    const storyPromises = savedStoryIds.map((storyId: string) => 
                        getDoc(doc(firestore, 'stories', storyId))
                    );
                    const storyDocs = await Promise.all(storyPromises);

                    const storiesList = storyDocs
                        .filter(docSnap => docSnap.exists())
                        .map(docSnap => ({
                            id: docSnap.id,
                            ...docSnap.data()
                        } as Story));

                    setSavedStories(storiesList);
                }
            }
            setLoading(false);
        };

        fetchSavedStories();
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return <p className="text-center mt-20">Loading your saved stories...</p>;
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold mb-8">My Saved Stories</h1>

            {savedStories.length > 0 ? (
                <div className="grid gap-8 lg:grid-cols-3">
                    {savedStories.map(story => (
                        <Link key={story.id} href={`/story/${story.id}`} className="block group">
                            <div className="flex flex-col rounded-lg shadow-lg overflow-hidden h-full">
                                <div className="flex-shrink-0">
                                    <Image
                                        className="h-48 w-full object-cover"
                                        src={story.thumbnailUrl}
                                        alt={story.title}
                                        width={400}
                                        height={200}
                                    />
                                </div>
                                <div className="p-6 bg-white">
                                    <h3 className="text-xl font-semibold text-gray-900 group-hover:underline">{story.title}</h3>
                                    <p className="mt-2 text-base text-gray-500">by {story.authorName}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                // Corrected line: "haven't" is changed to "haven&apos;t" to fix the error.
                <p className="text-gray-600">You haven&apos;t saved any stories yet.</p>
            )}
        </div>
    );
}
