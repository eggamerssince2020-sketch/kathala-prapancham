"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../../../firebase';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css'; // Import Quill's styles from the new package
import { WavyBackground } from '@/components/WavyBackground';

// Dynamically import ReactQuill to prevent SSR issues
// To this:
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const genres = ["Horror", "Comedy", "Romance", "Sci-Fi", "Fantasy", "Thriller", "Mystery", "Adventure", "Drama"];

export default function CreateStoryPage() {
    const { user, loading } = useAuth(); 
    const router = useRouter();
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [genre, setGenre] = useState('');
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setThumbnail(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !user.profile) {
            setError("You must be logged in to create a story.");
            return;
        }
        if (!title || !content || !genre || !thumbnail) {
            setError("Please fill out all fields and select a cover image.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const filePath = `thumbnails/${user.uid}/${Date.now()}_${thumbnail.name}`;
            const storageRef = ref(storage, filePath);
            const uploadResult = await uploadBytes(storageRef, thumbnail);
            const thumbnailUrl = await getDownloadURL(uploadResult.ref);

            await addDoc(collection(firestore, 'stories'), {
                title,
                content,
                genre,
                thumbnailUrl,
                authorId: user.uid,
                authorName: user.profile.username,
                createdAt: serverTimestamp(),
                likes: 0,
            });

            router.push('/');
        } catch (err) {
            console.error("Error creating story:", err);
            setError("Failed to publish story. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return <p className="text-center p-8">Loading...</p>;
    }
    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <WavyBackground
            backgroundFill="#fefae0"
            colors={["#fa9451", "#ffc071", "#ff6b6b", "#e07a5f"]}
            waveOpacity={0.4}
            blur={15}
        >
            <div className="min-h-screen py-12 px-4">
                <div className="max-w-4xl mx-auto p-8 bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl">
                    <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
                        Share Your Story
                    </h1>
                    
                    {error && <p className="mb-4 text-center bg-red-500/20 text-red-800 p-3 rounded-md">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label htmlFor="title" className="block mb-2 font-semibold text-gray-700">Title</label>
                            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-3 bg-white/60 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"/>
                        </div>
                        
                        <div>
                            <label className="block mb-2 font-semibold text-gray-700">Content</label>
                            <div className="bg-white/60 rounded-lg">
                                <ReactQuill
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    modules={{ toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }]] }}
                                    className="min-h-[250px]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label htmlFor="genre" className="block mb-2 font-semibold text-gray-700">Genre</label>
                                <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} required className="w-full p-3 bg-white/60 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition">
                                    <option value="" disabled>Select a genre...</option>
                                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="thumbnail" className="block mb-2 font-semibold text-gray-700">Cover Image</label>
                                <input id="thumbnail" type="file" onChange={handleFileChange} required accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200"/>
                                {thumbnailPreview && (
                                    <div className="mt-4">
                                        <img src={thumbnailPreview} alt="Thumbnail Preview" className="max-h-40 rounded-lg object-cover shadow-md"/>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold p-4 rounded-lg shadow-lg hover:scale-105 transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Publishing...' : 'Publish Story'}
                        </button>
                    </form>
                </div>
            </div>
        </WavyBackground>
    );
}
