"use client";

import InputGroup from "@/components/FormElements/InputGroup";
import React, { useState, useEffect } from "react";
import CustomEditor from "./custom_editor";

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

const PopupForm: React.FC<PopupFormProps> = ({ onClose, onSubmit, initialData = null }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 overflow-auto">
      {/* Background Image with Blur - only shown when image is not empty */}
      {formData.image && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl z-40"
          style={{ backgroundImage: `url(${formData.image})` }}
        />
      )}
      
      <div className="bg-white max-w-[700px] w-full mx-auto p-6 rounded-xl shadow-lg overflow-y-auto max-h-[90vh] relative z-50">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          &#x2715;
        </button>
        
        {/* Form Header - changes based on mode */}
        <h2 className="text-2xl font-semibold mb-6">
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
            <CustomEditor
              value={formData.story}
              onChange={handleStoryChange}
            />
          </div>
          
          {/* Image Preview - show a small preview of the image */}
          {formData.image && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
              <div className="w-full h-32 overflow-hidden rounded-lg">
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300?text=Invalid+Image+URL';
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Submit Button - changes text based on mode */}
          <button
            type="submit"
            className="mt-6 w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-all"
          >
            {isEditMode ? "Update" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PopupForm;