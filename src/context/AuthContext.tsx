// src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../../firebase";

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: 'reader' | 'author';
  photoURL?: string;
  bio?: string;
}

export interface AppUser extends FirebaseUser {
  profile?: UserProfile;
}

// --- 1. THE BULLETPROOF FIX: ADD BOTH FUNCTION NAMES ---
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logOut: () => Promise<void>; // Add the old name back to satisfy the cache
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const userProfile = docSnap.data() as UserProfile;
          setUser({ ...firebaseUser, profile: userProfile });
        } else {
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (username: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      await updateProfile(fbUser, { displayName: username });

      const userProfileData: UserProfile = {
        uid: fbUser.uid,
        username: username,
        email: email,
        role: 'reader',
      };
      
      const userDocRef = doc(firestore, "users", fbUser.uid);
      await setDoc(userDocRef, userProfileData);

      setUser({ ...fbUser, profile: userProfileData });
    } catch (error) {
      console.error("Error during sign up:", error);
      throw error;
    }
  };

  const logIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    // --- 2. PROVIDE THE SAME FUNCTION UNDER BOTH NAMES ---
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signUp, 
      logIn, 
      logout: logout, // The new, correct name
      logOut: logout, // The old name, pointing to the same function
      sendPasswordReset 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
};
