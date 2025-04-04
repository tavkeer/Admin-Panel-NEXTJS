"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { collection, doc, updateDoc } from "firebase/firestore";
import { db } from "@/js/firebase";
import { FiAlertTriangle } from "react-icons/fi"; // Error icon from react-icons

type Genre = {
  id: string;
  name: string; // Represents the 'name' field
  image?: string; // Represents the 'image' field
  product_ids: string[]; // Array of product IDs
};

type Product = {
  id: string;
  name: string; // Represents the 'name' field
  image?: string; // Represents the 'image' field
};

export default function GenresPage() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null); // Tracks selected genre
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]); // Tracks selected products (checked)
  const [showPopup, setShowPopup] = useState(false); // Controls popup display

  // Fetch genres collection
  const [genresSnapshot, genresLoading, genresError] = useCollection(collection(db, "genres"));
  // Fetch products collection
  const [productsSnapshot, productsLoading, productsError] = useCollection(collection(db, "products"));

  const handleGenreClick = (genre: Genre) => {
    // On genre click, open popup and load existing product IDs
    setSelectedGenre(genre);
    setSelectedProducts(genre.product_ids);
    setShowPopup(true);
  };

  const handleProductToggle = (productId: string) => {
    // Handle adding/removing products from the selection
    if (selectedProducts.includes(productId)) {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId)); // Remove product
    } else {
      setSelectedProducts((prev) => [...prev, productId]); // Add product
    }
  };

  const handleSubmit = async () => {
    // Save updated product IDs to Firestore
    if (!selectedGenre) return;
    try {
      const genreRef = doc(db, "genres", selectedGenre.id);
      await updateDoc(genreRef, {
        product_ids: selectedProducts, // Update product_ids field
      });
      setShowPopup(false); // Close popup
      setSelectedGenre(null); // Clear selected genre
      console.log("Genre updated successfully!");
    } catch (error) {
      console.error("Error updating genre:", error);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedGenre(null);
  };

  return (
    <div className="mx-auto w-full max-w-[970px]">
      {/* Breadcrumb */}
      <Breadcrumb pageName="Genres" />

      {/* Genre Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
        {genresLoading ? (
          <p>Loading genres...</p>
        ) : genresError ? (
          <p>Error loading genres...</p>
        ) : (
          genresSnapshot?.docs.map((doc) => {
            const genre = {
              id: doc.id,
              name: doc.data().name,
              image: doc.data().image,
              product_ids: doc.data().product_ids || [],
            } as Genre;

            return <GenreTile key={genre.id} genre={genre} onClick={() => handleGenreClick(genre)} />;
          })
        )}
      </div>

      {/* Popup Form */}
      {showPopup && selectedGenre && (
        <GenrePopup
          genre={selectedGenre}
          products={(productsSnapshot?.docs || []).map((prodDoc) => ({
            id: prodDoc.id,
            name: prodDoc.data().name,
            image: prodDoc.data().image,
          }))}
          selectedProducts={selectedProducts}
          onProductToggle={handleProductToggle}
          onSubmit={handleSubmit}
          onClose={closePopup}
        />
      )}
    </div>
  );
}

const GenreTile = ({ genre, onClick }: { genre: Genre; onClick: () => void }) => {
  const { name, image } = genre;

  return (
    <div
      className="group relative overflow-hidden rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-md cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail Image */}
      {image ? (
        <img src={image} alt={name} className="h-40 w-full object-cover rounded-xl" />
      ) : (
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

const GenrePopup = ({
  genre,
  products,
  selectedProducts,
  onProductToggle,
  onSubmit,
  onClose,
}: {
  genre: Genre;
  products: Product[];
  selectedProducts: string[];
  onProductToggle: (productId: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl w-[400px] max-w-full p-4">
        <h2 className="text-lg font-medium mb-4">Edit Genre: {genre.name}</h2>
        <div className="space-y-3 mb-6">
          {products.map((product) => (
            <div key={product.id} className="flex items-center">
              <input
                type="checkbox"
                id={product.id}
                checked={selectedProducts.includes(product.id)}
                onChange={() => onProductToggle(product.id)}
              />
              <label htmlFor={product.id} className="ml-2 text-sm">
                {product.name}
              </label>
            </div>
          ))}
        </div>
        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button type="button" className="py-2 px-4 bg-gray-200 rounded-md" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="py-2 px-4 bg-blue-400 text-white rounded-md" onClick={onSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
