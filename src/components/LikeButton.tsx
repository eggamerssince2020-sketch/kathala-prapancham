"use client";

import { useState, useEffect } from 'react';
import { doc, runTransaction, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { useAuth } from '@/context/AuthContext';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

interface LikeButtonProps {
    storyId: string;
}

export default function LikeButton({ storyId }: LikeButtonProps) {
    const { user } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    // This effect sets up real-time listeners
    useEffect(() => {
        if (!storyId) return;

        // Listener for the story's like count
        const storyRef = doc(firestore, 'stories', storyId);
        const unsubscribeStory = onSnapshot(storyRef, (docSnap) => {
            if (docSnap.exists()) {
                setLikesCount(docSnap.data().likes || 0);
            }
        });

        let unsubscribeUser: () => void = () => {};
        // Listener for the user's liked status on this story
        if (user) {
            const userRef = doc(firestore, 'users', user.uid);
            unsubscribeUser = onSnapshot(userRef, (userSnap) => {
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const likedStories = userData.likedStories || [];
                    setLiked(likedStories.includes(storyId));
                }
            });
        } else {
            setLiked(false); // If no user, they can't have liked it
        }

        // Cleanup function to unsubscribe from listeners when the component unmounts
        return () => {
            unsubscribeStory();
            unsubscribeUser();
        };
    }, [user, storyId]);

    // The function to handle the like/unlike action
    const toggleLike = async () => {
        if (!user) {
            alert("You must be logged in to like a story.");
            return;
        }

        const storyRef = doc(firestore, 'stories', storyId);
        const userRef = doc(firestore, 'users', user.uid);

        try {
            await runTransaction(firestore, async (transaction) => {
                const storyDoc = await transaction.get(storyRef);
                const userDoc = await transaction.get(userRef);

                if (!storyDoc.exists() || !userDoc.exists()) {
                    throw "Document does not exist!";
                }

                const currentLikes = storyDoc.data().likes || 0;
                const likedStories = userDoc.data().likedStories || [];

                if (liked) { // If the user has already liked it, we are unliking it
                    transaction.update(storyRef, { likes: currentLikes - 1 });
                    transaction.update(userRef, { 
                        likedStories: likedStories.filter((id: string) => id !== storyId) 
                    });
                } else { // If the user has not liked it, we are liking it
                    transaction.update(storyRef, { likes: currentLikes + 1 });
                    transaction.update(userRef, { 
                        likedStories: [...likedStories, storyId] 
                    });
                }
            });
        } catch (error) {
            console.error("Like transaction failed: ", error);
        }
    };

    return (
        <button
            onClick={toggleLike}
            className={`flex items-center gap-2 transition-colors duration-200 ${
                liked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
            }`}
        >
            {liked ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
            <span className="font-medium">{likesCount}</span>
        </button>
    );
}
