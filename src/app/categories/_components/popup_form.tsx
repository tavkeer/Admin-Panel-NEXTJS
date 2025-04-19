import React, { useEffect, useRef, useState } from "react";

type PopupFormProps = {
  initialData: { name?: string; imageUrl?: string } | null;
  onClose: () => void;
  onSubmit: (formData: { name: string; imageUrl?: string }) => void;
};

export default function CategoryPopupForm({
  initialData,
  onClose,
  onSubmit,
}: PopupFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    imageUrl: initialData?.imageUrl || "",
  });
  const [isValidImage, setIsValidImage] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Validate image URL when it changes
  useEffect(() => {
    if (!formData.imageUrl) {
      setIsValidImage(null);
      return;
    }

    setIsLoading(true);
    const img = new Image();
    img.onload = () => {
      setIsValidImage(true);
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsValidImage(false);
      setIsLoading(false);
    };
    img.src = formData.imageUrl;
  }, [formData.imageUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.imageUrl && !isValidImage) {
      alert("Please enter a valid image URL or leave the field empty");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300"
      >
        <h2 className="mb-5 text-xl font-semibold text-gray-800">
          {initialData ? "Edit Category" : "Add Category"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name input */}
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-600"
            >
              Category Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter category name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Image URL input */}
          <div>
            <label
              htmlFor="imageUrl"
              className="mb-1 block text-sm font-medium text-gray-600"
            >
              Image URL (optional)
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="Enter image URL"
              className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                isValidImage === false
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : isValidImage === true
                    ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {isValidImage === false && (
              <p className="mt-1 text-xs text-red-500">
                Invalid image URL. Please check and try again.
              </p>
            )}
          </div>

          {/* Image Preview */}
          {formData.imageUrl && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-600">Preview:</p>
              <div className="flex items-center justify-center">
                {isLoading ? (
                  <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-100">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
                  </div>
                ) : isValidImage ? (
                  <div className="relative h-32 w-32 overflow-hidden rounded-lg border-2 border-green-200">
                    <img
                      src={formData.imageUrl}
                      alt="Category preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-red-50 text-center text-xs text-red-500">
                    Image could not be loaded
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!formData.imageUrl && isValidImage === false}
              className={`rounded-lg px-4 py-2 text-sm text-white transition ${
                formData.imageUrl && isValidImage === false
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
