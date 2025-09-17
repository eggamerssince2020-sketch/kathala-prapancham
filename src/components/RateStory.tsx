// components/RateStory.tsx
"use client";

import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { useAuth } from '@/context/AuthContext';
import { Rating } from 'react-simple-star-rating';

// No CSS import is needed.

export default function RateStory({ storyId }: { storyId: string }) {
    const { user } = useAuth();

    const handleRating = async (rate: number) => {
        if (!user) {
            alert("Please log in to rate this story.");
            return;
        }
        const ratingRef = doc(firestore, 'stories', storyId, 'ratings', user.uid);
        try {
            await setDoc(ratingRef, { value: rate });
            alert("Thank you for rating!");
        } catch (error) {
            console.error("Error submitting rating: ", error);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Rate this story</h3>
            <Rating 
                onClick={handleRating}
                // --- FIX: Add this inline style ---
                style={{ display: 'flex' }}
            />
        </div>
    );
}
