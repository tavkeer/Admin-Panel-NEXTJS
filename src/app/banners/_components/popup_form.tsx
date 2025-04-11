import React, { useEffect, useRef, useState } from "react";

type BannerFormProps = {
  initialData: { imageUrl?: string } | null;
  onClose: () => void;
  onSubmit: (formData: { imageUrl: string }) => void;
};

export default function BannerForm({
  initialData,
  onClose,
  onSubmit,
}: BannerFormProps) {
  const [formData, setFormData] = useState({
    imageUrl: initialData?.imageUrl || "",
  });
  const [isValidImage, setIsValidImage] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

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

  // Validate image URL
  useEffect(() => {
    if (formData.imageUrl) {
      setIsPreviewLoading(true);
      const img = new Image();
      img.onload = () => {
        setIsValidImage(true);
        setIsPreviewLoading(false);
      };
      img.onerror = () => {
        setIsValidImage(false);
        setIsPreviewLoading(false);
      };
      img.src = formData.imageUrl;
    } else {
      setIsValidImage(true);
    }
  }, [formData.imageUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidImage) {
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
          {initialData ? "Edit Banner" : "Add Banner"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image URL input */}
          <div>
            <label
              htmlFor="imageUrl"
              className="mb-1 block text-sm font-medium text-gray-600"
            >
              Image URL
            </label>
            <input
              type="text"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              required
              placeholder="Enter image URL"
              className={`w-full rounded-lg border ${
                !isValidImage ? "border-red-500" : "border-gray-300"
              } px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {!isValidImage && (
              <p className="mt-1 text-xs text-red-500">
                Invalid image URL. Please provide a valid image address.
              </p>
            )}
          </div>

          {/* Image Preview */}
          <div>
            <p className="mb-1 block text-sm font-medium text-gray-600">
              Image Preview
            </p>
            <div className="relative h-40 w-full overflow-hidden rounded border border-gray-300">
              {isPreviewLoading ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <p className="text-sm text-gray-500">Loading preview...</p>
                </div>
              ) : formData.imageUrl && isValidImage ? (
                <img
                  ref={imgRef}
                  src={formData.imageUrl}
                  alt="Banner preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <p className="text-sm text-gray-500">
                    {formData.imageUrl
                      ? "Invalid image URL"
                      : "Enter an image URL to see preview"}
                  </p>
                </div>
              )}
            </div>
          </div>

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
              disabled={!isValidImage || !formData.imageUrl.trim()}
              className={`rounded-lg ${
                !isValidImage || !formData.imageUrl.trim()
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-blue-500 hover:bg-blue-600"
              } px-4 py-2 text-sm text-white transition`}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
