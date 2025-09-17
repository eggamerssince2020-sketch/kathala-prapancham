"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc, collection, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { firestore, storage } from '../../../../firebase';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

// Import your components
import CommentForm from '@/components/CommentForm';
import CommentsList from '@/components/CommentsList';
import LikeButton from '@/components/LikeButton';
import SaveButton from '@/components/SaveButton';
import ShareButton from '@/components/ShareButton';
import RateStory from '@/components/RateStory';
// Using react-icons for a modern icon set
import { FiClock, FiEdit, FiTrash2 } from 'react-icons/fi';

// --- DATA INTERFACES ---
interface Story {
    id: string;
    title: string;
    content: string;
    authorName: string;
    authorId: string;
    authorUsername?: string;
    authorPhotoURL?: string; // Author's profile picture
    thumbnailUrl: string;
    genre: string;
    createdAt: Timestamp;
}

// --- READING PROGRESS BAR COMPONENT ---
const ReadingProgressBar = () => {
    const [width, setWidth] = useState(0);
    const scrollHeight = () => {
        const el = document.documentElement;
        const scrollTop = el.scrollTop || document.body.scrollTop;
        const scrollBottom = (el.scrollHeight || document.body.scrollHeight) - el.clientHeight;
        setWidth((scrollTop / scrollBottom) * 100);
    };

    useEffect(() => {
        window.addEventListener("scroll", scrollHeight);
        return () => window.removeEventListener("scroll", scrollHeight);
    }, []);

    return <div className="fixed top-0 left-0 z-50 h-1 bg-indigo-600 transition-all duration-75" style={{ width: `${width}%` }} />;
};

export default function StoryPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    
    const { user } = useAuth();
    
    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);
    const [readingTime, setReadingTime] = useState(0);
    const [commentCount, setCommentCount] = useState(0);

    // --- Function to create a plain text summary for meta description ---
    const createDescription = (htmlContent: string) => {
        if (!htmlContent) return '';
        return htmlContent.replace(/<[^>]*>/g, '').substring(0, 155) + '...';
    };

    // --- Function to calculate reading time ---
    const calculateReadingTime = (htmlContent: string) => {
        if (!htmlContent) return 0;
        const text = htmlContent.replace(/<[^>]*>/g, '');
        const wordsPerMinute = 200;
        const noOfWords = text.split(/\s/g).length;
        const minutes = noOfWords / wordsPerMinute;
        return Math.ceil(minutes);
    };
    
    useEffect(() => {
        if (!id) return;
        const fetchStory = async () => {
            try {
                const storyRef = doc(firestore, 'stories', id);
                const storySnap = await getDoc(storyRef);
                if (storySnap.exists()) {
                    const storyData = { id: storySnap.id, ...storySnap.data() } as Story;

                    // Fetch author's profile picture
                    const authorRef = doc(firestore, 'users', storyData.authorId);
                    const authorSnap = await getDoc(authorRef);
                    if(authorSnap.exists()) {
                        storyData.authorPhotoURL = authorSnap.data().photoURL;
                    }
                    setStory(storyData);
                    setReadingTime(calculateReadingTime(storyData.content));
                } else {
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
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => setCommentCount(snapshot.size));
        return () => unsubscribe();
    }, [id, router]);

    const handleDelete = async () => {
        if (!story || !user || user.uid !== story.authorId) return;
        if (confirm("Are you sure you want to permanently delete this story?")) {
            try {
                await deleteObject(ref(storage, story.thumbnailUrl));
                await deleteDoc(doc(firestore, "stories", id));
                router.push('/');
            } catch (error) {
                console.error("Error deleting story:", error);
            }
        }
    };

    if (loading) {
        return <div className="text-center py-20">Loading Story...</div>;
    }

    if (!story) {
        return <div className="text-center py-20">Story not found.</div>;
    }

    const isAuthor = user && user.uid === story.authorId;
    const storyDescription = createDescription(story.content);
    const storyUrl = `https://yourwebsite.com/story/${id}`; // IMPORTANT: Replace with your domain

    return (
        <>
            <Head>
                <title>{story.title}</title>
                <meta name="description" content={storyDescription} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={storyUrl} />
                <meta property="og:title" content={story.title} />
                <meta property="og:description" content={storyDescription} />
                <meta property="og:image" content={story.thumbnailUrl} />
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content={storyUrl} />
                <meta property="twitter:title" content={story.title} />
                <meta property="twitter:description" content={storyDescription} />
                <meta property="twitter:image" content={story.thumbnailUrl} />
            </Head>
            
            <ReadingProgressBar />

            <div className="bg-gray-50 font-sans">
                <main className="max-w-4xl mx-auto py-8 sm:py-16 px-4">
                    {/* --- STORY HEADER --- */}
                    <header className="text-center mb-8 sm:mb-12">
                        <p className="font-semibold text-indigo-600 mb-2">{story.genre}</p>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                            {story.title}
                        </h1>
                        <div className="flex items-center justify-center mt-6 text-gray-600">
                            <Link href={`/users/${story.authorUsername}`} className="flex items-center gap-3 group">
                                <div className="relative h-12 w-12 rounded-full">
                                    <Image src={story.authorPhotoURL || '/default-avatar.png'} alt={story.authorName} fill className="rounded-full" style={{ objectFit: 'cover' }}/>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{story.authorName}</p>
                                    <p className="text-sm">{new Date(story.createdAt.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </Link>
                            <span className="mx-3 text-gray-300">•</span>
                            <div className="flex items-center gap-2">
                                <FiClock className="w-5 h-5" />
                                <span>{readingTime} min read</span>
                            </div>
                        </div>
                    </header>
                    
                    {/* --- COVER IMAGE --- */}
                    <div className="relative h-64 sm:h-96 w-full mb-8 sm:mb-12 rounded-2xl overflow-hidden shadow-2xl">
                        <Image src={story.thumbnailUrl} alt={story.title} fill style={{ objectFit: 'cover' }} priority />
                    </div>

                    {/* --- STORY CONTENT --- */}
                    <article
                        className="prose prose-lg lg:prose-xl mx-auto story-content text-gray-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: story.content }}
                    />

                    {/* --- ACTION BAR --- */}
                    <div className="flex flex-wrap justify-between items-center gap-4 border-t-2 border-gray-100 mt-12 pt-6">
                        <div className="flex items-center gap-2 sm:gap-4">
                           <LikeButton storyId={id} />
                           <SaveButton storyId={id} />
                           <ShareButton storyId={id} title={story.title} />
                           <RateStory storyId={id} />
                        </div>
                        {isAuthor && (
                            <div className="flex items-center gap-3">
                                <Link href={`/story/${id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition">
                                    <FiEdit /><span>Edit</span>
                                </Link>
                                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition">
                                    <FiTrash2 /><span>Delete</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* --- ADVANCED COMMENTS SECTION --- */}
                    <section className="mt-16 pt-10 border-t-2 border-gray-100">
                        <h2 className="text-3xl font-bold mb-8 text-gray-900">{commentCount} Comments</h2>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                           <CommentForm storyId={id} onCommentPosted={() => {}} />
                           <div className="mt-8">
                                <CommentsList storyId={id} />
                           </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
