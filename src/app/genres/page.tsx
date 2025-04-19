"use client";

import React from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/js/firebase";
import { FiAlertTriangle, FiPlus } from "react-icons/fi";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

type Genre = {
  id: string;
  name: string;
  thumbnail_image?: string;
  product_ids: string[];
};

export default function GenresPage() {
  const router = useRouter();
  const [genresSnapshot, genresLoading, genresError] = useCollection(
    collection(db, "genres"),
  );

  const goToSelectProductsPage = (genreId?: string, genreName?: string) => {
    router.push(
      genreId
        ? `/genres/select_products?id=${genreId}&name=${genreName}`
        : "/genres/select_products",
    );
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto w-full max-w-[970px] p-6">
        <Breadcrumb pageName="Genres" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {genresLoading ? (
            <p>Loading genres...</p>
          ) : genresError ? (
            <p className="text-red-500">
              Error loading genres: {genresError.message}
            </p>
          ) : (
            genresSnapshot?.docs.map((doc) => {
              const genre: Genre = {
                id: doc.id,
                name: doc.data().name,
                thumbnail_image: doc.data().thumbnail_image,
                product_ids: doc.data().product_ids || [],
              };
              return (
                <GenreTile
                  key={genre.id}
                  genre={genre}
                  onClick={() =>
                    goToSelectProductsPage(genre.id, genre.name || "N/A")
                  }
                />
              );
            })
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

const GenreTile = ({
  genre,
  onClick,
}: {
  genre: Genre;
  onClick: () => void;
}) => {
  const { name, thumbnail_image } = genre;

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl"
      onClick={onClick}
    >
      <div className="h-56 w-full">
        {thumbnail_image ? (
          <img
            src={thumbnail_image}
            alt={name}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <FiAlertTriangle size={36} className="text-red-500" />
          </div>
        )}
      </div>

      <div className="p-4 text-center">
        <h3 className="text-xl font-bold text-gray-800">{name}</h3>
      </div>
    </div>
  );
};
