"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firestore } from '../../firebase';
import Link from 'next/link';
import Image from 'next/image';

// Define a type for the story data we expect from Firestore
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
                // Query the 'stories' collection, ordering by creation date
                const storiesCollection = collection(firestore, 'stories');
                const q = query(storiesCollection, orderBy('createdAt', 'desc'));
                const storiesSnapshot = await getDocs(q);
                
                // Map the document data to our Story type
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
    }, []); // The empty dependency array means this runs once when the page loads

    return (
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                Dive into the World of Stories
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Explore tales of adventure, romance, and mystery from our talented authors.
              </p>
            </div>

            {loading ? (
                <p className="text-center mt-12">Loading stories...</p>
            ) : (
                <div className="mt-12 max-w-lg mx-auto grid gap-8 lg:grid-cols-3 lg:max-w-none">
                    {stories.length > 0 ? stories.map(story => (
                        // ======================================================
                        // THIS IS THE ONLY CHANGE: The div is now a Link
                        // ======================================================
                        <Link key={story.id} href={`/story/${story.id}`} className="flex flex-col rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex-shrink-0">
                                <Image 
                                    className="h-48 w-full object-cover" 
                                    src={story.thumbnailUrl} 
                                    alt={story.title}
                                    width={400}
                                    height={200}
                                />
                            </div>
                            <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                                <div className="flex-1">
                                    <p className="text-xl font-semibold text-gray-900">
                                        {story.title}
                                    </p>
                                    <p className="mt-3 text-base text-gray-500">
                                        by {story.authorName || 'Anonymous'}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    )) : (
                        <p className="text-center col-span-3 mt-12">No stories have been published yet. Be the first!</p>
                    )}
                </div>
            )}
            </div>
        </div>
    );
}
