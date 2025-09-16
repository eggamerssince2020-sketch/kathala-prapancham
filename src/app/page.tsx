"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firestore } from '../../firebase';
import Link from 'next/link';
import Image from 'next/image';
import LikeButton from '@/components/LikeButton';

interface Story {
    id: string;
    title: string;
    thumbnailUrl: string;
    authorName: string;
}

export default function Home() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const storiesCollection = collection(firestore, 'stories');
                const q = query(storiesCollection, orderBy('createdAt', 'desc'));
                const storiesSnapshot = await getDocs(q);
                
                const storiesList = storiesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Story));
                
                setStories(storiesList);
            } catch (error) {
                console.error("Error fetching stories:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStories();
    }, []);

    return (
        // --- 1. REMOVED bg-gray-50 and min-h-screen from this container ---
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                {/* --- 3. Adjusted text color for better contrast --- */}
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-800 sm:text-5xl">
                    Dive into the World of Stories
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
                    Explore tales of adventure, romance, and mystery from our talented authors.
                </p>
            </div>

            {loading ? (
                <p className="text-center mt-12">Loading stories...</p>
            ) : (
                <div className="mt-12 max-w-lg mx-auto grid gap-8 lg:grid-cols-3 lg:max-w-none">
                    {stories.length > 0 ? stories.map(story => (
                        <div key={story.id} className="group flex flex-col rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                            <Link href={`/story/${story.id}`}>
                                <div className="flex-shrink-0 cursor-pointer">
                                    <Image 
                                        className="h-48 w-full object-cover" 
                                        src={story.thumbnailUrl} 
                                        alt={story.title}
                                        width={400}
                                        height={200}
                                    />
                                </div>
                            </Link>
                            {/* --- 2. APPLIED FROSTED GLASS EFFECT HERE --- */}
                            <div className="flex-1 bg-white/30 backdrop-blur-md p-6 flex flex-col justify-between">
                                <div className="flex-1">
                                    <Link href={`/story/${story.id}`} className="block mt-2">
                                        <p className="text-xl font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                                            {story.title}
                                        </p>
                                    </Link>
                                    <p className="mt-3 text-base text-gray-700">
                                        by {story.authorName || 'Anonymous'}
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center">
                                    <LikeButton storyId={story.id} />
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center col-span-3 mt-12">No stories have been published yet. Be the first!</p>
                    )}
                </div>
            )}
        </div>
    );
}
