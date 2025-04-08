"use client";

import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  startAfter,
  endBefore,
  DocumentData,
  QueryDocumentSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/js/firebase";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  thumbnail_image: string;
  artisan_id: string;
  artisan_name: string;
  colors: string[]; // Array of colors
  sizes: string[]; // Array of sizes
};

export default function ProductsPage() {
  const ITEMS_PER_PAGE = 5; // Number of products per page
  const router = useRouter(); // For navigation
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Calculate total pages based on Firestore collection size
  const fetchTotalPages = async () => {
    try {
      const productsRef = collection(db, "products");
      const snapshot = await getDocs(query(productsRef));
      const totalProducts = snapshot.size;
      setTotalPages(Math.ceil(totalProducts / ITEMS_PER_PAGE));
    } catch (error) {
      setError("Error fetching total number of products.");
    }
  };

  // Fetch products with pagination
  const fetchProducts = async (direction?: "next" | "prev") => {
    setLoading(true);
    setError(null);

    try {
      const productsRef = collection(db, "products");
      let productsQuery;

      if (direction === "next" && lastVisible) {
        productsQuery = query(productsRef, orderBy("created_at"), startAfter(lastVisible), limit(ITEMS_PER_PAGE));
      } else if (direction === "prev" && firstVisible) {
        productsQuery = query(productsRef, orderBy("created_at"), endBefore(firstVisible), limit(ITEMS_PER_PAGE));
      } else {
        productsQuery = query(productsRef, orderBy("created_at"), limit(ITEMS_PER_PAGE));
      }

      const snapshot = await getDocs(productsQuery);
      const fetchedProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));

      if (!snapshot.empty) {
        setFirstVisible(snapshot.docs[0]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }

      setProducts(fetchedProducts);
    } catch (error) {
      setError("Error fetching products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalPages();
    fetchProducts();
  }, []);

  // Handle Next Page
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
      fetchProducts("next");
    }
  };

  // Handle Previous Page
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
      fetchProducts("prev");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId));
      alert("Product deleted successfully.");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("An error occurred while deleting the product.");
    }
  };

  const goToEditPage = (productId: string) => {
    router.push(`/products/create_product?id=${productId}`);
  };

  const goToCreatePage = () => {
    router.push("/products/create_product");
  };

  return (
    <div className="mx-auto w-full max-w-[970px]">
      {/* Breadcrumb */}
      <Breadcrumb pageName="Products" />

      {/* Alert */}
      {error && (
        <div className="p-4 mb-4 rounded-lg bg-red-100 text-red-800">
          <h3 className="font-medium">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-x-auto mt-6">
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <table className="table-auto w-full border-collapse border border-gray-300 rounded-lg overflow-hidden shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Image</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Colors</th>
                <th className="px-4 py-2 text-left">Sizes</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 border-b border-gray-200">
                  {/* Image */}
                  <td className="px-4 py-2">
                    <img
                      src={product.thumbnail_image}
                      alt={product.name}
                      className="h-20 w-20 object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/300?text=No+Image";
                      }}
                    />
                  </td>

                  {/* Name */}
                  <td className="px-4 py-2">{product.name}</td>

                  {/* Colors */}
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      {product.colors.length > 0
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

                  {/* Sizes */}
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      {product.sizes.length > 0
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

                  {/* Actions */}
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      {/* Edit Button */}
                      <button
                        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        onClick={() => goToEditPage(product.id)}
                      >
                        <FiEdit />
                      </button>
                      {/* Delete Button */}
                      <button
                        className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
        )}
      </div>

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`p-2 rounded-md flex items-center ${
              currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            <FiChevronLeft />
            <span className="ml-1">Previous</span>
          </button>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md flex items-center ${
              currentPage === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            <span className="mr-1">Next</span>
            <FiChevronRight />
          </button>
          {/* Floating Button - Create New Product */}
          <div className="fixed bottom-8 right-8 z-50">
            <button
              className="flex items-center justify-center p-4 bg-blue-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={goToCreatePage}
            >
              <FiPlus size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}