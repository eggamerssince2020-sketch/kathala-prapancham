"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../../firebase";

// Define your full user profile from Firestore
interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: 'reader' | 'author';
  photoURL?: string;
  bio?: string;
}

// Create a new, combined user type
export interface AppUser extends FirebaseUser {
  profile?: UserProfile; 
}

// Update the context's type definition
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (username: string, email: string, password:string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // This listener now correctly handles existing user sessions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const userProfile = docSnap.data() as UserProfile;
          setUser({ ...firebaseUser, profile: userProfile });
        } else {
          // This might happen if a user was created but their profile doc failed
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- THE FINAL FIX: Manually build the user object on signUp ---
  const signUp = async (username: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      await updateProfile(fbUser, { displayName: username });

      // 1. Create the profile data object first
      const userProfileData: UserProfile = {
        uid: fbUser.uid,
        username: username,
        email: email,
        role: 'reader',
      };
      
      // 2. Save it to Firestore
      const userDocRef = doc(firestore, "users", fbUser.uid);
      await setDoc(userDocRef, userProfileData);

      // 3. Immediately create and set the full AppUser in the state
      // This eliminates the race condition.
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
    // The onAuthStateChanged listener will handle fetching the profile after login
  };

  const logOut = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut }}>
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
