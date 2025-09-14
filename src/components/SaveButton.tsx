"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { useAuth } from '@/context/AuthContext';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';

interface SaveButtonProps {
    storyId: string;
}

export default function SaveButton({ storyId }: SaveButtonProps) {
    const { user } = useAuth();
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !storyId) {
            setLoading(false);
            return;
        }

        const userRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const savedStories = docSnap.data().savedStories || [];
                setIsSaved(savedStories.includes(storyId));
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, storyId]);

    const handleSaveToggle = async () => {
        if (!user) {
            alert("Please log in to save stories.");
            return;
        }

        const userRef = doc(firestore, 'users', user.uid);

        try {
            if (isSaved) {
                // Unsave the story
                await updateDoc(userRef, {
                    savedStories: arrayRemove(storyId)
                });
            } else {
                // Save the story
                await updateDoc(userRef, {
                    savedStories: arrayUnion(storyId)
                });
            }
        } catch (error) {
            console.error("Error updating saved stories: ", error);
        }
    };

    if (loading || !user) {
        return null; // Don't show the button if loading or logged out
    }

    return (
        <button
            onClick={handleSaveToggle}
            className={`flex items-center gap-2 transition-colors duration-200 ${
                isSaved ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
            }`}
        >
            {isSaved ? <FaBookmark size={18} /> : <FaRegBookmark size={18} />}
        </button>
    );
}
