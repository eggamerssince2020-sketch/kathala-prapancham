"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, Timestamp, collection, query, onSnapshot } from 'firebase/firestore';
// Import Firebase auth to get the current user
import { getAuth } from 'firebase/auth'; 
import { firestore } from '../../../../firebase';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CommentForm from '@/components/CommentForm';
import CommentsList from '@/components/CommentsList';
import LikeButton from '@/components/LikeButton';
import SaveButton from '@/components/SaveButton';

interface Story {
    title: string;
    content: string;
    authorName: string;
    authorId: string; // This is used to check ownership
    authorUsername?: string;
    thumbnailUrl: string;
    createdAt: Timestamp;
}

export default function StoryPage() {
    const params = useParams();
    const id = params.id as string;

    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);
    const [commentCount, setCommentCount] = useState(0);
    // --- 1. State to hold the current user's ID ---
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        
        // --- 2. Get the current logged-in user ---
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
            setCurrentUserId(user.uid);
        }

        const fetchStory = async () => {
            try {
                const storyRef = doc(firestore, 'stories', id);
                const storySnap = await getDoc(storyRef);
                if (storySnap.exists()) {
                    setStory(storySnap.data() as Story);
                } else {
                    console.error("No such story found!");
                }
            } catch (error) {
                console.error("Error fetching story:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStory();
        
        const commentsQuery = query(collection(firestore, 'stories', id, 'comments'));
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            setCommentCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [id]);

    if (loading) {
        return <p className="text-center mt-12">Loading story...</p>;
    }

    if (!story) {
        return <p className="text-center mt-12">Story not found.</p>;
    }

    // --- 3. Check if the current user is the author of the story ---
    const isAuthor = currentUserId === story.authorId;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            
            {/* --- 4. Conditionally render the Edit button --- */}
            {isAuthor && (
                <div className="text-right mb-6">
                    <Link
                        href={`/story/${id}/edit`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Edit Story
                    </Link>
                </div>
            )}

            <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-4">{story.title}</h1>
            
            <div className="flex justify-center items-center gap-6 text-lg text-gray-500 mb-8">
                {story.authorUsername ? (
                    <Link href={`/users/${story.authorUsername}`} className="hover:underline">
                        by {story.authorName}
                    </Link>
                ) : (
                    <span>by {story.authorName}</span>
                )}

                <div className="flex items-center gap-4">
                    <LikeButton storyId={id} />
                    <SaveButton storyId={id} />
                </div>
            </div>
            
            <div className="relative h-96 w-full mb-8 rounded-lg overflow-hidden shadow-lg">
                <Image
                    src={story.thumbnailUrl}
                    alt={story.title}
                    layout="fill"
                    objectFit="cover"
                />
            </div>
            
            <div className="prose lg:prose-xl mx-auto mb-12">
                <p>{story.content}</p>
            </div>

            <div className="border-t pt-8">
                <h2 className="text-2xl font-bold mb-4">{commentCount} Comments</h2>
                <CommentForm storyId={id} onCommentPosted={() => {}} />
                <CommentsList storyId={id} />
            </div>
        </div>
    );
}
