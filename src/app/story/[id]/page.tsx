"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc, collection, query, onSnapshot, Timestamp } from 'firebase/firestore';
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

// Import the background component
import { WavyBackground } from '@/components/WavyBackground';

interface Story {
    id: string; // Add id to the interface
    title: string;
    content: string;
    authorName: string;
    authorId: string;
    authorUsername?: string;
    thumbnailUrl: string;
    genre: string; // Assuming genre is part of your story data
    createdAt: Timestamp;
}

export default function StoryPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    
    // --- 1. CORRECTLY GET THE USER FROM OUR AUTH CONTEXT ---
    const { user } = useAuth();
    
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
                    setStory({ id: storySnap.id, ...storySnap.data() } as Story);
                } else {
                    console.error("No such story found!");
                    router.push('/'); // Redirect if story doesn't exist
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
    }, [id, router]);

    // --- 2. ADD THE DELETE HANDLER ---
    const handleDelete = async () => {
        if (!story || !user || user.uid !== story.authorId) {
            alert("You are not authorized to delete this story.");
            return;
        }

        if (confirm("Are you sure you want to permanently delete this story? This action cannot be undone.")) {
            try {
                // Delete thumbnail from storage
                const thumbnailRef = ref(storage, story.thumbnailUrl);
                await deleteObject(thumbnailRef);

                // Delete story document from firestore
                await deleteDoc(doc(firestore, "stories", id));
                
                // Redirect to homepage
                router.push('/');
            } catch (error) {
                console.error("Error deleting story:", error);
                alert("Failed to delete story. Please try again.");
            }
        }
    };

    if (loading) {
        return <p className="text-center mt-12">Loading story...</p>;
    }

    if (!story) {
        return <p className="text-center mt-12">Story not found.</p>;
    }

    // --- 3. CHECK IF THE LOGGED-IN USER IS THE AUTHOR ---
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
                            {story.authorUsername ? (
                                <Link href={`/users/${story.authorUsername}`} className="hover:underline">
                                    by {story.authorName}
                                </Link>
                            ) : (
                                <span>by {story.authorName}</span>
                            )}
                        </div>
                    </div>
                    
                    {/* --- 4. RENDER THE RICH TEXT CONTENT --- */}
                    <div 
                        className="prose lg:prose-xl mx-auto mb-12 story-content"
                        dangerouslySetInnerHTML={{ __html: story.content }}
                    />

                    <div className="flex flex-wrap justify-between items-center gap-4 border-t pt-6">
                        <div className="flex items-center gap-4">
                           <LikeButton storyId={id} />
                           <SaveButton storyId={id} />
                        </div>
                        {/* --- 5. AUTHOR-ONLY ACTION BUTTONS --- */}
                        {isAuthor && (
                            <div className="flex items-center gap-4">
                                <Link href={`/story/${id}/edit`} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition">
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
                        <CommentForm storyId={id} onCommentPosted={() => {}} />
                        <CommentsList storyId={id} />
                    </div>
                </article>
            </div>
        </WavyBackground>
    );
}

// REMINDER: Add this style to your globals.css to ensure content from the editor is styled correctly
/*
.story-content p { margin-bottom: 1em; }
.story-content ol, .story-content ul { margin-left: 1.5em; margin-bottom: 1em; }
.story-content a { color: #f97316; }
.story-content a:hover { text-decoration: underline; }
*/
