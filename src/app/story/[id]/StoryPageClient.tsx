// app/story/[id]/StoryPageClient.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, deleteDoc, collection, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { firestore, storage } from '../../../../firebase';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

// Import your components
import CommentForm from '@/components/CommentForm';
import CommentsList from '@/components/CommentsList';
import LikeButton from '@/components/LikeButton';
import SaveButton from '@/components/SaveButton';
import ShareButton from '@/components/ShareButton'; // Import the ShareButton

// Import the background component
import { WavyBackground } from '@/components/WavyBackground';

interface Story {
    id: string;
    title: string;
    content: string;
    authorName: string;
    authorId: string;
    authorUsername?: string;
    thumbnailUrl: string;
    genre: string;
    createdAt: string; // Changed to string to be passed from server
}

// The client component now accepts the initial story data as a prop
export default function StoryPageClient({ initialStory }: { initialStory: Story }) {
    const router = useRouter();
    const { user } = useAuth();
    
    const [story, setStory] = useState<Story>(initialStory);
    const [commentCount, setCommentCount] = useState(0);

    // Effect for real-time comment count
    useEffect(() => {
        const commentsQuery = query(collection(firestore, 'stories', story.id, 'comments'));
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            setCommentCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [story.id]);

    const handleDelete = async () => {
        // ... (handleDelete function remains the same as your original)
        if (!story || !user || user.uid !== story.authorId) {
            alert("You are not authorized to delete this story.");
            return;
        }

        if (confirm("Are you sure you want to permanently delete this story? This action cannot be undone.")) {
            try {
                const thumbnailRef = ref(storage, story.thumbnailUrl);
                await deleteObject(thumbnailRef);
                await deleteDoc(doc(firestore, "stories", story.id));
                router.push('/');
            } catch (error) {
                console.error("Error deleting story:", error);
                alert("Failed to delete story. Please try again.");
            }
        }
    };

    const isAuthor = user && user.uid === story.authorId;

    return (
        <WavyBackground
            backgroundFill="#fefae0"
            colors={["#fa9451", "#ffc071", "#ff6b6b", "#e07a5f"]}
            waveOpacity={0.4}
            blur={15}
        >
            <div className="min-h-screen py-12 px-4">
                <article className="max-w-4xl mx-auto p-6 sm:p-10 bg-white/60 backdrop-blur-2xl rounded-2xl shadow-2xl">
                    
                    <div className="relative h-64 sm:h-96 w-full mb-8 rounded-lg overflow-hidden shadow-lg">
                        <Image
                            src={story.thumbnailUrl}
                            alt={story.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            priority
                        />
                    </div>
                    
                    <div className="text-center mb-8">
                        {story.genre && <span className="font-semibold px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">{story.genre}</span>}
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-4">{story.title}</h1>
                        <div className="text-lg text-gray-600 mt-2">
                            <span>by {story.authorName}</span>
                        </div>
                    </div>
                    
                    <div 
                        className="prose lg:prose-xl mx-auto mb-12 story-content"
                        dangerouslySetInnerHTML={{ __html: story.content }}
                    />

                    <div className="flex flex-wrap justify-between items-center gap-4 border-t pt-6">
                        <div className="flex items-center gap-3"> {/* Reduced gap for smaller buttons */}
                           <LikeButton storyId={story.id} />
                           <SaveButton storyId={story.id} />
                           {/* --- ADD THE SHAREBUTTON COMPONENT --- */}
                           <ShareButton storyId={story.id} title={story.title} />
                        </div>
                        {isAuthor && (
                            <div className="flex items-center gap-4">
                                <Link href={`/story/${story.id}/edit`} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition">
                                    Edit Story
                                </Link>
                                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition">
                                    Delete Story
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-8 mt-8">
                        <h2 className="text-2xl font-bold mb-4">{commentCount} Comments</h2>
                        <CommentForm storyId={story.id} onCommentPosted={() => {}} />
                        <CommentsList storyId={story.id} />
                    </div>
                </article>
            </div>
        </WavyBackground>
    );
}
