"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../../../firebase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import FollowButton from '@/components/FollowButton';

// Interfaces for our data
interface Author {
    displayName: string;
    photoURL?: string;
}

interface Story {
    id: string;
    title: string;
    thumbnailUrl: string;
}

export default function AuthorPage() {
    const params = useParams();
    const authorId = params.authorId as string;

    const [author, setAuthor] = useState<Author | null>(null);
    const [stories, setStories] = useState<Story[]>([]);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authorId) return;

        // Fetch author details and their stories
        const fetchData = async () => {
            setLoading(true);
            try {
                // Get author details
                const authorRef = doc(firestore, 'users', authorId);
                const authorSnap = await getDoc(authorRef);
                if (authorSnap.exists()) {
                    setAuthor(authorSnap.data() as Author);
                }

                // Get author's stories
                const storiesQuery = query(collection(firestore, 'stories'), where("authorId", "==", authorId));
                const storiesSnapshot = await getDocs(storiesQuery);
                const storiesList = storiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
                setStories(storiesList);

            } catch (error) {
                console.error("Error fetching author data:", error);
            }
        };

        // Set up a real-time listener for follower/following counts
        const authorRef = doc(firestore, 'users', authorId);
        const unsubscribe = onSnapshot(authorRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setFollowersCount(data.followers?.length || 0);
                setFollowingCount(data.following?.length || 0);
            }
        });

        fetchData().finally(() => setLoading(false));

        return () => unsubscribe(); // Cleanup the listener
    }, [authorId]);

    if (loading) {
        return <p className="text-center mt-20">Loading author profile...</p>;
    }

    if (!author) {
        return <p className="text-center mt-20">Author not found.</p>;
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <div className="flex flex-col items-center text-center">
                {/* Author Info */}
                <h1 className="text-4xl font-bold">{author.displayName}</h1>
                <div className="flex items-center gap-6 my-4 text-gray-600">
                    <span>{followersCount} Followers</span>
                    <span>{followingCount} Following</span>
                </div>
                
                {/* Follow Button */}
                <FollowButton authorId={authorId} />
            </div>

            {/* Author's Stories */}
            <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6">Stories by {author.displayName}</h2>
                <div className="grid gap-8 lg:grid-cols-3">
                    {stories.length > 0 ? stories.map(story => (
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
                                </div>
                            </div>
                        </Link>
                    )) : (
                        <p>This author has not published any stories yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
