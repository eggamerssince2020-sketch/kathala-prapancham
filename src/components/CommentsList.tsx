"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore } from '../../firebase';

// Define the props this component will accept
interface CommentsListProps {
  storyId: string;
}

// Define the structure of a single comment
interface Comment {
    id: string;
    text: string;
    authorName: string;
    createdAt: Timestamp;
}

export default function CommentsList({ storyId }: CommentsListProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storyId) return;

        // Create a reference to the 'comments' subcollection
        const commentsCollectionRef = collection(firestore, 'stories', storyId, 'comments');
        const q = query(commentsCollectionRef, orderBy('createdAt', 'asc')); // Order by oldest first

        // Set up the real-time listener
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const commentsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Comment));
            setComments(commentsList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching comments in real-time:", error);
            setLoading(false);
        });

        // Cleanup: Unsubscribe from the listener when the component unmounts
        return () => unsubscribe();

    }, [storyId]); // Rerun this effect if the storyId changes

    if (loading) {
        return <p className="text-gray-500">Loading comments...</p>;
    }

    return (
        <div className="space-y-4 mt-6">
            {comments.length > 0 ? (
                comments.map(comment => (
                    <div key={comment.id} className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                            <p className="font-semibold mr-2">{comment.authorName || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">
                                {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleString() : ''}
                            </p>
                        </div>
                        <p className="text-gray-800">{comment.text}</p>
                    </div>
                ))
            ) : (
                <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
            )}
        </div>
    );
}
