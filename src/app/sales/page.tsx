"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import InputGroup from "@/components/FormElements/InputGroup";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Alert from "@/components/Alert/Alert";
import { db } from "@/js/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
} from "firebase/firestore";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

type FormDataType = {
  title: string;
  thumbnail_image: string;
  product_ids: string[];
  status: "live" | "closed";
};

type Product = {
  id: string;
  name: string;
  thumbnail_image?: string;
};

const ITEMS_PER_PAGE = 8;
const SALE_DOC_ID = "current_sale"; // The fixed ID for the single sale document

const SalesPage = () => {
  const router = useRouter();

  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    thumbnail_image: "",
    product_ids: [],
    status: "live",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [saleExists, setSaleExists] = useState(false);

  // Fetch the single sale document
  const saleRef = doc(db, "sales", SALE_DOC_ID);
  const [saleSnapshot, loadingSale, errorSale] = useDocument(saleRef);

  // Fetch products
  const productsRef = query(collection(db, "products"), orderBy("name"));
  const [productsSnapshot, loadingProducts, errorProducts] =
    useCollection(productsRef);

  // Initialize form data from sale document if it exists
  useEffect(() => {
    if (saleSnapshot?.exists()) {
      const data = saleSnapshot.data() as FormDataType;
      setFormData(data);
      setSaleExists(true);
    }
  }, [saleSnapshot]);

  // Process product data
  const allProducts: Product[] = React.useMemo(() => {
    return (
      productsSnapshot?.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        thumbnail_image:
          doc.data().thumbnail_image || "https://via.placeholder.com/200",
      })) || []
    );
  }, [productsSnapshot]);

  // Filter products based on search term and pagination
  const filteredProducts = React.useMemo(() => {
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleProduct = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      product_ids: prev.product_ids.includes(id)
        ? prev.product_ids.filter((pid) => pid !== id)
        : [...prev.product_ids, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validate form data
      if (!formData.title) {
        setError("Title is required");
        setLoading(false);
        return;
      }

      if (!formData.thumbnail_image) {
        setError("Thumbnail image is required");
        setLoading(false);
        return;
      }

      const saleData = {
        ...formData,
        updated_at: new Date(),
      };

      // Always use setDoc with merge: true to update or create the single sale document
      await setDoc(
        saleRef,
        {
          ...saleData,
          ...(saleExists ? {} : { created_at: new Date() }), // Only add created_at if it's a new sale
        },
        { merge: true },
      );

      setSuccess(
        saleExists
          ? "Sale updated successfully."
          : "Sale created successfully.",
      );

      // Stay on the page to show success message
      setSaleExists(true);
    } catch (error) {
      console.error("Error submitting sale:", error);
      setError("Error saving sale data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto rounded-lg bg-white p-6 shadow-md">
      {/* Breadcrumb */}
      <Breadcrumb pageName="Sale Configuration" />

      {error && <Alert type="error" message={error} setMessage={setError} />}
      {success && (
        <Alert type="success" message={success} setMessage={setSuccess} />
      )}
      {errorSale && (
        <Alert type="error" message={errorSale.message} setMessage={() => {}} />
      )}
      {errorProducts && (
        <Alert
          type="error"
          message={errorProducts.message}
          setMessage={() => {}}
        />
      )}

      {/* Form Header */}
      <h2 className="mb-6 text-center text-2xl font-bold">
        {saleExists ? "Update Sale" : "Configure Sale"}
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <InputGroup
          label="Title"
          placeholder="Enter sale title"
          type="text"
          name="title"
          value={formData.title}
          handleChange={handleInputChange}
          required
        />

        <InputGroup
          label="Thumbnail Image Link"
          placeholder="Enter image link"
          type="text"
          name="thumbnail_image"
          value={formData.thumbnail_image}
          handleChange={handleInputChange}
          required
          className="mt-4"
        />

        {/* Image Preview - Modified for better visibility */}
        {formData.thumbnail_image && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-gray-600">Image Preview:</p>
            <div className="inline-block overflow-hidden rounded-lg border border-gray-200">
              <img
                src={formData.thumbnail_image}
                alt="Preview"
                className="max-h-48 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/300?text=Invalid+Image+URL";
                }}
              />
            </div>
          </div>
        )}

        {/* Status Selection */}
        <div className="mt-4">
          <label className="mb-2.5 block text-body-sm font-medium text-dark">
            Sale Status <span className="ml-1 select-none text-red">*</span>
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="disabled:bg-whiter w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default"
            required
          >
            <option value="live">Live</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Product Selection Table */}
        <div className="mt-6">
          <label className="mb-2.5 block text-body-sm font-medium text-dark">
            Select Products <span className="ml-1 select-none text-red">*</span>
          </label>

          {/* Search Bar */}
          <div className="mb-4 flex items-center gap-2 rounded-md border border-gray-200 p-2">
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

          {/* Products Table */}
          <div className="overflow-x-auto">
            {loadingProducts || loadingSale ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
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
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.product_ids.includes(product.id)}
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

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
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
              type="button"
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages || 1))
              }
              disabled={currentPage >= totalPages}
              className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50"
            >
              Next <FiChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-md bg-gray-200 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : saleExists ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function SalesPageWithSuspense() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex h-40 w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        }
      >
        <SalesPage />
      </Suspense>
    </ProtectedRoute>
  );
}
