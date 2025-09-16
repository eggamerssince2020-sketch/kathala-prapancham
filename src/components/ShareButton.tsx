// components/ShareButton.tsx
"use client";

import { useState, useEffect } from 'react';
import { FiShare2 } from 'react-icons/fi';

interface ShareButtonProps {
    storyId: string;
    title: string;
}

export default function ShareButton({ storyId, title }: ShareButtonProps) {
    const [isShared, setIsShared] = useState(false);
    const [storyUrl, setStoryUrl] = useState('');

    useEffect(() => {
        // IMPORTANT: Use the same domain as in your meta tags
        const fullUrl = `https://kathalaprapancham.in/story/${storyId}`;
        setStoryUrl(fullUrl);
    }, [storyId]);

    const handleShare = async () => {
        if (!storyUrl) return;

        if (navigator.share) {
            try {
                await navigator.share({ title, text: `Check out this story: "${title}"`, url: storyUrl });
                setIsShared(true);
                setTimeout(() => setIsShared(false), 3000);
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(storyUrl).then(() => {
                alert(`Link copied to clipboard!`);
                setIsShared(true);
                setTimeout(() => setIsShared(false), 3000);
            }).catch(err => console.error('Failed to copy link:', err));
        }
    };

    return (
        <button
            onClick={handleShare}
            className={`
                flex items-center justify-center p-2.5 rounded-full text-white shadow-lg
                transform transition-transform duration-200 hover:scale-110
                bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600
            `}
            aria-label="Share this story"
            disabled={!storyUrl}
        >
            {isShared ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <FiShare2 className="w-5 h-5" />
            )}
        </button>
    );
}
