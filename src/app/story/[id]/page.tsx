"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, Timestamp, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../../../firebase';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import CommentForm from '@/components/CommentForm';
import CommentsList from '@/components/CommentsList'; // Import the new component

interface Story {
    title: string;
    content: string;
    authorName: string;
    thumbnailUrl: string;
    createdAt: Timestamp;
}

export default function StoryPage() {
    const params = useParams();
    const id = params.id as string;

    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);
    const [commentCount, setCommentCount] = useState(0); // Optional: state to hold comment count

    useEffect(() => {
        if (!id) return;
        
        // Fetch the main story data
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
        
        // Optional: Listen to comment count changes in real-time
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
            <p className="text-center text-lg text-gray-500 mb-8">by {story.authorName}</p>
            
            <div className="relative h-96 w-full mb-8 rounded-lg overflow-hidden">
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

            {/* --- FINAL COMMENTS SECTION --- */}
            <div className="border-t pt-8">
                <h2 className="text-2xl font-bold mb-4">{commentCount} Comments</h2>
                
                {/* The form to add a new comment */}
                <CommentForm storyId={id} onCommentPosted={() => { /* No action needed here anymore */ }} />
                
                {/* The list that displays comments in real-time */}
                <CommentsList storyId={id} />
            </div>
        </div>
    );
}
