"use client";

import React from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/js/firebase";
import { FiAlertTriangle, FiPlus } from "react-icons/fi";
import { useRouter } from "next/navigation";

type Genre = {
  id: string;
  name: string;
  image?: string;
  product_ids: string[];
};

export default function GenresPage() {
  const router = useRouter();
  const [genresSnapshot, genresLoading, genresError] = useCollection(collection(db, "genres"));

  const goToSelectProductsPage = (genreId?: string,genreName?:string) => {
    router.push(genreId ? `/genres/select_products?id=${genreId}&name=${genreName}` : "/genres/select_products");
  };

  return (
    <div className="mx-auto w-full max-w-[970px] p-6">
      <Breadcrumb pageName="Genres" />
      <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {genresLoading ? (
          <p>Loading genres...</p>
        ) : genresError ? (
          <p className="text-red-500">Error loading genres: {genresError.message}</p>
        ) : (
          genresSnapshot?.docs.map((doc) => {
            const genre: Genre = {
              id: doc.id,
              name: doc.data().name,
              image: doc.data().image,
              product_ids: doc.data().product_ids || [],
            };
            return <GenreTile key={genre.id} genre={genre} onClick={() => goToSelectProductsPage(genre.id,genre.name||'N/A')} />;
          })
        )}
      </div>
     
    </div>
  );
}

const GenreTile = ({ genre, onClick }: { genre: Genre; onClick: () => void }) => {
  const { name, image } = genre;
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
      onClick={onClick}
    >
      {image ? (
        <img src={image} alt={name} className="h-40 w-full rounded-xl object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded-xl bg-gray-200">
          <FiAlertTriangle size={32} className="text-red-500" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 px-2 text-lg font-semibold text-white">
        <span className="w-full truncate text-center">{name}</span>
      </div>
    </div>
  );
};