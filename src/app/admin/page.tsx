// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { firestore } from 'firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// Defines the structure of a story object for the panel
interface Story {
  id: string;
  title: string;
  authorName: string;
  status?: 'pending' | 'approved'; // It's good practice to have a status field
}

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- ADMIN EMAIL CHECK ---
  // Define the single admin email address
  const adminEmail = "kathalaprapancham2002@gmail.com";

  useEffect(() => {
    // Wait until authentication status is known
    if (authLoading) return;

    // Deny access if user is not logged in or is not the admin
    if (!user || user.email !== adminEmail) {
      setError("Access Denied. You do not have permission to view this page.");
      setLoading(false);
      return;
    }

    // Fetch stories if the user is the admin
    const fetchStories = async () => {
      try {
        const storiesCollection = collection(firestore, 'stories');
        // Order stories by creation date to see the newest ones first
        const q = query(storiesCollection, orderBy('createdAt', 'desc')); 
        const storiesSnapshot = await getDocs(q);
        
        const storiesList = storiesSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          authorName: doc.data().authorName,
          status: doc.data().status || 'pending', // Default to 'pending' if status is not set
        }));
        
        setStories(storiesList);
      } catch (err) {
        console.error("Error fetching stories:", err);
        setError("Failed to fetch stories. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [user, authLoading, adminEmail]);

  // Function to approve a story
  const handleApprove = async (id: string) => {
    try {
      const storyRef = doc(firestore, 'stories', id);
      await updateDoc(storyRef, { status: 'approved' });
      // Immediately update the UI to reflect the change
      setStories(stories.map(story => story.id === id ? { ...story, status: 'approved' } : story));
    } catch (err) {
      console.error("Error approving story:", err);
      alert("Failed to approve the story.");
    }
  };

  // Function to delete a story
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this story permanently? This action cannot be undone.")) return;

    try {
      const storyRef = doc(firestore, 'stories', id);
      await deleteDoc(storyRef);
      // Immediately remove the story from the UI
      setStories(stories.filter(story => story.id !== id));
    } catch (err) {
      console.error("Error deleting story:", err);
      alert("Failed to delete the story.");
    }
  };

  // Loading state
  if (loading || authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading Admin Panel...</div>;
  }

  // Error state (Access Denied or Fetch Failed)
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="mt-2 text-gray-700">{error}</p>
        <Link href="/" className="mt-6 inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
          Go to Homepage
        </Link>
      </div>
    );
  }

  // Main Admin Panel UI
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stories.map((story) => (
                  <tr key={story.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{story.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{story.authorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        story.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {story.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-4">
                      {story.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(story.id)}
                          className="text-indigo-600 hover:text-indigo-900 font-semibold"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(story.id)}
                        className="text-red-600 hover:text-red-900 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
