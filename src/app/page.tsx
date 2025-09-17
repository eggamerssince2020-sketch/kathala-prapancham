"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, DocumentData } from 'firebase/firestore';
import { firestore } from '../../firebase';
import Link from 'next/link';
import Image from 'next/image';

// Import the new components and icons
import { Rating } from 'react-simple-star-rating';
import { FiHeart, FiMessageCircle } from 'react-icons/fi';

interface Story {
    id: string;
    title: string;
    thumbnailUrl: string;
    authorName: string;
    likeCount: number;
    commentCount: number;
    averageRating: number;
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
                
                const storiesListPromises = storiesSnapshot.docs.map(async (doc) => {
                    const data: DocumentData = doc.data();

                    const [likesSnap, commentsSnap, ratingsSnap] = await Promise.all([
                        getDocs(collection(firestore, 'stories', doc.id, 'likes')),
                        getDocs(collection(firestore, 'stories', doc.id, 'comments')),
                        getDocs(collection(firestore, 'stories', doc.id, 'ratings'))
                    ]);

                    let totalRating = 0;
                    ratingsSnap.forEach(ratingDoc => {
                        totalRating += ratingDoc.data().value;
                    });
                    const averageRating = ratingsSnap.size > 0 ? totalRating / ratingsSnap.size : 0;

                    return {
                        id: doc.id,
                        title: data.title,
                        thumbnailUrl: data.thumbnailUrl,
                        authorName: data.authorName,
                        likeCount: likesSnap.size,
                        commentCount: commentsSnap.size,
                        averageRating: averageRating,
                    } as Story;
                });

                const storiesList = await Promise.all(storiesListPromises);
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
        // --- UPDATED: Background has been removed for a clean look ---
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    {/* Text color is set for a light/default background */}
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
                            <div key={story.id} className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl">
                                <Link href={`/story/${story.id}`} className="block h-full w-full">
                                    <Image
                                        className="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        src={story.thumbnailUrl}
                                        alt={story.title}
                                        width={400}
                                        height={320}
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                                        <h3 className="text-xl font-bold drop-shadow-lg">
                                            {story.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-200 drop-shadow-lg">
                                            by {story.authorName || 'Anonymous'}
                                        </p>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center gap-1.5">
                                                    <FiHeart className="h-5 w-5 text-red-400 drop-shadow-lg"/>
                                                    <span className="font-semibold text-sm drop-shadow-lg">{story.likeCount}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <FiMessageCircle className="h-5 w-5 text-sky-300 drop-shadow-lg"/>
                                                    <span className="font-semibold text-sm drop-shadow-lg">{story.commentCount}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <Rating
                                                    initialValue={story.averageRating}
                                                    size={20}
                                                    readonly={true}
                                                    fillColor="#facc15"
                                                    emptyColor="rgba(255, 255, 255, 0.3)"
                                                    style={{ display: 'flex' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )) : (
                            <p className="text-center col-span-3 mt-12">No stories have been published yet. Be the first!</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
