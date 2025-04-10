"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../js/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Check if user's email exists in admins collection
  const checkIfAdmin = async (email: string) => {
    try {
      const adminsRef = collection(db, "admins");
      const q = query(adminsRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        // User is signed in
        const adminStatus = await checkIfAdmin(currentUser.email || "");

        if (adminStatus) {
          setUser(currentUser);
          setIsAdmin(true);

          // Redirect away from login page if the user is already logged in
          if (window.location.pathname === "/login") {
            router.push("/"); // Redirect to home route
          }
        } else {
          // If not an admin, log them out
          await signOut(auth);
          setUser(null);
          setIsAdmin(false);
          router.push("/login");
        }
      } else {
        // User is signed out
        setUser(null);
        setIsAdmin(false);

        // Check if we're not already on the login page to avoid redirect loops
        if (window.location.pathname !== "/login") {
          router.push("/login");
        }
      }

      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [router]);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Check if user is in admins collection
      if (result.user.email) {
        const adminStatus = await checkIfAdmin(result.user.email);

        if (adminStatus) {
          setIsAdmin(true);
          router.push("/");
        } else {
          // If not an admin, log them out and show error
          await signOut(auth);
          alert("You are not authorized to access this admin panel.");
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
