"use client";
import { collection, getDocs, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import React, { useState, useEffect } from "react";
import PopupForm from "./_components/popup_form";
import { FiPlus } from "react-icons/fi";
import { db } from "@/js/firebase";

type Artisan = {
  id: string;
  name: string;
  image: string;
  address?: string;
  phone?: string;
  story?: string;
};

export default function Page() {
  const [showPopup, setShowPopup] = useState(false);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; title: string; description: string } | null>(null);

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

  const fetchArtisanDetails = async (artisanId: string) => {
    try {
      const artisanRef = doc(db, "artisans", artisanId);
      const artisanSnap = await getDoc(artisanRef);
      
      if (artisanSnap.exists()) {
        return { id: artisanSnap.id, ...artisanSnap.data() } as Artisan;
      } else {
        console.error("No such artisan!");
        return null;
      }
    } catch (error) {
      console.error("Error getting artisan:", error);
      return null;
    }
  };

  const handleArtisanClick = async (artisan: Artisan) => {
    // Fetch complete artisan details including address, phone, story, etc.
    const fullArtisanData = await fetchArtisanDetails(artisan.id);
    if (fullArtisanData) {
      setSelectedArtisan(fullArtisanData);
      setShowPopup(true);
    }
  };

  const handleAddArtisan = async (formData: any) => {
    try {
      const artisanRef = collection(db, "artisans");
      const docRef = await addDoc(artisanRef, {
        ...formData,
        created_at: new Date(),
      });
      console.log("Artisan added successfully:", { id: docRef.id, ...formData });
      setAlert({
        type: "success",
        title: "Artisan Successfully Added",
        description: `The artisan "${formData.name}" has been added.`,
      });
      setArtisans((prev) => [...prev, { id: docRef.id, name: formData.name, image: formData.image }]);
      setShowPopup(false);
    } catch (error) {
      console.error("Error adding artisan:", error);
      setAlert({
        type: "error",
        title: "Failed to Add Artisan",
        description: `There was an error adding the artisan. Please try again.`,
      });
    }
  };

  const handleUpdateArtisan = async (formData: any) => {
    if (!selectedArtisan) return;
    
    try {
      const artisanRef = doc(db, "artisans", selectedArtisan.id);
      await updateDoc(artisanRef, {
        ...formData,
        updated_at: new Date(),
      });
      
      console.log("Artisan updated successfully:", { id: selectedArtisan.id, ...formData });
      
      setAlert({
        type: "success",
        title: "Artisan Successfully Updated",
        description: `The artisan "${formData.name}" has been updated.`,
      });
      
      // Update artisan in local state
      setArtisans((prev) => 
        prev.map((artisan) => 
          artisan.id === selectedArtisan.id 
            ? { ...artisan, name: formData.name, image: formData.image } 
            : artisan
        )
      );
      
      setShowPopup(false);
      setSelectedArtisan(null);
    } catch (error) {
      console.error("Error updating artisan:", error);
      setAlert({
        type: "error",
        title: "Failed to Update Artisan",
        description: `There was an error updating the artisan. Please try again.`,
      });
    }
  };

  const handleSubmit = (formData: any) => {
    if (selectedArtisan) {
      handleUpdateArtisan(formData);
    } else {
      handleAddArtisan(formData);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedArtisan(null);
  };

  return (
    <div className="mx-auto w-full max-w-[970px]">
      {/* Breadcrumb */}
      <Breadcrumb pageName="Artisans" />

      {/* Alert */}
      {alert && (
        <div className={`p-4 mb-4 rounded-lg ${alert.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          <h3 className="font-medium">{alert.title}</h3>
          <p>{alert.description}</p>
        </div>
      )}

      {/* Artisan Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
        {artisans.map((artisan) => (
          <ArtisanTile 
            key={artisan.id} 
            artisan={artisan} 
            onClick={() => handleArtisanClick(artisan)}
          />
        ))}
      </div>

      {/* Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          className="flex items-center justify-center p-4 bg-blue-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => setShowPopup(true)}
        >
          <FiPlus size={24} />
        </button>
      </div>

   {/* Popup Form */}
{showPopup && (
  <PopupForm
    onClose={closePopup}
    onSubmit={handleSubmit}
    initialData={selectedArtisan ? {
      name: selectedArtisan.name || "",
      image: selectedArtisan.image || "",
      address: selectedArtisan.address || "",
      phone: selectedArtisan.phone || "",
      story: selectedArtisan.story || ""
    } : null}
  />
)}
    </div>
  );
}

const ArtisanTile = ({ artisan, onClick }: { artisan: Artisan; onClick: () => void }) => {
  const { name, image } = artisan;
  return (
    <div 
      className="group relative overflow-hidden rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-md cursor-pointer"
      onClick={onClick}
    >
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