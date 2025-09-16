// app/story/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc, collection, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { firestore, storage } from '../../../../firebase';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head'; // --- 1. IMPORT THE HEAD COMPONENT ---
import Image from 'next/image';
import Link from 'next/link';

// Import your components
import CommentForm from '@/components/CommentForm';
import CommentsList from '@/components/CommentsList';
import LikeButton from '@/components/LikeButton';
import SaveButton from '@/components/SaveButton';
import ShareButton from '@/components/ShareButton'; 

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
    createdAt: Timestamp;
}

export default function StoryPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    
    const { user } = useAuth();
    
    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);
    const [commentCount, setCommentCount] = useState(0);

    // --- Function to create a plain text summary for the description ---
    const createDescription = (htmlContent: string) => {
        if (!htmlContent) return '';
        // Removes HTML tags and trims the text to 155 characters for the meta description
        return htmlContent.replace(/<[^>]*>/g, '').substring(0, 155) + '...';
    };

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
                    router.push('/');
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

    const handleDelete = async () => {
        // ... (handleDelete function remains the same)
        if (!story || !user || user.uid !== story.authorId) {
            alert("You are not authorized to delete this story.");
            return;
        }

        if (confirm("Are you sure you want to permanently delete this story? This action cannot be undone.")) {
            try {
                const thumbnailRef = ref(storage, story.thumbnailUrl);
                await deleteObject(thumbnailRef);
                await deleteDoc(doc(firestore, "stories", id));
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

    const isAuthor = user && user.uid === story.authorId;
    const storyDescription = createDescription(story.content);
    const storyUrl = `https://yourwebsite.com/story/${id}`; // IMPORTANT: Replace with your actual domain

    return (
        <>
            {/* --- 2. ADD THE HEAD COMPONENT WITH DYNAMIC META TAGS --- */}
            <Head>
                <title>{story.title}</title>
                <meta name="description" content={storyDescription} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="article" />
                <meta property="og:url" content={storyUrl} />
                <meta property="og:title" content={story.title} />
                <meta property="og:description" content={storyDescription} />
                <meta property="og:image" content={story.thumbnailUrl} />

                {/* Twitter */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content={storyUrl} />
                <meta property="twitter:title" content={story.title} />
                <meta property="twitter:description" content={storyDescription} />
                <meta property="twitter:image" content={story.thumbnailUrl} />
            </Head>

            <WavyBackground
                backgroundFill="#fefae0"
                colors={["#fa9451", "#ffc071", "#ff6b6b", "#e07a5f"]}
                waveOpacity={0.4}
                blur={15}
            >
                <div className="min-h-screen py-12 px-4">
                    <article className="max-w-4xl mx-auto p-6 sm:p-10 bg-white/60 backdrop-blur-2xl rounded-2xl shadow-2xl">
                        
                        <div className="relative h-64 sm:h-96 w-full mb-8 rounded-lg overflow-hidden shadow-lg">
                            <Image src={story.thumbnailUrl} alt={story.title} fill style={{ objectFit: 'cover' }} priority />
                        </div>
                        
                        <div className="text-center mb-8">
                            {story.genre && <span className="font-semibold px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">{story.genre}</span>}
                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-4">{story.title}</h1>
                            <div className="text-lg text-gray-600 mt-2">
                                <span>by {story.authorName}</span>
                            </div>
                        </div>
                        
                        <div className="prose lg:prose-xl mx-auto mb-12 story-content" dangerouslySetInnerHTML={{ __html: story.content }} />

                        <div className="flex flex-wrap justify-between items-center gap-4 border-t pt-6">
                            {/* --- 3. UPDATED BUTTON GROUP --- */}
                            <div className="flex items-center gap-3">
                               <LikeButton storyId={id} />
                               <SaveButton storyId={id} />
                               <ShareButton storyId={id} title={story.title} />
                            </div>
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
        </>
    );
}
