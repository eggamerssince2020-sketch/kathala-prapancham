"use client";

import { useState, useEffect } from 'react';
import { doc, runTransaction, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { useAuth } from '@/context/AuthContext';

interface FollowButtonProps {
    authorId: string;
}

export default function FollowButton({ authorId }: FollowButtonProps) {
    const { user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // This effect determines if the current user is already following the author
    useEffect(() => {
        if (!user || !authorId) {
            setIsLoading(false);
            return;
        }

        const currentUserRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(currentUserRef, (docSnap) => {
            if (docSnap.exists()) {
                const followingList = docSnap.data().following || [];
                setIsFollowing(followingList.includes(authorId));
            }
            setIsLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, [user, authorId]);

    const handleFollowToggle = async () => {
        if (!user) {
            alert("Please log in to follow authors.");
            return;
        }

        if (user.uid === authorId) {
            alert("You cannot follow yourself.");
            return;
        }

        const currentUserRef = doc(firestore, 'users', user.uid);
        const authorRef = doc(firestore, 'users', authorId);

        try {
            await runTransaction(firestore, async (transaction) => {
                const currentUserDoc = await transaction.get(currentUserRef);
                const authorDoc = await transaction.get(authorRef);

                if (!currentUserDoc.exists() || !authorDoc.exists()) {
                    throw "User document not found!";
                }

                if (isFollowing) {
                    // Unfollow logic
                    transaction.update(currentUserRef, { following: arrayRemove(authorId) });
                    transaction.update(authorRef, { followers: arrayRemove(user.uid) });
                } else {
                    // Follow logic
                    transaction.update(currentUserRef, { following: arrayUnion(authorId) });
                    transaction.update(authorRef, { followers: arrayUnion(user.uid) });
                }
            });
        } catch (error) {
            console.error("Follow transaction failed: ", error);
        }
    };

    // Don't render the button for the author to follow themselves or while loading
    if (isLoading || !user || user.uid === authorId) {
        return null;
    }

    return (
        <button
            onClick={handleFollowToggle}
            className={`px-4 py-2 rounded-full font-semibold transition-colors duration-200 ${
                isFollowing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
            {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
    );
}
