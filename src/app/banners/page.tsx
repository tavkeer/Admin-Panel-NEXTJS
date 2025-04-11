"use client";
import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import {
  collection,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/js/firebase";
import { useCollection } from "react-firebase-hooks/firestore";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Alert from "@/components/Alert/Alert";
import BannerForm from "./_components/popup_form";
import ConfirmationDialog from "@/components/ConfirmationDialog/ConfirmationDialog";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

type Banner = {
  id: string;
  imageUrl: string;
  createdAt: Timestamp;
};

export default function BannersPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Use react-firebase-hooks
  const [bannersSnapshot, loading, snapError] = useCollection(
    collection(db, "banners"),
  );

  // Convert snapshot to Banner array
  const banners: Banner[] =
    bannersSnapshot?.docs.map((doc) => ({
      id: doc.id,
      imageUrl: doc.data().imageUrl || "",
      createdAt: doc.data().createdAt || Timestamp.now(),
    })) || [];

  // Sort banners by createdAt (most recent first)
  banners.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

  useEffect(() => {
    if (snapError) {
      setError("Failed to fetch banners.");
    }
  }, [snapError]);

  // Handle Delete
  const handleDeleteBanner = async (id: string) => {
    setPendingDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteDoc(doc(db, "banners", pendingDeleteId));
      setSuccess("Banner deleted successfully.");
    } catch (err) {
      setError("Error deleting banner.");
    } finally {
      setPendingDeleteId(null);
      setShowConfirmDialog(false);
    }
  };

  // Edit Mode
  const handleEditBanner = (banner: Banner) => {
    setSelectedBanner(banner);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedBanner(null);
  };

  // Add / Update Banner
  const handleSubmitBanner = async (formData: { imageUrl: string }) => {
    if (!formData.imageUrl.trim()) {
      setError("Image URL cannot be empty.");
      return;
    }

    try {
      // Check if we've reached the limit for new banners
      if (!selectedBanner && banners.length >= 6) {
        closePopup();
        setTimeout(() => {
          setError(
            "Maximum of 6 banners allowed. Please delete an existing banner first.",
          );
        }, 200);
        return;
      }

      if (selectedBanner) {
        await updateDoc(doc(db, "banners", selectedBanner.id), {
          imageUrl: formData.imageUrl,
          updatedAt: Timestamp.now(),
        });
        setSuccess("Banner updated successfully.");
      } else {
        await addDoc(collection(db, "banners"), {
          imageUrl: formData.imageUrl,
          createdAt: Timestamp.now(),
        });
        setSuccess("Banner added successfully.");
      }

      closePopup();
    } catch (err) {
      console.error(err);
      closePopup();
      setTimeout(() => {
        setError("Error saving banner.");
      }, 200);
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto flex min-h-[95vh] w-full flex-col">
        <Breadcrumb pageName="Banners" />

        <Alert message={success} setMessage={setSuccess} type="success" />
        <Alert message={error} setMessage={setError} type="error" />

        <div className="mt-4 flex flex-grow flex-col">
          {loading ? (
            <p className="flex flex-grow items-center justify-center">
              Loading banners...
            </p>
          ) : banners.length === 0 ? (
            <p className="flex flex-grow items-center justify-center">
              No banners found. Add your first banner!
            </p>
          ) : (
            <div className="flex h-full flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Banner Images ({banners.length}/6)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse overflow-hidden rounded-lg border border-gray-300 bg-white shadow">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700">
                      <th className="px-4 py-2 text-left">Banner Image</th>
                      <th className="w-24 px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((banner) => (
                      <tr
                        key={banner.id}
                        className="border-b border-gray-200 transition-colors hover:bg-gray-100"
                      >
                        <td className="px-4 py-6">
                          {/* Improved banner display */}
                          <div className="flex justify-center">
                            <div className="relative h-48 w-full max-w-2xl overflow-hidden rounded">
                              <img
                                src={banner.imageUrl}
                                alt="Banner"
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = "/placeholder-image.png"; // Fallback image
                                  target.classList.add("error-image");
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center space-x-2">
                            <button
                              className="rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600"
                              onClick={() => handleEditBanner(banner)}
                            >
                              <FiEdit />
                            </button>
                            <button
                              className="rounded-md bg-red-500 p-2 text-white hover:bg-red-600"
                              onClick={() => handleDeleteBanner(banner.id)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex-grow" />
            </div>
          )}
        </div>

        {/* Floating Add Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            className={`flex items-center justify-center rounded-full ${
              banners.length >= 6
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-400 hover:shadow-xl"
            } p-4 text-white shadow-lg transition-all duration-300`}
            onClick={() => {
              if (banners.length < 6) {
                setShowPopup(true);
              } else {
                setError(
                  "Maximum of 6 banners allowed. Please delete an existing banner first.",
                );
              }
            }}
          >
            <FiPlus size={24} />
          </button>
        </div>

        {showPopup && (
          <BannerForm
            onClose={closePopup}
            onSubmit={handleSubmitBanner}
            initialData={selectedBanner}
          />
        )}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          title="Delete Banner?"
          description="This action cannot be undone. Are you sure you want to delete this banner?"
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
