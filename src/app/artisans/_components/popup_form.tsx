"use client";

import InputGroup from "@/components/FormElements/InputGroup";
import React, { useState, useEffect } from "react";
import QuillEditorWrapper from "./custom_editor_wrapper";

type FormDataType = {
  name: string;
  image: string;
  address: string;
  phone: string;
  story: string;
};

type PopupFormProps = {
  onClose: () => void;
  onSubmit: (formData: any) => void;
  initialData?: FormDataType | null;
};

const PopupForm: React.FC<PopupFormProps> = ({
  onClose,
  onSubmit,
  initialData = null,
}) => {
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    image: "",
    address: "",
    phone: "",
    story: "",
  });

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-70">
      {/* Background Image with Blur - only shown when image is not empty */}
      {formData.image && (
        <div
          className="absolute inset-0 z-40 bg-cover bg-center opacity-20 blur-xl"
          style={{ backgroundImage: `url(${formData.image})` }}
        />
      )}

      <div className="relative z-50 mx-auto max-h-[90vh] w-full max-w-[700px] overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        {/* Close button */}
        <button
          className="absolute right-4 top-4 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          &#x2715;
        </button>

        {/* Form Header - changes based on mode */}
        <h2 className="mb-6 text-2xl font-semibold">
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
            <QuillEditorWrapper
              value={formData.story}
              onChange={handleStoryChange}
            />
          </div>

          {/* Image Preview - show a small preview of the image */}
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

          {/* Submit Button - changes text based on mode */}
          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-blue-500 py-3 text-white transition-all hover:bg-blue-600"
          >
            {isEditMode ? "Update" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PopupForm;
