"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InputGroup from "@/components/FormElements/InputGroup";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import QuillEditorWrapper from "../_components/custom_editor_wrapper";
import { db } from "@/js/firebase";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import Alert from "@/components/Alert/Alert";

type FormDataType = {
  name: string;
  image: string;
  address: string;
  phone: string;
  story: string;
};

const CreateArtisanPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // Extract query params
  const artisanId = searchParams?.get("id"); // Check if 'id' exists in query

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    image: "",
    address: "",
    phone: "",
    story: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isEditMode = !!artisanId; // Determine if we're editing an artisan

  useEffect(() => {
    // Fetch artisan data if we're in edit mode
    const fetchArtisanData = async () => {
      if (artisanId) {
        try {
          const artisanRef = doc(db, "artisans", artisanId);
          const artisanSnap = await getDoc(artisanRef);

          if (artisanSnap.exists()) {
            const data = artisanSnap.data() as FormDataType;
            setFormData(data); // Load artisan data into the form
          } else {
            setError("Artisan not found");
            router.push("/artisans"); // Redirect if artisan not found
          }
        } catch (error) {
          setError("Error fetching artisan");
        }
      }
    };

    fetchArtisanData();
  }, [artisanId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoryChange = (content: string) => {
    setFormData((prev) => ({ ...prev, story: content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number format
    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Phone number must be a valid 10-digit number.");
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        // Update existing artisan
        const artisanRef = doc(db, "artisans", artisanId!); // Non-null assertion
        await updateDoc(artisanRef, {
          ...formData,
          updated_at: new Date(),
        });
        setSuccess("Artisan updated successfully.");
      } else {
        // Create new artisan
        const artisansRef = collection(db, "artisans");
        await addDoc(artisansRef, {
          ...formData,
          created_at: new Date(),
        });
        setSuccess("Artisan added successfully.");
      }

      router.push("/artisans"); // Navigate back to artisans list
    } catch (error) {
      setError("Error submitting artisan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto rounded-lg bg-white p-6 shadow-md">
      {/* Breadcrumb */}
      <Breadcrumb pageName={isEditMode ? "Update Artisan" : "Create Artisan"} />

      {error && <Alert type="error" message={error} setMessage={setError} />}

      {success && (
        <Alert type="success" message={success} setMessage={setSuccess} />
      )}

      {/* Form Header */}
      <h2 className="mb-6 text-center text-2xl font-bold">
        {isEditMode ? "Update Artisan" : "Add New Artisan"}
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <InputGroup
          label="Name"
          placeholder="Enter artisan's name"
          type="text"
          name="name"
          value={formData.name}
          handleChange={handleInputChange}
          required
        />

        <InputGroup
          label="Thumbnail Image Link"
          placeholder="Enter image link"
          type="text"
          name="image"
          value={formData.image}
          handleChange={handleInputChange}
          required
          className="mt-4"
        />

        {/* Image Preview */}
        {formData.image && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-gray-600">Thumbnail Preview:</p>
            <div className="inline-block overflow-hidden rounded-lg border border-gray-200">
              <img
                src={formData.image}
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

        <InputGroup
          label="Address"
          placeholder="Enter address"
          type="text"
          name="address"
          value={formData.address}
          handleChange={handleInputChange}
          required
          className="mt-4"
        />

        <InputGroup
          label="Phone"
          placeholder="Enter 10-digit phone number"
          type="tel"
          name="phone"
          value={formData.phone}
          handleChange={handleInputChange}
          required
          className="mt-4"
        />

        {/* Story */}
        <div className="mt-4">
          <label className="text-body-sm font-medium text-dark">
            Story <span className="ml-1 select-none text-red">*</span>
          </label>
          <QuillEditorWrapper
            value={formData.story}
            onChange={handleStoryChange}
          />
        </div>

        {/* Image Preview */}
        {/* {formData.image && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-gray-600">Image Preview:</p>
            <div className="h-32 w-full overflow-hidden rounded-lg">
              <img
                src={formData.image}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/300?text=Invalid+Image+URL";
                }}
              />
            </div>
          </div>
        )} */}

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-blue-500 py-3 text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Submitting..." : isEditMode ? "Update" : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default function ArtisanFormWithSuspense() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <CreateArtisanPage />
    </Suspense>
  );
}
