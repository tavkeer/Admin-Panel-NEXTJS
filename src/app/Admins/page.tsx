"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, where, updateDoc,doc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { db } from "@/js/firebase"; 
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CalendarBox from "@/components/CalenderBox";

const CalendarPage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
  
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
  
      const user = result.user;
      const email = user.email;
  

      const adminsRef = collection(db, "admins");
      const q = query(adminsRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {

        const docRef = await addDoc(adminsRef, {
          name: user.displayName,
          email,
          created_at: new Date(),
        });
  
        console.log(`Admin added successfully with Firestore ID: ${docRef.id}`);
  

        const adminDocRef = doc(db, "admins", docRef.id);
        await updateDoc(adminDocRef, {
          id: docRef.id,
        });
  
        console.log(`Document ID updated: ${docRef.id}`);
      } else {
        console.log("Admin already exists with the provided email.");
      }
  
      setIsAdmin(true);
      setLoading(false);
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };
  

  useEffect(() => {
    if (isAdmin) {
      window.location.reload();
    }
  }, [isAdmin]);

  return (
    <>
      <Breadcrumb pageName="Admins" />
      <CalendarBox />

      {/* Floating action button for Google Sign-In */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex items-center justify-center p-4 bg-white text-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {loading ? (
            <div className="h-6 w-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Add new Admin
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </>
  );
};

export default CalendarPage;
