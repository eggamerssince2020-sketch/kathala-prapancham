"use client";

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { useAuth } from '@/context/AuthContext';

// Define the props that this component will accept
interface CommentFormProps {
  storyId: string;
  onCommentPosted: () => void; // A function to call after a comment is successfully posted
}

export default function CommentForm({ storyId, onCommentPosted }: CommentFormProps) {
    const { user } = useAuth();
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure a user is logged in and the comment isn't empty
        if (!user) {
            setError('You must be logged in to comment.');
            return;
        }
        if (!commentText.trim()) {
            setError('Comment cannot be empty.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Create a reference to the 'comments' subcollection inside the specific story document
            const commentsCollectionRef = collection(firestore, 'stories', storyId, 'comments');
            
            // Add a new document to the 'comments' subcollection
            await addDoc(commentsCollectionRef, {
                text: commentText,
                authorId: user.uid,
                authorName: user.displayName,
                createdAt: serverTimestamp(),
            });

            // Clear the textarea and call the callback function to refresh the comments list
            setCommentText('');
            onCommentPosted();

        } catch (err) {
            console.error("Error posting comment:", err);
            setError('Failed to post comment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // If the user is not logged in, don't show the form
    if (!user) {
        return <p className="text-gray-500">Please log in to leave a comment.</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="mt-8">
            <h3 className="text-xl font-semibold mb-2">Leave a Comment</h3>
            <div>
                <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Write your comment..."
                />
            </div>
            
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            
            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
        </form>
    );
}
