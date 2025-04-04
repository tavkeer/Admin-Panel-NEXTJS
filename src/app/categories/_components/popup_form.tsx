import React, { useState } from "react";

type PopupFormProps = {
  initialData: { name?: string; image?: string } | null; // Initial data for editing
  onClose: () => void; // Close handler
  onSubmit: (formData: { name: string; image?: string }) => void; // Submit handler
};

export default function PopupForm({ initialData, onClose, onSubmit }: PopupFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    image: initialData?.image || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData); // Submit data to parent
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl w-[400px] max-w-full p-4">
        <h2 className="text-lg font-medium mb-4">{initialData ? "Edit Category" : "Add Category"}</h2>
        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Category Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-400 focus:border-blue-400"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Image Input */}
          <div className="mb-4">
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Image Link (Optional)
            </label>
            <input
              type="text"
              id="image"
              name="image"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-400 focus:border-blue-400"
              value={formData.image}
              onChange={handleChange}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button type="button" className="py-2 px-4 bg-gray-200 rounded-md" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="py-2 px-4 bg-blue-400 text-white rounded-md">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}