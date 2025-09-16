"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { HiMenu, HiPencilAlt, HiBookmark, HiUser, HiOutlineLogout } from 'react-icons/hi';

export default function Header() {
  const { user, logOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/30 backdrop-blur-lg shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="Kathala Prapancham Logo"
                width={40}
                height={40}
                priority
              />
              <span className="text-2xl font-bold text-gray-800 hover:text-gray-900 transition-colors hidden sm:block">
                Kathala Prapancham
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center justify-center p-2 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800">
                  <span className="sr-only">Open menu</span>
                  <HiMenu className="h-6 w-6 text-gray-800" />
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  {/* --- THIS IS THE UPDATED LINE --- */}
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-white/95 backdrop-blur-3xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-black/10 border-b border-gray-900/10">
                      <img
                        className="h-11 w-11 rounded-full border-2 border-blue-400 object-cover"
                        src={user.photoURL || '/default-profile-icon.png'}
                        alt="Profile picture"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {user.profile?.username || user.displayName}
                        </p>
                        <p className="text-xs text-gray-600">
                          Personal Menu
                        </p>
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link href="/create-story" className={`${active ? 'bg-green-500/20' : ''} flex w-full items-center px-4 py-2.5 text-sm font-medium text-green-700`}>
                            <HiPencilAlt className="mr-3 h-5 w-5" />
                            Create Story
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link href="/saved" className={`${active ? 'bg-purple-500/20' : ''} flex w-full items-center px-4 py-2.5 text-sm font-medium text-purple-700`}>
                            <HiBookmark className="mr-3 h-5 w-5" />
                            Saved Stories
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a 
                            href={`/users/${user.profile?.username}`} 
                            className={`${active ? 'bg-blue-500/20' : ''} flex w-full items-center px-4 py-2.5 text-sm font-medium text-blue-700`}
                          >
                            <HiUser className="mr-3 h-5 w-5" />
                            My Profile
                          </a>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="py-1 border-t border-gray-900/10">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logOut}
                            className={`${active ? 'bg-red-500/20' : ''} flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-600`}
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
              <>
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
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
