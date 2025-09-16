'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firestore } from '../../../../../firebase';
import Image from 'next/image';

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!storyId) return;
    const fetchStory = async () => {
      try {
        const storyRef = doc(firestore, 'stories', storyId);
        const storySnap = await getDoc(storyRef);
        if (storySnap.exists()) {
          const storyData = storySnap.data();
          const auth = getAuth();
          if (auth.currentUser?.uid !== storyData.authorId) {
            setError("You don't have permission to edit this story.");
            return;
          }
          setTitle(storyData.title);
          setContent(storyData.content);
          setThumbnailUrl(storyData.thumbnailUrl || '');
        } else {
          setError("Story not found.");
        }
      } catch (err) {
        console.error("Failed to load story data:", err);
        setError("Failed to load story data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [storyId]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const storage = getStorage();
    // --- THIS IS THE CORRECTED PATH ---
    const storageRef = ref(storage, `story-thumbnails/${storyId}/${Date.now()}-${file.name}`);

    try {
      if (thumbnailUrl) {
        try {
          const oldImageRef = ref(storage, thumbnailUrl);
          await deleteObject(oldImageRef);
        } catch (err: any) {
          if (err.code !== 'storage/object-not-found') {
            console.error("Could not delete old thumbnail:", err);
          }
        }
      }

      await uploadBytes(storageRef, file);
      const newUrl = await getDownloadURL(storageRef);

      const storyRef = doc(firestore, 'stories', storyId);
      await updateDoc(storyRef, { thumbnailUrl: newUrl });
      setThumbnailUrl(newUrl);

    } catch (err) {
      console.error("Upload failed:", err);
      alert('Failed to upload image. Please check your network and security rules.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteThumbnail = async () => {
    if (!thumbnailUrl) return;
    if (window.confirm('Are you sure you want to delete the thumbnail?')) {
      const storage = getStorage();
      const imageRef = ref(storage, thumbnailUrl);
      try {
        await deleteObject(imageRef);
        const storyRef = doc(firestore, 'stories', storyId);
        await updateDoc(storyRef, { thumbnailUrl: '' });
        setThumbnailUrl('');
      } catch (err) {
        console.error("Delete failed:", err);
        alert('Failed to delete thumbnail. It may have already been removed.');
      }
    }
  };

  const handleUpdateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    const storyRef = doc(firestore, 'stories', storyId);
    try {
      await updateDoc(storyRef, { title, content });
      router.push(`/story/${storyId}`);
    } catch (err) {
      alert("Failed to update story details.");
    }
  };
  
  const handleDeleteStory = async () => {
    if (window.confirm('Are you sure you want to permanently delete this story?')) {
      const storyRef = doc(firestore, 'stories', storyId);
      try {
        await deleteDoc(storyRef);
        if (thumbnailUrl) {
          const storage = getStorage();
          const imageRef = ref(storage, thumbnailUrl);
          await deleteObject(imageRef);
        }
        router.push('/profile');
      } catch (err) {
        alert("Failed to delete the story. Please try again.");
      }
    }
  };

  if (loading) return <p className="text-center mt-12">Loading editor...</p>;
  if (error) return <p className="text-center text-red-500 mt-12">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Edit Story</h1>

      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
        <div className="flex items-center gap-6">
          {thumbnailUrl ? (
            <div className="relative group w-32 h-32 rounded-md overflow-hidden">
              <Image src={thumbnailUrl} alt="Current thumbnail" layout="fill" objectFit="cover" />
              <div 
                onClick={handleDeleteThumbnail} 
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                Delete
              </div>
            </div>
          ) : (
            <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-md text-sm text-gray-500">
              No Image
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Change Image'}
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
      </div>

      <form onSubmit={handleUpdateStory} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3"
            required
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3"
            required
          />
        </div>
        <div className="flex justify-between items-center pt-4">
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">
            Save Story Changes
          </button>
          <button
            type="button"
            onClick={handleDeleteStory}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Delete Entire Story
          </button>
        </div>
      </form>
    </div>
  );
}
