"use client";

import React, { useState, useEffect } from "react";
import {
  FiEdit,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
} from "react-icons/fi";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { db } from "@/js/firebase";
import { useCollection } from "react-firebase-hooks/firestore";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useRouter } from "next/navigation";
import Alert from "@/components/Alert/Alert";
import ConfirmationDialog from "@/components/ConfirmationDialog/ConfirmationDialog";

type Product = {
  id: string;
  name: string;
  thumbnail_image: string;
  artisan_id: string;
  artisan_name: string;
  colors: string[];
  sizes: string[];
};

export default function ProductsPage() {
  const ITEMS_PER_PAGE = 8;
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageKeys, setPageKeys] = useState<any[]>([null]);
  const [isSearching, setIsSearching] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Update total pages for non-search pagination
  useEffect(() => {
    if (!searchTerm) {
      const fetchTotalPages = async () => {
        try {
          const snapshot = await getDocs(collection(db, "products"));
          const totalProducts = snapshot.size;
          setTotalPages(Math.ceil(totalProducts / ITEMS_PER_PAGE));
        } catch (err) {
          setError("Error fetching total number of products.");
        }
      };
      fetchTotalPages();
    }
  }, [searchTerm]);

  // Case-insensitive search function
  const performSearch = async (term: string) => {
    if (!term.trim()) return;

    setIsSearching(true);

    try {
      // Convert search term to lowercase for case-insensitive comparison
      const lowerTerm = term.toLowerCase();

      // Fetch all products to perform client-side filtering
      const productsSnapshot = await getDocs(collection(db, "products"));

      // Filter products where name contains the search term (case-insensitive)
      const matchingProducts = productsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
        .filter((product) => product.name.toLowerCase().includes(lowerTerm))
        // Sort by created_at desc (newest first)
        .sort(
          (a: any, b: any) =>
            b.created_at?.toMillis() - a.created_at?.toMillis(),
        );

      setProducts(matchingProducts);
      setIsSearching(false);
    } catch (err) {
      setError("Error searching products.");
      setIsSearching(false);
    }
  };

  const createQuery = () => {
    const productsRef = collection(db, "products");

    if (searchTerm) {
      // When searching, we'll handle filtering client-side for case-insensitivity
      return query(
        productsRef,
        orderBy("created_at", "desc"),
        limit(100), // Fetch more to allow for client-side filtering
      );
    }

    if (currentPage > 1 && pageKeys[currentPage - 1]) {
      return query(
        productsRef,
        orderBy("created_at", "desc"),
        startAfter(pageKeys[currentPage - 1]),
        limit(ITEMS_PER_PAGE),
      );
    }

    return query(
      productsRef,
      orderBy("created_at", "desc"),
      limit(ITEMS_PER_PAGE),
    );
  };

  const [snapshot, loading, collectionError] = useCollection(createQuery());

  useEffect(() => {
    if (snapshot) {
      if (searchTerm) {
        // Client-side search handled by the performSearch function
        return;
      }

      const fetchedProducts = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Product,
      );

      setProducts(fetchedProducts);

      if (!searchTerm && !snapshot.empty) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setPageKeys((prev) => {
          const newKeys = [...prev];
          if (currentPage >= newKeys.length) {
            newKeys.push(lastDoc);
          } else {
            newKeys[currentPage] = lastDoc;
          }
          return newKeys;
        });
      }
    }

    if (collectionError) {
      setError("Error fetching products: " + collectionError.message);
    }
  }, [snapshot, collectionError, currentPage, searchTerm]);

  const handleDeleteProduct = async (id: string) => {
    setPendingDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteDoc(doc(db, "products", pendingDeleteId));
      setProducts((prev) =>
        prev.filter((product) => product.id !== pendingDeleteId),
      );
      setSuccess("Product deleted successfully.");

      if (!searchTerm) {
        const snapshot = await getDocs(collection(db, "products"));
        const totalProducts = snapshot.size;
        setTotalPages(Math.ceil(totalProducts / ITEMS_PER_PAGE));
      }
    } catch (err) {
      setError("An error occurred while deleting the product.");
    } finally {
      setPendingDeleteId(null);
      setShowConfirmDialog(false);
    }
  };

  const goToEditPage = (id: string) =>
    router.push(`/products/create_product?id=${id}`);

  const goToCreatePage = () => router.push("/products/create_product");

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      // Reset to normal pagination view
      setCurrentPage(1);
      setPageKeys([null]);
    } else {
      // Debounce search to avoid too many operations
      const timeoutId = setTimeout(() => {
        performSearch(value);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  };

  return (
    <div className="mx-auto flex min-h-[95vh] w-full flex-col">
      <Breadcrumb pageName="Products" />

      <Alert message={success} setMessage={setSuccess} type="success" />
      <Alert message={error} setMessage={setError} type="error" />

      {/* Search Field */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by product name..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full rounded-md border border-gray-300 p-2"
        />
      </div>

      <div className="mt-2 flex flex-grow flex-col overflow-x-auto">
        {loading || isSearching ? (
          <p className="flex flex-grow items-center justify-center">
            Loading products...
          </p>
        ) : products.length === 0 ? (
          <p className="flex flex-grow items-center justify-center">
            No products found.
          </p>
        ) : (
          <div className="flex h-full flex-col">
            <table className="w-full table-auto border-collapse overflow-hidden rounded-lg border border-gray-300 bg-white shadow">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="px-4 py-2 text-left">Image</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Colors</th>
                  <th className="px-4 py-2 text-left">Sizes</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-200 transition-colors hover:bg-gray-100"
                  >
                    <td className="px-4 py-2">
                      <img
                        src={product.thumbnail_image}
                        alt={product.name}
                        className="h-20 w-20 rounded-md object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/300?text=No+Image";
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        {product.colors?.length > 0
                          ? product.colors.map((color) => (
                              <span
                                key={color}
                                className="inline-block rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600"
                              >
                                {color}
                              </span>
                            ))
                          : "No Colors"}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        {product.sizes?.length > 0
                          ? product.sizes.map((size) => (
                              <span
                                key={size}
                                className="inline-block rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600"
                              >
                                {size}
                              </span>
                            ))
                          : "No Sizes"}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <button
                          className="rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600"
                          onClick={() => goToEditPage(product.id)}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="rounded-md bg-red-500 p-2 text-white hover:bg-red-600"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex-grow"></div>
          </div>
        )}
      </div>

      {!loading && !isSearching && products.length > 0 && !searchTerm && (
        <div className="mt-auto flex items-center justify-around py-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`flex items-center rounded-md p-2 ${
              currentPage === 1
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            <FiChevronLeft />
            <span className="ml-1">Previous</span>
          </button>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`flex items-center rounded-md p-2 ${
              currentPage === totalPages
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            <span className="mr-1">Next</span>
            <FiChevronRight />
          </button>
        </div>
      )}

      <div className="fixed bottom-8 right-8 z-50">
        <button
          className="flex items-center justify-center rounded-full bg-blue-400 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl"
          onClick={goToCreatePage}
        >
          <FiPlus size={24} />
        </button>
      </div>
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Delete Product?"
        description={`This action cannot be undone. Are you sure you want to delete this product, ${products.find((p) => p.id === pendingDeleteId)?.name}?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
