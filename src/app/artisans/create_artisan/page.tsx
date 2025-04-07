"use client";

import InputGroup from "@/components/FormElements/InputGroup";
import React, { useState, useEffect } from "react";
import QuillEditorWrapper from "../_components/custom_editor_wrapper";
import { useRouter, useSearchParams } from "next/navigation"; // For navigation and query params
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { db } from "@/js/firebase";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";

type FormDataType = {
  name: string;
  image: string;
  address: string;
  phone: string;
  story: string;
};

export default function CreateArtisanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const artisanId = searchParams.get("id");

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    image: "",
    address: "",
    phone: "",
    story: "",
  });
  const [loading, setLoading] = useState(false);
  const isEditMode = !!artisanId; // Check if we're in edit mode

  useEffect(() => {
    // Fetch data for editing
    const fetchArtisanData = async () => {
      if (artisanId) {
        try {
          const artisanRef = doc(db, "artisans", artisanId);
          const artisanSnap = await getDoc(artisanRef);

          if (artisanSnap.exists()) {
            const data = artisanSnap.data() as FormDataType;
            setFormData(data); // Load initial data into the form
          } else {
            console.error("Artisan not found");
            router.push("/artisans"); // Redirect if artisan doesn't exist
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

    // Validate phone number to ensure it's a 10-digit number
    if (!/^\d{10}$/.test(formData.phone)) {
      alert("Phone number must be a valid 10-digit number.");
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        // Update logic
        const artisanRef = doc(db, "artisans", artisanId!); 
        await updateDoc(artisanRef, {
          ...formData,
          updated_at: new Date(),
        });
        alert("Artisan updated successfully.");
      } else {
        // Add new artisan logic
        const artisansRef = collection(db, "artisans");
        await addDoc(artisansRef, {
          ...formData,
          created_at: new Date(),
        });
        alert("Artisan added successfully.");
      }

      router.push("/artisans"); // Navigate back to the artisans list page
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

        {/* Story Section */}
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
}