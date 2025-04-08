"use client";

import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { collection, query, getDocs, orderBy, limit, startAfter, endBefore, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/js/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { FiChevronLeft, FiChevronRight, FiSearch, FiEdit, FiTrash2 } from "react-icons/fi";

type Product = {
  id: string;
  name: string;
  thumbnail_image?: string;
};

export default function SelectProductsPage() {
  const ITEMS_PER_PAGE = 10;
  const searchParams = useSearchParams();
  const genreId = searchParams.get("id");
  const genreName = searchParams.get("name");
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);

  // Fetch initial selected products and products list
  useEffect(() => {
    if (genreId) {
      fetchInitialSelectedProducts();
    }
  }, [genreId]);

  // We separate the product fetch to ensure selected products are loaded first
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch selected products for the genre being edited
  const fetchInitialSelectedProducts = async () => {
    if (!genreId) return;
    try {
      const genreRef = doc(db, "genres", genreId);
      const genreSnap = await getDoc(genreRef);
      if (genreSnap.exists()) {
        const data = genreSnap.data();
        setSelectedProducts(data.product_ids || []);
      } else {
        console.warn(`Genre with ID ${genreId} not found.`);
      }
    } catch (err) {
      console.error("Error fetching initial selected products:", err);
      setError("Failed to load selected products.");
    }
  };

  // Fetch products with pagination and search
  const fetchProducts = async (direction?: "next" | "prev") => {
    setLoading(true);
    try {
      const productsRef = collection(db, "products");
      let productsQuery;

      if (direction === "next" && lastVisible) {
        productsQuery = query(productsRef, orderBy("name"), startAfter(lastVisible), limit(ITEMS_PER_PAGE));
      } else if (direction === "prev" && firstVisible) {
        productsQuery = query(productsRef, orderBy("name"), endBefore(firstVisible), limit(ITEMS_PER_PAGE));
      } else {
        productsQuery = query(productsRef, orderBy("name"), limit(ITEMS_PER_PAGE));
      }

      const snapshot = await getDocs(productsQuery);
      const fetchedProducts: Product[] = snapshot.docs.map((doc) => ({
        id: doc.id, // Firestore document ID
        name: doc.data().name,
        thumbnail_image: doc.data().thumbnail_image || "https://via.placeholder.com/200",
      }));

      if (!snapshot.empty) {
        setFirstVisible(snapshot.docs[0]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }

      // Apply search filter if searchTerm exists
      const filteredProducts = searchTerm.trim()
        ? fetchedProducts.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : fetchedProducts;

      setProducts(filteredProducts);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Error fetching products.");
      setLoading(false);
    }
  };

  // Handle pagination
  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
    fetchProducts("next");
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      fetchProducts("prev");
    }
  };

  // Toggle product selection
  const handleProductToggle = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Save selected products
  const handleSave = async () => {
    if (!genreId) {
      setError("No genre ID provided.");
      return;
    }
    try {
      const genreRef = doc(db, "genres", genreId);
      await updateDoc(genreRef, { product_ids: selectedProducts });
      router.push("/genres");
    } catch (err) {
      console.error("Error saving genre:", err);
      setError("Error saving selections.");
    }
  };

  // Check if a product is selected
  const isProductSelected = (productId: string) => {
    return selectedProducts.includes(productId);
  };

  // These functions are placeholders for edit and delete actions
  const handleEdit = (productId: string) => {
    // Placeholder for edit functionality
    console.log("Edit product:", productId);
  };

  const handleDelete = (productId: string) => {
    // Placeholder for delete functionality
    console.log("Delete product:", productId);
  };

  return (
    <div className="w-full min-h-screen  p-6">
      <div className="mb-8">
        <Breadcrumb pageName={`Products for ${genreName || 'Genre'}`} />
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow-md">
        <div className="flex items-center gap-2 border border-gray-200 rounded-md p-2">
          <FiSearch size={20} className="text-gray-600" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              fetchProducts(); // Trigger search on change
            }}
            className="w-full focus:outline-none"
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 p-4 rounded-md text-red-700">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No products found.</div>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Image</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Select</th>
                  {/* <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={product.thumbnail_image}
                        alt={product.name}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isProductSelected(product.id)}
                        onChange={() => handleProductToggle(product.id)}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </td>
                    {/* <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product.id)}
                          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
            onClick={handlePrevPage}
            disabled={currentPage === 1 || loading}
          >
            <FiChevronLeft size={16} /> Previous
          </button>
          <span className="text-gray-600">Page {currentPage}</span>
          <button
            className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
            onClick={handleNextPage}
            disabled={products.length < ITEMS_PER_PAGE || loading}
          >
            Next <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          className="rounded-md bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300 transition-colors"
          onClick={() => router.push("/genres")}
        >
          Cancel
        </button>
        <button
          className="rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 transition-colors"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}