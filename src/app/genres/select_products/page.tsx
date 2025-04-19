"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiImage,
} from "react-icons/fi";
import { collection, doc, orderBy, query, updateDoc } from "firebase/firestore";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { db } from "@/js/firebase";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Alert from "@/components/Alert/Alert";

type Product = {
  id: string;
  name: string;
  thumbnail_image?: string;
  created_at: Date;
};

const ITEMS_PER_PAGE = 8;

// Create a separate component that uses useSearchParams
function ProductSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const genreId = searchParams.get("id");
  const genreName = searchParams.get("name");

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [genreThumbnail, setGenreThumbnail] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [isValidThumbnail, setIsValidThumbnail] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch genre document
  const genreRef = genreId ? doc(db, "genres", genreId) : null;
  const [genreSnapshot, loadingGenre, errorGenre] = useDocument(genreRef);

  // Fetch products sorted by created_at in descending order (newest first)
  const productsRef = query(
    collection(db, "products"),
    orderBy("created_at", "desc"),
  );
  const [productsSnapshot, loadingProducts, errorProducts] =
    useCollection(productsRef);

  useEffect(() => {
    if (genreSnapshot?.exists() && productsSnapshot) {
      const data = genreSnapshot.data();
      const existingIds = new Set(productsSnapshot.docs.map((doc) => doc.id));
      const validProductIds = (data.product_ids || []).filter((id: string) =>
        existingIds.has(id),
      );
      setSelectedProducts(validProductIds);

      // Set genre thumbnail if exists
      if (data.thumbnail_image) {
        setGenreThumbnail(data.thumbnail_image);
        setThumbnailPreview(data.thumbnail_image);
      }
    }
  }, [genreSnapshot, productsSnapshot]);

  const allProducts: Product[] = useMemo(() => {
    return (
      productsSnapshot?.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          thumbnail_image:
            data.thumbnail_image || "https://via.placeholder.com/200",
          created_at: data.created_at?.toDate() || new Date(0), // Convert Firestore timestamp to Date
        };
      }) || []
    );
  }, [productsSnapshot]);

  const filteredProducts = useMemo(() => {
    const filtered = allProducts.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [allProducts, searchTerm, currentPage]);

  const totalPages = Math.ceil(
    allProducts.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ).length / ITEMS_PER_PAGE,
  );

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const validateImageUrl = (url: string) => {
    setPreviewLoading(true);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        setIsValidThumbnail(true);
        setThumbnailPreview(url);
        setPreviewLoading(false);
        resolve(true);
      };
      img.onerror = () => {
        setIsValidThumbnail(false);
        setThumbnailPreview("");
        setPreviewLoading(false);
        resolve(false);
      };
      img.src = url;
    });
  };

  const handleThumbnailChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const url = e.target.value;
    setGenreThumbnail(url);

    if (url) {
      await validateImageUrl(url);
    } else {
      setThumbnailPreview("");
      setIsValidThumbnail(true);
    }
  };

  const handleSave = async () => {
    if (!genreRef) return;

    const availableProductIds = new Set(allProducts.map((p) => p.id));
    const validSelectedProducts = selectedProducts.filter((id) =>
      availableProductIds.has(id),
    );

    try {
      await updateDoc(genreRef, {
        product_ids: validSelectedProducts,
        thumbnail_image: isValidThumbnail ? genreThumbnail : null,
      });
      router.push("/genres");
    } catch (err) {
      console.error("Error saving genre:", err);
      setError("Failed to save selected products.");
    }
  };

  return (
    <div className="min-h-screen w-full p-6">
      <div className="mb-8">
        <Breadcrumb pageName={`Products for ${genreName || "Genre"}`} />
        {error && <Alert type="error" message={error} setMessage={setError} />}
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow-md">
        {/* Thumbnail image section */}
        <div className="mb-6">
          <h3 className="mb-2 font-medium text-gray-700">
            Genre Thumbnail Image
          </h3>
          <div className="flex items-center gap-2 rounded-md border border-gray-200 p-2">
            <FiImage size={20} className="text-gray-600" />
            <input
              type="text"
              placeholder="Enter image URL for genre thumbnail..."
              value={genreThumbnail}
              onChange={handleThumbnailChange}
              className="w-full focus:outline-none"
            />
          </div>

          {/* Thumbnail preview */}
          {previewLoading && (
            <div className="mt-2 flex items-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              <span className="ml-2 text-sm text-gray-500">
                Validating image...
              </span>
            </div>
          )}

          {!isValidThumbnail && genreThumbnail && (
            <div className="mt-2 text-sm text-red-500">
              Invalid image URL. Please provide a valid image link.
            </div>
          )}

          {thumbnailPreview && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-gray-500">Preview:</p>
              <div className="flex justify-center rounded-lg border border-gray-200 p-4">
                <img
                  src={thumbnailPreview}
                  alt="Genre thumbnail preview"
                  className="max-h-60 max-w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Search section */}
        <div className="flex items-center gap-2 rounded-md border border-gray-200 p-2">
          <FiSearch size={20} className="text-gray-600" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full focus:outline-none"
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          {loadingGenre || loadingProducts ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
            </div>
          ) : errorGenre || errorProducts ? (
            <div className="rounded-md bg-red-100 p-4 text-red-700">
              {errorGenre?.message || errorProducts?.message}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No products found.
            </div>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    Select
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={product.thumbnail_image}
                        alt={product.name}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3">
                      {product.created_at.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50"
          >
            <FiChevronLeft size={16} /> Previous
          </button>
          <span className="text-gray-600">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50"
          >
            Next <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          className="rounded-md bg-gray-200 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-300"
          onClick={() => router.push("/genres")}
        >
          Cancel
        </button>
        <button
          className="rounded-md bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
          onClick={handleSave}
          disabled={!!genreThumbnail && !isValidThumbnail}
        >
          Save
        </button>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );
}

// Main component that wraps the ProductSelection with Suspense
export default function SelectProductsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProductSelection />
    </Suspense>
  );
}
