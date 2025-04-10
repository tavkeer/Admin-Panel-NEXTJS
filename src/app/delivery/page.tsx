"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Alert from "@/components/Alert/Alert";
import { db } from "@/js/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useDocument } from "react-firebase-hooks/firestore";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

type DeliveryDataType = {
  indian_delivery_cost: number | string;
  international_delivery_cost: number | string;
};

const DELIVERY_DOC_ID = "current_delivery"; // The fixed ID for the single delivery document

const DeliveryPage = () => {
  const router = useRouter();

  const [formData, setFormData] = useState<DeliveryDataType>({
    indian_delivery_cost: 0,
    international_delivery_cost: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deliveryExists, setDeliveryExists] = useState(false);

  // Fetch the single delivery document
  const deliveryRef = doc(db, "delivery", DELIVERY_DOC_ID);
  const [deliverySnapshot, loadingDelivery, errorDelivery] =
    useDocument(deliveryRef);

  // Initialize form data from delivery document if it exists
  useEffect(() => {
    if (deliverySnapshot?.exists()) {
      const data = deliverySnapshot.data() as DeliveryDataType;
      setFormData(data);
      setDeliveryExists(true);
    }
  }, [deliverySnapshot]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow empty string (user clearing input), else ensure it's a number ≥ 0
    if (value === "") {
      setFormData((prev) => ({ ...prev, [name]: "" }));
    } else {
      const numValue = Math.max(0, parseInt(value));
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const deliveryData = {
        indian_delivery_cost:
          parseInt(formData.indian_delivery_cost as string) || 0,
        international_delivery_cost:
          parseInt(formData.international_delivery_cost as string) || 0,
        updated_at: new Date(),
      };

      await setDoc(
        deliveryRef,
        {
          ...deliveryData,
          ...(deliveryExists ? {} : { created_at: new Date() }),
        },
        { merge: true },
      );

      setSuccess(
        deliveryExists
          ? "Delivery costs updated successfully."
          : "Delivery costs saved successfully.",
      );
      setDeliveryExists(true);
    } catch (error) {
      console.error("Error submitting delivery costs:", error);
      setError("Error saving delivery costs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto rounded-lg bg-white p-6 shadow-md">
      {/* Breadcrumb */}
      <Breadcrumb pageName="Delivery Configuration" />

      {error && <Alert type="error" message={error} setMessage={setError} />}
      {success && (
        <Alert type="success" message={success} setMessage={setSuccess} />
      )}
      {errorDelivery && (
        <Alert
          type="error"
          message={errorDelivery.message}
          setMessage={() => {}}
        />
      )}

      {/* Form Header */}
      <h2 className="mb-6 text-center text-2xl font-bold">
        Update Delivery Cost
      </h2>

      {/* Loading indicator */}
      {loadingDelivery && (
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Indian Delivery Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Indian Delivery
              </h3>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                ₹
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                name="indian_delivery_cost"
                value={formData.indian_delivery_cost}
                onChange={handleInputChange}
                min="0"
                step="1"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Enter Indian delivery cost"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                ₹
              </span>
            </div>
          </div>

          {/* International Delivery Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                International Delivery
              </h3>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                $
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                name="international_delivery_cost"
                value={formData.international_delivery_cost}
                onChange={handleInputChange}
                min="0"
                step="1"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Enter international delivery cost"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
            </div>
          </div>
        </div>

        {/* Submit and Cancel */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-md border border-gray-300 bg-white px-6 py-2 text-gray-700 transition hover:bg-gray-100 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function DeliveryPageWithSuspense() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex h-40 w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        }
      >
        <DeliveryPage />
      </Suspense>
    </ProtectedRoute>
  );
}
