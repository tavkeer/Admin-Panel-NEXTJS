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
} from "firebase/firestore";
import { db } from "@/js/firebase";
import { useCollection } from "react-firebase-hooks/firestore";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useRouter } from "next/navigation";
import Alert from "@/components/Alert/Alert";
import ConfirmationDialog from "@/components/ConfirmationDialog/ConfirmationDialog";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

type Artisan = {
  id: string;
  name: string;
  image: string;
  address: string;
  phone: string;
};

export default function ArtisansPage() {
  const ITEMS_PER_PAGE = 8;
  const router = useRouter();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
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
          const snapshot = await getDocs(collection(db, "artisans"));
          const totalArtisans = snapshot.size;
          setTotalPages(Math.ceil(totalArtisans / ITEMS_PER_PAGE));
        } catch (err) {
          setError("Error fetching total number of artisans.");
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

      // Fetch all artisans to perform client-side filtering
      const artisansSnapshot = await getDocs(collection(db, "artisans"));

      // Filter artisans where name contains the search term (case-insensitive)
      const matchingArtisans = artisansSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Artisan)
        .filter((artisan) => artisan.name.toLowerCase().includes(lowerTerm))
        // Sort by created_at desc (newest first)
        .sort(
          (a: any, b: any) =>
            b.created_at?.toMillis() - a.created_at?.toMillis(),
        );

      setArtisans(matchingArtisans);
      setIsSearching(false);
    } catch (err) {
      setError("Error searching artisans.");
      setIsSearching(false);
    }
  };

  const createQuery = () => {
    const artisansRef = collection(db, "artisans");

    if (searchTerm) {
      // When searching, we'll handle filtering client-side for case-insensitivity
      return query(
        artisansRef,
        orderBy("created_at", "desc"),
        limit(100), // Fetch more to allow for client-side filtering
      );
    }

    if (currentPage > 1 && pageKeys[currentPage - 1]) {
      return query(
        artisansRef,
        orderBy("created_at", "desc"),
        startAfter(pageKeys[currentPage - 1]),
        limit(ITEMS_PER_PAGE),
      );
    }

    return query(
      artisansRef,
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

      const fetchedArtisans = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Artisan,
      );

      setArtisans(fetchedArtisans);

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
      setError("Error fetching artisans: " + collectionError.message);
    }
  }, [snapshot, collectionError, currentPage, searchTerm]);

  const handleDeleteArtisan = async (id: string) => {
    setPendingDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteDoc(doc(db, "artisans", pendingDeleteId));
      setArtisans((prev) =>
        prev.filter((artisan) => artisan.id !== pendingDeleteId),
      );
      setSuccess("Artisan deleted successfully.");

      if (!searchTerm) {
        const snapshot = await getDocs(collection(db, "artisans"));
        const totalArtisans = snapshot.size;
        setTotalPages(Math.ceil(totalArtisans / ITEMS_PER_PAGE));
      }
    } catch (err) {
      setError("An error occurred while deleting the artisan.");
    } finally {
      setPendingDeleteId(null);
      setShowConfirmDialog(false);
    }
  };

  const goToEditPage = (id: string) =>
    router.push(`/artisans/create_artisan?id=${id}`);

  const goToCreatePage = () => router.push("/artisans/create_artisan");

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
    <ProtectedRoute>
      <div className="mx-auto flex min-h-[95vh] w-full flex-col">
        <Breadcrumb pageName="Artisans" />

        <Alert message={success} setMessage={setSuccess} type="success" />
        <Alert message={error} setMessage={setError} type="error" />

        {/* Search Field */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by artisan name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </div>

        <div className="mt-2 flex flex-grow flex-col overflow-x-auto">
          {loading || isSearching ? (
            <p className="flex flex-grow items-center justify-center">
              Loading artisans...
            </p>
          ) : artisans.length === 0 ? (
            <p className="flex flex-grow items-center justify-center">
              No artisans found.
            </p>
          ) : (
            <div className="flex h-full flex-col">
              <table className="w-full table-auto border-collapse overflow-hidden rounded-lg border border-gray-300 bg-white shadow">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="px-4 py-2 text-left">Image</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Address</th>
                    <th className="px-4 py-2 text-left">Phone</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {artisans.map((artisan) => (
                    <tr
                      key={artisan.id}
                      className="border-b border-gray-200 transition-colors hover:bg-gray-100"
                    >
                      <td className="px-4 py-2">
                        <img
                          src={artisan.image}
                          alt={artisan.name}
                          className="h-20 w-20 rounded-md object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/300?text=No+Image";
                          }}
                        />
                      </td>
                      <td className="px-4 py-2">{artisan.name}</td>
                      <td className="px-4 py-2">{artisan.address || "N/A"}</td>
                      <td className="px-4 py-2">{artisan.phone || "N/A"}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <button
                            className="rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600"
                            onClick={() => goToEditPage(artisan.id)}
                          >
                            <FiEdit />
                          </button>
                          <button
                            className="rounded-md bg-red-500 p-2 text-white hover:bg-red-600"
                            onClick={() => handleDeleteArtisan(artisan.id)}
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

        {!loading && !isSearching && artisans.length > 0 && !searchTerm && (
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
          title="Delete Artisan?"
          description={`This action cannot be undone. Are you sure you want to delete this artisan, ${artisans.find((a) => a.id === pendingDeleteId)?.name}?`}
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
