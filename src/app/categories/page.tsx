"use client";
import React, { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PopupForm from "./_components/popup_form"; // Same as PopupForm for Artisans
import { FiPlus } from "react-icons/fi";
import { collection, addDoc } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/js/firebase";
import { FiAlertTriangle } from "react-icons/fi"; // Error icon from react-icons

type Category = {
  id: string;
  name: string; // Represents the 'category_name' field
  image?: string; // Represents the 'category_image' field
};

export default function CategoriesPage() {
  const [showPopup, setShowPopup] = useState(false); // Controls the popup display
  const [alert, setAlert] = useState<{ type: "success" | "error"; title: string; description: string } | null>(null);

  // Using React Firebase Hooks to fetch categories from Firestore
  const [snapshot, loading, error] = useCollection(collection(db, "categories"));

  // Handle adding a new category
  const handleAddCategory = async (formData: Partial<Category>) => {
    try {
      const categoryRef = collection(db, "categories");
      const docRef = await addDoc(categoryRef, {
        category_name: formData.name, // Namespaced Firestore naming
        category_image: formData.image || "", // Optional image
        created_at: new Date(),
      });
      console.log("Category added successfully:", { id: docRef.id, ...formData });
      setAlert({
        type: "success",
        title: "Category Successfully Added",
        description: `The category "${formData.name}" has been added.`,
      });
      setShowPopup(false); // Hide popup after success
    } catch (error) {
      console.error("Error adding category:", error);
      setAlert({
        type: "error",
        title: "Failed to Add Category",
        description: "There was an error adding the category. Please try again.",
      });
    }
  };

  const closePopup = () => {
    setShowPopup(false); // Close popup
  };

  return (
    <div className="mx-auto w-full max-w-[970px]">
      {/* Breadcrumb */}
      <Breadcrumb pageName="Categories" />

      {/* Alert */}
      {alert && (
        <div className={`p-4 mb-4 rounded-lg ${alert.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          <h3 className="font-medium">{alert.title}</h3>
          <p>{alert.description}</p>
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
        {loading ? (
          <p>Loading categories...</p>
        ) : error ? (
          <p>Error loading categories...</p>
        ) : (
          snapshot?.docs.map((doc) => {
            const category = {
              id: doc.id,
              name: doc.data().category_name,
              image: doc.data().category_image,
            } as Category;

            return <CategoryTile key={category.id} category={category} />;
          })
        )}
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
          onSubmit={handleAddCategory}
          initialData={null} // No initial data for adding a new category
        />
      )}
    </div>
  );
}
const CategoryTile = ({ category }: { category: Category }) => {
    const { name, image } = category;
  
    // State to track whether the image has failed to load
    const [imageError, setImageError] = useState(false);
  
    return (
      <div
        className="group relative overflow-hidden rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-md cursor-pointer"
      >
        {/* Thumbnail Image */}
        {image && !imageError ? (
          // Try to load the image; if it fails, set `imageError` to true using onError
          <img
            src={image}
            alt={name}
            className="h-40 w-full object-cover rounded-xl"
            onError={() => setImageError(true)} // Mark image as failed
          />
        ) : (
          // Fallback UI for cases where the image is null or fails to load
          <div className="h-40 w-full bg-gray-200 flex items-center justify-center rounded-xl">
            <FiAlertTriangle size={32} className="text-red-500" />
          </div>
        )}
  
        {/* Name overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 text-white text-lg font-semibold px-2">
          <span className="truncate w-full text-center">{name}</span>
        </div>
      </div>
    );
  };
  
