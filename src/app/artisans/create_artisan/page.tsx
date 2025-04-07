"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InputGroup from "@/components/FormElements/InputGroup";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import QuillEditorWrapper from "../_components/custom_editor_wrapper";
import { db } from "@/js/firebase";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";

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
            console.error("Artisan not found");
            router.push("/artisans"); // Redirect if artisan not found
          }
        } catch (error) {
          console.error("Error fetching artisan:", error);
          alert("Error fetching artisan details.");
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
      alert("Phone number must be a valid 10-digit number.");
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
        alert("Artisan updated successfully.");
      } else {
        // Create new artisan
        const artisansRef = collection(db, "artisans");
        await addDoc(artisansRef, {
          ...formData,
          created_at: new Date(),
        });
        alert("Artisan added successfully.");
      }

      router.push("/artisans"); // Navigate back to artisans list
    } catch (error) {
      console.error("Error submitting artisan:", error);
      alert("An error occurred while saving the artisan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto  p-6 bg-white shadow-md rounded-lg">
      {/* Breadcrumb */}
      <Breadcrumb pageName={isEditMode ? "Update Artisan" : "Create Artisan"} />

      {/* Form Header */}
      <h2 className="text-2xl font-bold text-center mb-6">
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
          <QuillEditorWrapper value={formData.story} onChange={handleStoryChange} />
        </div>

        {/* Image Preview */}
        {formData.image && (
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
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-blue-500 py-3 text-white transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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