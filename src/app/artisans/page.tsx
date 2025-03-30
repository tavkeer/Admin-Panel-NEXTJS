"use client";

import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiPlus } from "react-icons/fi"; // Floating button icon
import PopupForm from "./_components/popup_form"; // Popup form for adding artisan
import { db } from "@/js/firebase"; // Firestore configuration
import { collection, getDocs, addDoc } from "firebase/firestore"; // Firestore methods

// Type definition for an Artisan object
type Artisan = {
  id: string;
  name: string;
  image: string;
};

export default function Page() {
  const [artisans, setArtisans] = useState<Artisan[]>([]); // List of artisans
  const [showPopup, setShowPopup] = useState(false); // Toggle popup

  // Fetch artisans from Firestore
  const fetchArtisans = async () => {
    try {
      const artisansRef = collection(db, "artisans");
      const snapshot = await getDocs(artisansRef);
      const artisansData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Artisan[];

      setArtisans(artisansData); // Update artisan list
    } catch (error) {
      console.error("Failed to fetch artisans:", error);
    }
  };

  useEffect(() => {
    fetchArtisans(); // Fetch artisans on component mount
  }, []);

  // Add a new artisan to Firestore and update the list
  const handleAddArtisan = async (formData: any) => {
    try {
      const artisanRef = collection(db, "artisans");
      const docRef = await addDoc(artisanRef, {
        ...formData,
        created_at: new Date(), // Timestamp for creation
      });

      console.log("Artisan added successfully:", { id: docRef.id, ...formData });
      alert("Artisan added successfully!");

      // Optimistically update artisan list
      setArtisans((prev) => [...prev, { id: docRef.id, name: formData.name, image: formData.image }]);

      setShowPopup(false); // Close the popup
    } catch (error) {
      console.error("Error adding artisan:", error);
      alert("Failed to add artisan. Please try again.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[970px]">
      {/* Breadcrumb */}
      <Breadcrumb pageName="Artisans" />

      {/* Artisan Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
        {artisans.map((artisan) => (
          <ArtisanTile key={artisan.id} artisan={artisan} />
        ))}
      </div>

      {/* Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => setShowPopup(true)}
        >
          <FiPlus size={24} />
        </button>
      </div>

      {/* Popup Form */}
      {showPopup && (
        <PopupForm
          onClose={() => setShowPopup(false)}
          onSubmit={handleAddArtisan}
        />
      )}
    </div>
  );
}

// Component to render individual artisan tiles
const ArtisanTile = ({ artisan }: { artisan: Artisan }) => {
  const { name, image } = artisan;

  return (
    <div className="group relative overflow-hidden rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-md">
      {/* Thumbnail Image */}
      <img
        src={image}
        alt={name}
        className="h-40 w-full object-cover rounded-xl"
      />
      {/* Name overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 text-white text-lg font-semibold px-2">
        <span className="truncate w-full text-center">{name}</span>
      </div>
    </div>
  );
};