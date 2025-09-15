"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../../../firebase';
import { useAuth } from '@/context/AuthContext'; // Imports useAuth from your newly updated context

const genres = ["Horror", "Comedy", "Romance", "Sci-Fi", "Fantasy", "Thriller", "Mystery", "Adventure", "Drama"];

export default function CreateStoryPage() {
    // The 'user' object from useAuth will now contain the '.profile' property
    const { user, loading } = useAuth(); 
    const router = useRouter();
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [genre, setGenre] = useState('');
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setThumbnail(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. This check will now work correctly because the user object has the profile
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

            // 2. This is the final fix: We save the username from the profile
            await addDoc(collection(firestore, 'stories'), {
                title,
                content,
                genre,
                thumbnailUrl,
                authorId: user.uid,
                authorName: user.profile.username, // Using the username for consistency
                authorUsername: user.profile.username, // This finally adds the username for the link
                createdAt: serverTimestamp(),
                likes: 0,
            });

            router.push('/');

        } catch (err) {
            console.error("Error creating story:", err);
            setError("Failed to publish story. Please try again.");
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
        <div className="max-w-3xl mx-auto mt-10 p-8 bg-white shadow-md rounded-lg">
            <h1 className="text-3xl font-bold mb-8 text-center">Create a New Story</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
                    <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={10} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                </div>
                <div>
                    <label htmlFor="genre" className="block text-sm font-medium text-gray-700">Genre</label>
                    <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm">
                        <option value="" disabled>Select a genre</option>
                        {genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">Cover Image</label>
                    <input id="thumbnail" type="file" onChange={handleFileChange} required accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
                    {isSubmitting ? 'Publishing...' : 'Publish Story'}
                </button>
            </form>
        </div>
    );
}
