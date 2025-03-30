"use client";

import React, { useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup"; // Your reusable InputGroup component
import CustomEditor from "./custom_editor"; // Import rich text editor
import { db } from "@/js/firebase"; // Firebase configuration
import { collection, addDoc } from "firebase/firestore"; // Firestore methods

type PopupFormProps = {
  onClose: () => void; // Function to close the popup
  onSubmit: (formData: any) => void; // Function to handle submission logic
};

const PopupForm: React.FC<PopupFormProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    address: "",
    phone: "",
    story: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoryChange = (content: string) => {
    setFormData((prev) => ({ ...prev, story: content }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number
    if (!/^\d{10}$/.test(formData.phone)) {
      alert("Phone number must be a valid 10-digit number.");
      return;
    }

    // Pass form data to the parent
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 overflow-auto">
      <div className="bg-white max-w-[700px] w-full mx-auto p-6 rounded-xl shadow-lg overflow-y-auto max-h-[90vh] relative">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          &#x2715;
        </button>

        {/* Form Header */}
        <h2 className="text-2xl font-semibold mb-6">Add New Artisan</h2>

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
            <CustomEditor
              value={formData.story}
              onChange={handleStoryChange}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="mt-6 w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-all"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default PopupForm;