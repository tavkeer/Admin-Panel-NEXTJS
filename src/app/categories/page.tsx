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
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/js/firebase";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Alert from "@/components/Alert/Alert";
import PopupForm from "./_components/popup_form";
import ConfirmationDialog from "@/components/ConfirmationDialog/ConfirmationDialog";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

type Category = {
  id: string;
  name: string;
  imageUrl?: string;
};

export default function CategoriesPage() {
  const ITEMS_PER_PAGE = 8;
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageKeys, setPageKeys] = useState<any[]>([null]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Fetch total pages for pagination
  useEffect(() => {
    const fetchTotal = async () => {
      const snapshot = await getDocs(collection(db, "categories"));
      setTotalPages(Math.ceil(snapshot.size / ITEMS_PER_PAGE));
    };

    if (!searchTerm) {
      fetchTotal();
    }
  }, [categories.length, searchTerm]);

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);

    try {
      let q;

      if (searchTerm.trim()) {
        q = query(
          collection(db, "categories"),
          orderBy("created_at", "desc"),
          limit(100),
        );
      } else if (currentPage > 1 && pageKeys[currentPage - 1]) {
        q = query(
          collection(db, "categories"),
          orderBy("created_at", "desc"),
          startAfter(pageKeys[currentPage - 1]),
          limit(ITEMS_PER_PAGE),
        );
      } else {
        q = query(
          collection(db, "categories"),
          orderBy("created_at", "desc"),
          limit(ITEMS_PER_PAGE),
        );
      }

      const snapshot = await getDocs(q);
      let results = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().category_name || "",
        imageUrl: doc.data().image_url || "",
      }));

      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        results = results.filter((cat) =>
          cat.name.toLowerCase().includes(lower),
        );
      }

      setCategories(results);

      // Pagination logic
      if (!searchTerm && !snapshot.empty) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setPageKeys((prev) => {
          const updated = [...prev];
          updated[currentPage] = lastDoc;
          return updated;
        });
      }
    } catch (err: any) {
      setError("Failed to fetch categories.");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, [currentPage, searchTerm]);

  const doesCategoryExist = async (name: string) => {
    const snapshot = await getDocs(query(collection(db, "categories")));

    const lower = name.trim().toLowerCase();
    return snapshot.docs.some((doc) => {
      const existingName = (doc.data().category_name || "").toLowerCase();
      return existingName === lower;
    });
  };

  // Handle Delete
  const handleDeleteCategory = async (id: string) => {
    setPendingDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteDoc(doc(db, "categories", pendingDeleteId));
      setSuccess("Category deleted.");
      setCategories((prev) => prev.filter((c) => c.id !== pendingDeleteId));
    } catch (err) {
      setError("Error deleting category.");
    } finally {
      setPendingDeleteId(null);
      setShowConfirmDialog(false);
    }
  };

  // Edit Mode
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedCategory(null);
  };

  // Add / Update Category
  const handleSubmitCategory = async (formData: Partial<Category>) => {
    const name = formData.name?.trim();
    if (!name) {
      setError("Category name cannot be empty.");
      return;
    }

    try {
      const nameExists = await doesCategoryExist(name);

      // Check for duplicate BEFORE proceeding
      const isSameName =
        selectedCategory &&
        selectedCategory.name.toLowerCase() === name.toLowerCase();

      const isDuplicate =
        (!selectedCategory && nameExists) ||
        (selectedCategory && !isSameName && nameExists);

      if (isDuplicate) {
        closePopup();

        // Let the dialog close cleanly before showing the error
        setTimeout(() => {
          setError("Category with this name already exists.");
        }, 200);

        return;
      }

      // Prepare data to save with optional image URL
      const categoryData: any = {
        category_name: name,
      };

      // Only add image_url if it exists
      if (formData.imageUrl) {
        categoryData.image_url = formData.imageUrl;
      }

      if (selectedCategory) {
        await updateDoc(
          doc(db, "categories", selectedCategory.id),
          categoryData,
        );

        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === selectedCategory.id
              ? {
                  ...cat,
                  name,
                  imageUrl: formData.imageUrl || cat.imageUrl,
                }
              : cat,
          ),
        );

        setSuccess("Category updated.");
      } else {
        // Add created_at for new categories
        categoryData.created_at = Timestamp.now();

        const newDoc = await addDoc(collection(db, "categories"), categoryData);

        if (!searchTerm && currentPage === 1) {
          setCategories((prev) => [
            {
              id: newDoc.id,
              name,
              imageUrl: formData.imageUrl,
            },
            ...prev.slice(0, ITEMS_PER_PAGE - 1),
          ]);
        }

        setSuccess("Category added.");
      }

      closePopup();
    } catch (err) {
      console.error(err);
      closePopup();
      setTimeout(() => {
        setError("Error saving category.");
      }, 200);
    }
  };

  // Search with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto flex min-h-[95vh] w-full flex-col">
        <Breadcrumb pageName="Categories" />

        <Alert message={success} setMessage={setSuccess} type="success" />
        <Alert message={error} setMessage={setError} type="error" />

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </div>

        <div className="mt-2 flex flex-grow flex-col overflow-x-auto">
          {isLoading ? (
            <p className="flex flex-grow items-center justify-center">
              Loading categories...
            </p>
          ) : categories.length === 0 ? (
            <p className="flex flex-grow items-center justify-center">
              No categories found.
            </p>
          ) : (
            <div className="flex h-full flex-col">
              <table className="w-full table-auto border-collapse overflow-hidden rounded-lg border border-gray-300 bg-white shadow">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="px-4 py-2 text-left">Image</th>
                    <th className="px-4 py-2 text-left">Category Name</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="border-b border-gray-200 transition-colors hover:bg-gray-100"
                    >
                      <td className="w-16 px-4 py-2">
                        {category.imageUrl ? (
                          <div className="h-10 w-10 overflow-hidden rounded-md border border-gray-200">
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/placeholder-image.png";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                            No img
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">{category.name}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <button
                            className="rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600"
                            onClick={() => handleEditCategory(category)}
                          >
                            <FiEdit />
                          </button>
                          <button
                            className="rounded-md bg-red-500 p-2 text-white hover:bg-red-600"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex-grow" />
            </div>
          )}
        </div>

        {!searchTerm && categories.length > 0 && (
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

        {/* Floating Add Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            className="flex items-center justify-center rounded-full bg-blue-400 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl"
            onClick={() => setShowPopup(true)}
          >
            <FiPlus size={24} />
          </button>
        </div>

        {showPopup && (
          <PopupForm
            onClose={closePopup}
            onSubmit={handleSubmitCategory}
            initialData={selectedCategory}
          />
        )}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          title="Delete Category?"
          description={`This action cannot be undone. Are you sure you want to delete this category, ${categories.find((p) => p.id === pendingDeleteId)?.name}?`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowConfirmDialog(false);
            setPendingDeleteId(null);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
