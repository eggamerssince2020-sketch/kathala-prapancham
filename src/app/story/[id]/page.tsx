"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, Timestamp, collection, query, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../../../firebase';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CommentForm from '@/components/CommentForm';
import CommentsList from '@/components/CommentsList';
import LikeButton from '@/components/LikeButton';
import SaveButton from '@/components/SaveButton';

// --- 1. INTERFACE UPDATED ---
// The `authorUsername` field is added. It's optional ('?') so the app won't crash
// if old stories don't have it yet.
interface Story {
    title: string;
    content: string;
    authorName: string;
    authorId: string;
    authorUsername?: string; // This is the crucial new field
    thumbnailUrl: string;
    createdAt: Timestamp;
}

export default function StoryPage() {
    const params = useParams();
    const id = params.id as string;

    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);
    const [commentCount, setCommentCount] = useState(0);

    useEffect(() => {
        if (!id) return;
        
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

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-4">{story.title}</h1>
            
            <div className="flex justify-center items-center gap-6 text-lg text-gray-500 mb-8">
                
                {/* --- 2. LINK CORRECTED --- */}
                {/* It now checks if authorUsername exists. If so, it links to the correct page.
                    If not, it just displays the name as plain text. */}
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
