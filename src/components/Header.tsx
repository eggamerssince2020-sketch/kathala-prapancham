"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';

export default function Header() {
  const { user, logOut } = useAuth(); // Correctly using logOut

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
              // --- LOGGED-IN VIEW ---
              <>
                <Link href="/create-story" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Create Story
                </Link>
                <Link href="/saved-stories" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Saved Stories
                </Link>

                {/* Improved User Dropdown Menu */}
                <Menu as="div" className="relative">
                  <div>
                    <Menu.Button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-lg">
                        {user.displayName?.charAt(0).toUpperCase()}
                      </div>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-3">
                        <p className="text-sm">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
                      </div>
                      <div className="border-t border-gray-100"></div>
                      <Menu.Item>
                        {({ active }) => (
                          <Link href="/profile" className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}>
                            My Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <div className="border-t border-gray-100"></div>
                      <Menu.Item>
                        {({ active }) => (
                          <button onClick={logOut} className={`${active ? 'bg-gray-100' : ''} w-full text-left block px-4 py-2 text-sm text-gray-700`}>
                            Log Out
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            ) : (
              // --- LOGGED-OUT VIEW ---
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
