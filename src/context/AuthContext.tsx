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
import { auth, firestore } from "@../../firebase"; // Using the correct path alias

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: 'reader' | 'author' | 'admin'; // Added 'admin' to the possible roles
  photoURL?: string;
  bio?: string;
}

export interface AppUser extends FirebaseUser {
  profile?: UserProfile; 
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (username: string, email: string, password:string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // --- THE FIXED useEffect HOOK ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch the custom user profile from Firestore
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const userProfile = docSnap.data() as UserProfile;
          // Combine Firebase user data with custom profile data
          setUser({ ...firebaseUser, profile: userProfile });
        } else {
          // If no profile exists in Firestore, set the basic Firebase user
          setUser(firebaseUser);
        }
      } else {
        // If user is logged out, clear the user state
        setUser(null);
      }
      // CRITICAL FIX: Set loading to false only AFTER all async operations are complete
      setLoading(false);
    });

    // Cleanup subscription on unmount
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
        role: 'reader', // Default role for new sign-ups
      };
      
      const userDocRef = doc(firestore, "users", fbUser.uid);
      await setDoc(userDocRef, userProfileData);

      // Set the user state with the newly created profile
      setUser({
        ...fbUser,
        profile: userProfileData,
      });

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
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logout, sendPasswordReset }}>
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
