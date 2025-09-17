"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FaUserCircle } from "react-icons/fa";

export default function Navbar() {
const { user, logout } = useAuth(); // It MUST be 'logout' (lowercase)
  
  return (
    <nav className="flex justify-between items-center p-4 bg-white border-b">
      <Link href="/"><span className="text-2xl font-bold">Kathala Prapancham</span></Link>
      <div>
        {user ? (
          <div className="flex items-center gap-6">
            <Link href="/create-story" className="font-semibold text-blue-600 hover:underline">Write a Story</Link>
            
            <Link href="/profile">
              <FaUserCircle className="w-8 h-8 text-gray-600 hover:text-blue-600" />
            </Link>
            <button 
              onClick={logout} 
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link href="/login" className="py-2 px-4">Login</Link>
            <Link href="/signup" className="bg-blue-500 text-white py-2 px-4 rounded">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
