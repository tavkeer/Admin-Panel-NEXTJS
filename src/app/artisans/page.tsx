"use client";

import { db } from "@/js/firebase";
import { useRouter } from "next/navigation"; 
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiPlus, FiEdit, FiTrash2, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  collection,
  doc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";


export default function Page() {
  const ITEMS_PER_PAGE = 5;
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    null
  );
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageArtisans, setPageArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    const fetchTotalPages = async () => {
      const artisansRef = collection(db, "artisans");
      const snapshot = await getDocs(query(artisansRef, orderBy("created_at", "desc")));
      const totalArtisans = snapshot.size;
      setTotalPages(Math.ceil(totalArtisans / ITEMS_PER_PAGE));
      return snapshot;
    };

    const fetchPageData = async () => {
      setLoading(true);
      try {
        const artisansRef = collection(db, "artisans");
        const baseQuery = query(artisansRef, orderBy("created_at", "desc"), limit(ITEMS_PER_PAGE));

        const currentQuery =
          currentPage === 1
            ? baseQuery
            : query(baseQuery, startAfter(lastVisible), limit(ITEMS_PER_PAGE));

        const snapshot = await getDocs(currentQuery);
        const artisans: Artisan[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Artisan[];

        if (!snapshot.empty) {
          setFirstVisible(snapshot.docs[0]);
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        }
        setPageArtisans(artisans);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching page data:", err);
        setLoading(false);
      }
    };

    fetchTotalPages();
    fetchPageData();
  }, [currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleDeleteArtisan = async (artisanId: string) => {
    try {
      const artisanRef = doc(db, "artisans", artisanId);
      await deleteDoc(artisanRef);

      setPageArtisans((prevArtisans) => prevArtisans.filter((artisan) => artisan.id !== artisanId));
      setAlert({
        type: "success",
        title: "Artisan Deleted Successfully",
        description: "The artisan has been removed from the database.",
      });
    } catch (error) {
      console.error("Error deleting artisan:", error);
      setAlert({
        type: "error",
        title: "Failed to Delete Artisan",
        description: "An error occurred while deleting the artisan.",
      });
    }
  };

  const goToCreatePage = () => {
    router.push("/artisans/create_artisan"); 
  };

  const goToEditPage = (id: string) => {
    router.push(`/artisans/create_artisan?id=${id}`); 
  };

  return (
    <div className="mx-auto w-full max-w-[970px]">
      {/* Breadcrumb */}
      <Breadcrumb pageName="Artisans" />

      {/* Alert */}
      {alert && (
        <div
          className={`p-4 mb-4 rounded-lg ${
            alert.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          <h3 className="font-medium">{alert.title}</h3>
          <p>{alert.description}</p>
        </div>
      )}

      {/* Artisans Table */}
      <div className="overflow-x-auto mt-6">
        {loading ? (
          <p>Loading artisans...</p>
        ) : pageArtisans.length === 0 ? (
          <p>No artisans found.</p>
        ) : (
          <table className="table-auto w-full border-collapse border border-gray-300 rounded-lg overflow-hidden shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Image</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Address</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageArtisans.map((artisan) => (
                <tr key={artisan.id} className="hover:bg-gray-50 border-b border-gray-200">
                  <td className="px-4 py-2">
                    <img
                      src={artisan.image}
                      alt={artisan.name}
                      className="h-20 w-20 object-cover rounded-md"
                    />
                  </td>
                  <td className="px-4 py-2">{artisan.name}</td>
                  <td className="px-4 py-2">{artisan.address || "N/A"}</td>
                  <td className="px-4 py-2">{artisan.phone || "N/A"}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        onClick={() => goToEditPage(artisan.id)}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
        )}
      </div>

      {/* Pagination Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          className={`p-2 rounded-md flex items-center ${
            currentPage === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          <FiChevronLeft />
          Previous
        </button>
        <div className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </div>
        <button
          className={`p-2 rounded-md flex items-center ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next
          <FiChevronRight />
        </button>
      </div>

      {/* Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          className="flex items-center justify-center p-4 bg-blue-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={goToCreatePage}
        >
          <FiPlus size={24} />
        </button>
      </div>
    </div>
  );
}