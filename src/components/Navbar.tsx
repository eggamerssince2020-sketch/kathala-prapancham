// src/components/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FaUserCircle } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri"; // Admin Icon
import { HiMenu, HiX } from "react-icons/hi"; // Hamburger and Close Icons

export default function Navbar() {
  const { user, logout, loading: authLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const adminEmail = "kathalaprapancham2002@gmail.com";
  const isAdmin = !authLoading && user?.email === adminEmail;

  // Reusable component for the user/admin links to avoid repetition
  const UserLinks = () => (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {!isAdmin && (
        <Link href="/create-story" className="font-semibold text-blue-600 hover:underline">
          Write a Story
        </Link>
      )}
      {isAdmin && (
        <Link href="/admin" title="Admin Dashboard">
          <div className="flex items-center gap-2">
            <RiAdminFill className="w-8 h-8 text-indigo-600 hover:text-indigo-800" />
            <span className="md:hidden">Admin</span>
          </div>
        </Link>
      )}
      <Link href="/profile" title="Profile">
        <div className="flex items-center gap-2">
            <FaUserCircle className="w-8 h-8 text-gray-600 hover:text-blue-600" />
            <span className="md:hidden">Profile</span>
        </div>
      </Link>
      <button
        onClick={() => {
          logout();
          setIsMenuOpen(false);
        }}
        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );

  const AuthLinks = () => (
     <div className="flex flex-col md:flex-row items-center gap-4">
        <Link href="/login" className="py-2 px-4">Login</Link>
        <Link href="/signup" className="bg-blue-500 text-white py-2 px-4 rounded">Sign Up</Link>
      </div>
  );

  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow-md border-b sticky top-0 z-50">
      <Link href="/">
        <span className="text-2xl font-bold">Kathala Prapancham</span>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6">
        {authLoading ? (
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-md"></div>
        ) : user ? (
          <UserLinks />
        ) : (
          <AuthLinks />
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? (
            <HiX className="w-8 h-8" />
          ) : (
            <HiMenu className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg md:hidden p-4">
          {authLoading ? (
            <div className="h-8 w-full bg-gray-200 animate-pulse rounded-md"></div>
          ) : user ? (
            <UserLinks />
          ) : (
            <AuthLinks />
          )}
        </div>
      )}
    </nav>
  );
}
