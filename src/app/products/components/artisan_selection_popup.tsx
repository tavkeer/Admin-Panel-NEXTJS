"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, startAfter, limit } from "firebase/firestore";
import { db } from "@/js/firebase";

type Artisan = {
  id: string;
  name: string;
};

type ArtisanSelectionDialogProps = {
  onClose: () => void;
  onSelect: (artisan: Artisan) => void;
};

const ArtisanSelectionDialog: React.FC<ArtisanSelectionDialogProps> = ({ onClose, onSelect }) => {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(false);

  const [lastVisible, setLastVisible] = useState<any>(null); // Last visible document for pagination
  const [hasMore, setHasMore] = useState(true); // Check if there are more artisans

  const ITEMS_PER_PAGE = 5; // Number of artisans per page

  /** Fetch Initial Artisans **/
  const fetchArtisans = async (reset = false) => {
    setLoading(true);

    try {
      const artisansRef = collection(db, "artisans");
      let q;

      if (reset || !lastVisible) {
        // Initial query or reset (first page)
        q = query(artisansRef, orderBy("name", "asc"), limit(ITEMS_PER_PAGE));
      } else {
        // Paginated query
        q = query(
          artisansRef,
          orderBy("name", "asc"),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setHasMore(false); // No more artisans available
      } else {
        const newArtisans = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Artisan[];

        setArtisans(reset ? newArtisans : [...artisans, ...newArtisans]); // Append to current list
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]); // Update last visible document
      }
    } catch (error) {
      console.error("Error fetching artisans:", error);
    }

    setLoading(false);
  };

  // Reset artisans on the first load
  useEffect(() => {
    fetchArtisans(true);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white max-w-[700px] w-full mx-auto p-6 rounded-xl shadow-lg overflow-y-auto max-h-[90vh] relative z-50">
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          &#x2715;
        </button>
        <h2 className="text-2xl font-semibold mb-6">Select Artisan</h2>
        <ul>
          {artisans.map((artisan) => (
            <li
              key={artisan.id}
              className="p-4 border-b cursor-pointer hover:bg-gray-100"
              onClick={() => onSelect(artisan)}
            >
              {artisan.name}
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center mt-4">
          {/* Previous Button */}
          <button
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${
              !lastVisible ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => {
              fetchArtisans(true); // Reset and fetch first page
            }}
            disabled={!lastVisible}
          >
            Reset
          </button>
          {/* Load More Button */}
          <button
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${
              !hasMore ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => fetchArtisans()}
            disabled={!hasMore || loading}
          >
            {loading ? "Loading..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtisanSelectionDialog;