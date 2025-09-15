"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { HiMenu, HiPencilAlt, HiBookmark, HiUser, HiOutlineLogout } from 'react-icons/hi';

export default function Header() {
  const { user, logOut } = useAuth();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Site Title/Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-gray-900 transition-colors">
              Kathala Prapancham
            </Link>
          </div>

          {/* Right-aligned items */}
          <div className="flex items-center space-x-4">
            {user ? (
              // --- LOGGED-IN VIEW WITH FINAL MENU DESIGN ---
              <Menu as="div" className="relative">
                {/* Hamburger Menu Button */}
                <Menu.Button className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800">
                  <span className="sr-only">Open menu</span>
                  <HiMenu className="h-6 w-6 text-gray-800" />
                </Menu.Button>

                {/* Dropdown Panel */}
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                    {/* --- UPDATED PROFILE SECTION --- */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <img
                        className="h-11 w-11 rounded-full border-2 border-blue-500 object-cover"
                        src={user.photoURL || '/default-profile-icon.png'} // Fallback image
                        alt="Profile picture"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {user.profile?.username || user.displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Personal Menu
                        </p>
                      </div>
                    </div>
                    
                    {/* --- MENU ACTIONS --- */}
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link href="/create-story" className={`${active ? 'bg-green-50' : ''} flex w-full items-center px-4 py-2.5 text-sm font-medium text-green-700`}>
                            <HiPencilAlt className="mr-3 h-5 w-5" />
                            Create Story
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link href="/saved" className={`${active ? 'bg-purple-50' : ''} flex w-full items-center px-4 py-2.5 text-sm font-medium text-purple-700`}>
                            <HiBookmark className="mr-3 h-5 w-5" />
                            Saved Stories
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link href={`/users/${user.profile?.username}`} className={`${active ? 'bg-blue-50' : ''} flex w-full items-center px-4 py-2.5 text-sm font-medium text-blue-700`}>
                            <HiUser className="mr-3 h-5 w-5" />
                            My Profile
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="py-1 border-t border-gray-100">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logOut}
                            className={`${active ? 'bg-red-50' : ''} flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-600`}
                          >
                            <HiOutlineLogout className="mr-3 h-5 w-5" />
                            Log Out
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              // --- LOGGED-OUT VIEW (Unchanged) ---
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Log In
                </Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
