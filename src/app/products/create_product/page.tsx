"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDocument, useCollection } from "react-firebase-hooks/firestore";
import InputGroup from "@/components/FormElements/InputGroup";
import QuillEditorWrapper from "@/app/artisans/_components/custom_editor_wrapper";
import { collection, doc, addDoc, setDoc } from "firebase/firestore";
import { db } from "@/js/firebase";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiTrash, FiPlusCircle, FiX } from "react-icons/fi";
import Alert from "@/components/Alert/Alert";

type FormDataType = {
  name: string;
  thumbnail_image: string;
  images: string[];
  artisan_id: string;
  category_id: string;
  description: string;
  returnPolicy: string;
  colors: string[];
  sizes: string[];
  combinations: {
    color: string;
    size: string;
    price: string;
    quantity: string;
  }[];
};

type Artisan = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

const RETURN_POLICY_OPTIONS = [
  "Only Exchange",
  "Return and Exchange",
  "No Return and Exchange",
];

export default function ProductsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams?.get("id"); // Check if we're in edit mode

  // Initialize form data
  const initialFormData: FormDataType = {
    name: "",
    thumbnail_image: "",
    images: ["", ""], // Minimum two fields for images
    artisan_id: "",
    category_id: "",
    returnPolicy: "",
    description: "",
    colors: [""], // Minimum one field for colors
    sizes: [""], // Minimum one field for sizes
    combinations: [],
  };

  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  const [step, setStep] = useState(1); // Two-step form (Step 1: Product details, Step 2: Combinations)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showError, setShowError] = useState<boolean>(false);

  // React Firebase Hooks
  const [artisansSnapshot, artisansLoading, artisansError] = useCollection(
    collection(db, "artisans"),
  );

  const [categoriesSnapshot, categoriesLoading, categoriesError] =
    useCollection(collection(db, "categories"));

  const [productSnapshot, productLoading, productError] = useDocument(
    productId ? doc(db, "products", productId) : null,
  );

  // Transform snapshots to data arrays
  const artisans: Artisan[] =
    artisansSnapshot?.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    })) || [];

  const categories: Category[] =
    categoriesSnapshot?.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().category_name,
    })) || [];

  // Populate form data in edit mode
  useEffect(() => {
    if (productSnapshot?.exists() && productId) {
      const productData = productSnapshot.data() as FormDataType;
      setFormData(productData);
    }
  }, [productSnapshot, productId]);

  // Update showError whenever error is set or cleared
  useEffect(() => {
    setShowError(!!error);
  }, [error]);

  /** Handle Input Field Changes **/
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleStoryChange = (content: string) => {
    setFormData((prevData) => ({ ...prevData, description: content }));
  };

  /** Handle Select Field Changes **/
  const handleArtisanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedArtisan = artisans.find(
      (artisan) => artisan.id === e.target.value,
    );
    if (selectedArtisan) {
      setFormData((prevData) => ({
        ...prevData,
        artisan_id: selectedArtisan.id,
      }));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = categories.find(
      (category) => category.id === e.target.value,
    );
    if (selectedCategory) {
      setFormData((prevData) => ({
        ...prevData,
        category_id: selectedCategory.id,
      }));
    }
  };

  /** Dynamic Field Management **/
  const handleArrayFieldChange = (
    value: string,
    index: number,
    field: keyof FormDataType,
  ) => {
    const updatedArray = [...(formData[field] as string[])];
    updatedArray[index] = value;
    setFormData((prevData) => ({ ...prevData, [field]: updatedArray }));
  };

  const addArrayField = (field: keyof FormDataType) => {
    const updatedArray = [...(formData[field] as string[]), ""];
    setFormData((prevData) => ({ ...prevData, [field]: updatedArray }));
  };

  const removeArrayField = (index: number, field: keyof FormDataType) => {
    // Don't remove if it's the last item (keep at least one)
    if ((formData[field] as string[]).length <= 1) {
      return;
    }

    const updatedArray = (formData[field] as string[]).filter(
      (_, i) => i !== index,
    );
    setFormData((prevData) => ({ ...prevData, [field]: updatedArray }));
  };

  /** Combinations Management **/
  const handleCombinationChange = (
    value: string,
    index: number,
    field: keyof FormDataType["combinations"][0],
  ) => {
    const updatedCombinations = [...formData.combinations];
    updatedCombinations[index][field] = value;
    setFormData({ ...formData, combinations: updatedCombinations });
  };

  const addCombination = () => {
    setFormData({
      ...formData,
      combinations: [
        ...formData.combinations,
        { color: "", size: "", price: "", quantity: "" },
      ],
    });
  };

  const removeCombination = (index: number) => {
    const updatedCombinations = formData.combinations.filter(
      (_, i) => i !== index,
    );
    setFormData({ ...formData, combinations: updatedCombinations });
  };

  /** Error Handling **/
  const clearError = () => {
    setShowError(false);
    setError(null);
  };

  /** Step 1 Validation **/
  const validateStep1 = (): boolean => {
    if (!formData.name.trim()) {
      setError("Product name is required.");
      return false;
    }

    if (!formData.thumbnail_image.trim()) {
      setError("Thumbnail image link is required.");
      return false;
    }

    const validImages = formData.images.filter((image) => image.trim() !== "");
    if (validImages.length < 2) {
      setError("Please add at least two valid image links.");
      return false;
    }

    if (!formData.artisan_id) {
      setError("Please select an artisan.");
      return false;
    }

    if (!formData.category_id) {
      setError("Please select a category.");
      return false;
    }

    if (!formData.description.trim()) {
      setError("Product description is required.");
      return false;
    }

    if (!formData.returnPolicy) {
      setError("Please select a return policy.");
      return false;
    }

    const validColors = formData.colors.filter((color) => color.trim() !== "");
    if (validColors.length < 1) {
      setError("Please add at least one valid color.");
      return false;
    }

    const validSizes = formData.sizes.filter((size) => size.trim() !== "");
    if (validSizes.length < 1) {
      setError("Please add at least one valid size.");
      return false;
    }

    // Check for duplicate colors
    const validColors2 = formData.colors.filter((color) => color.trim() !== "");
    const uniqueColors = new Set(validColors2);
    if (uniqueColors.size !== validColors2.length) {
      setError(
        "Duplicate color names detected. Please use unique color names.",
      );
      return false;
    }

    // Check for duplicate sizes
    const validSizes2 = formData.sizes.filter((size) => size.trim() !== "");
    const uniqueSizes = new Set(validSizes2);
    if (uniqueSizes.size !== validSizes2.length) {
      setError("Duplicate size names detected. Please use unique size names.");
      return false;
    }

    setError(null); // Clear error if validation passes
    return true;
  };

  /** Step 2 Validation **/
  const validateStep2 = (): boolean => {
    if (formData.combinations.length < 1) {
      setError("Please add at least one combination.");
      return false;
    }

    const validCombinations = formData.combinations.every(
      (combination) =>
        combination.color.trim() !== "" &&
        combination.size.trim() !== "" &&
        combination.price.trim() !== "" &&
        combination.quantity.trim() !== "",
    );

    if (!validCombinations) {
      setError(
        "Each combination must include valid color, size, price, and quantity.",
      );
      return false;
    }

    // Check for duplicate color+size combinations
    const combinationMap = new Map();
    for (const combo of formData.combinations) {
      const key = `${combo.color}-${combo.size}`;
      if (combinationMap.has(key)) {
        setError(
          `Duplicate combination found: Color "${combo.color}" and Size "${combo.size}" is used more than once.`,
        );
        return false;
      }
      combinationMap.set(key, true);
    }

    setError(null); // Clear error if validation passes
    return true;
  };

  /** Form Submission **/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);

    try {
      if (productId) {
        const productRef = doc(db, "products", productId);
        await setDoc(productRef, formData, { merge: true });
        setSuccess("Product updated successfully.");
      } else {
        const productsRef = collection(db, "products");
        const productDoc = await addDoc(productsRef, {
          ...formData,
          created_at: new Date(),
        });
        setSuccess("Product added successfully.");
      }
      router.push("/products");
    } catch (error) {
      console.error("Error saving product:", error);
      setError("An error occurred while saving the product.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while fetching data in edit mode
  if (productId && productLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl">Loading product data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-auto bg-white p-6 pb-20">
      <Breadcrumb pageName={productId ? "Update Product" : "Create Product"} />

      {error && showError && (
        <Alert type="error" message={error} setMessage={setError} />
      )}

      {success && (
        <Alert type="success" message={success} setMessage={setSuccess} />
      )}

      {step === 1 ? (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <InputGroup
            label="Name"
            placeholder="Enter product name"
            type="text"
            name="name"
            value={formData.name}
            handleChange={handleInputChange}
            required
          />

          <InputGroup
            label="Thumbnail Image"
            placeholder="Enter thumbnail image link"
            type="text"
            name="thumbnail_image"
            value={formData.thumbnail_image}
            handleChange={handleInputChange}
            required
          />

          {/* Images */}
          <div className="mt-4">
            <label className="mb-2.5 block text-body-sm font-medium text-dark">
              Images (at least 2 required)
            </label>
            {formData.images.map((image, index) => (
              <div key={index} className="mb-2 flex items-center gap-2">
                <div className="flex-grow">
                  <input
                    type="text"
                    placeholder="Enter image link"
                    value={image}
                    onChange={(e) =>
                      handleArrayFieldChange(e.target.value, index, "images")
                    }
                    className="disabled:bg-whiter w-full rounded-lg border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary disabled:cursor-default"
                  />
                </div>
                {index >= 2 && (
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    onClick={() => removeArrayField(index, "images")}
                  >
                    <FiTrash size={18} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="mt-2 flex items-center gap-1 rounded-lg bg-blue-500/10 px-3 py-2 text-blue-500 hover:bg-blue-500/20"
              onClick={() => addArrayField("images")}
            >
              <FiPlusCircle size={18} />
              <span>Add Image</span>
            </button>
          </div>

          {/* Artisan Selection */}
          <div className="mt-4">
            <label className="mb-2.5 block text-body-sm font-medium text-dark">
              Artisan
            </label>
            <select
              name="artisan_id"
              className="disabled:bg-whiter w-full rounded-lg border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary disabled:cursor-default"
              value={formData.artisan_id}
              onChange={handleArtisanChange}
              required
            >
              <option value="">Select Artisan</option>
              {artisansLoading ? (
                <option value="" disabled>
                  Loading artisans...
                </option>
              ) : (
                artisans.map((artisan) => (
                  <option key={artisan.id} value={artisan.id}>
                    {artisan.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Category Selection */}
          <div className="mt-4">
            <label className="mb-2.5 block text-body-sm font-medium text-dark">
              Category
            </label>
            <select
              name="category_id"
              className="disabled:bg-whiter w-full rounded-lg border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary disabled:cursor-default"
              value={formData.category_id}
              onChange={handleCategoryChange}
              required
            >
              <option value="">Select Category</option>
              {categoriesLoading ? (
                <option value="" disabled>
                  Loading categories...
                </option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Description - QuillEditor */}
          <div className="mt-4">
            <label className="mb-2.5 block text-body-sm font-medium text-dark">
              Description
            </label>
            <div className="min-h-[200px]">
              <QuillEditorWrapper
                value={formData.description}
                onChange={handleStoryChange}
              />
            </div>
          </div>

          {/* Return Policy */}
          <div className="mt-4">
            <label className="mb-2.5 block text-body-sm font-medium text-dark">
              Return Policy
            </label>
            <select
              name="returnPolicy"
              className="disabled:bg-whiter w-full rounded-lg border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary disabled:cursor-default"
              value={formData.returnPolicy}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Return Policy</option>
              {RETURN_POLICY_OPTIONS.map((policy, index) => (
                <option key={index} value={policy}>
                  {policy}
                </option>
              ))}
            </select>
          </div>

          {/* Colors */}
          <div className="mt-4">
            <label className="mb-2.5 block text-body-sm font-medium text-dark">
              Colors (at least 1 required)
            </label>
            {formData.colors.map((color, index) => (
              <div key={index} className="mb-2 flex items-center gap-2">
                <div className="flex-grow">
                  <input
                    type="text"
                    placeholder="Enter color name"
                    value={color}
                    onChange={(e) =>
                      handleArrayFieldChange(e.target.value, index, "colors")
                    }
                    className="disabled:bg-whiter w-full rounded-lg border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary disabled:cursor-default"
                  />
                </div>
                {formData.colors.length > 1 && (
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    onClick={() => removeArrayField(index, "colors")}
                  >
                    <FiTrash size={18} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="mt-2 flex items-center gap-1 rounded-lg bg-blue-500/10 px-3 py-2 text-blue-500 hover:bg-blue-500/20"
              onClick={() => addArrayField("colors")}
            >
              <FiPlusCircle size={18} />
              <span>Add Color</span>
            </button>
          </div>

          {/* Sizes */}
          <div className="mt-4">
            <label className="mb-2.5 block text-body-sm font-medium text-dark">
              Sizes (at least 1 required)
            </label>
            {formData.sizes.map((size, index) => (
              <div key={index} className="mb-2 flex items-center gap-2">
                <div className="flex-grow">
                  <input
                    type="text"
                    placeholder="Enter size name"
                    value={size}
                    onChange={(e) =>
                      handleArrayFieldChange(e.target.value, index, "sizes")
                    }
                    className="disabled:bg-whiter w-full rounded-lg border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary disabled:cursor-default"
                  />
                </div>
                {formData.sizes.length > 1 && (
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    onClick={() => removeArrayField(index, "sizes")}
                  >
                    <FiTrash size={18} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="mt-2 flex items-center gap-1 rounded-lg bg-blue-500/10 px-3 py-2 text-blue-500 hover:bg-blue-500/20"
              onClick={() => addArrayField("sizes")}
            >
              <FiPlusCircle size={18} />
              <span>Add Size</span>
            </button>
          </div>

          <div className="mt-6 flex justify-between gap-4">
            <button
              type="button"
              className="w-1/2 rounded-lg bg-red-500 px-4 py-2 text-white"
              onClick={() => router.push("/products")}
            >
              Cancel
            </button>
            <button
              type="button"
              className="w-1/2 rounded-lg bg-blue-500 px-4 py-2 text-white"
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
            >
              Next (Combinations)
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mt-4">
            <h2 className="mb-4 text-xl font-semibold">Combinations</h2>
            {formData.combinations.length === 0 ? (
              <div className="mb-4 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500">
                  No combinations added. Click below to add your first
                  combination.
                </p>
              </div>
            ) : (
              formData.combinations.map((combination, index) => (
                <div
                  key={index}
                  className="mb-4 rounded-lg border bg-gray-50 p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                    {/* Color */}
                    <div className="mb-4 w-full md:mb-0 md:w-1/2">
                      <label className="text-sm font-medium text-gray-600">
                        Color
                      </label>
                      <select
                        className="w-full rounded-lg border px-4 py-2 ring-blue-500 focus:outline-none focus:ring-2"
                        value={combination.color}
                        onChange={(e) =>
                          handleCombinationChange(
                            e.target.value,
                            index,
                            "color",
                          )
                        }
                      >
                        <option value="">Select Color</option>
                        {formData.colors.map((color, idx) => (
                          <option key={idx} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Size */}
                    <div className="w-full md:w-1/2">
                      <label className="text-sm font-medium text-gray-600">
                        Size
                      </label>
                      <select
                        className="w-full rounded-lg border px-4 py-2 ring-blue-500 focus:outline-none focus:ring-2"
                        value={combination.size}
                        onChange={(e) =>
                          handleCombinationChange(e.target.value, index, "size")
                        }
                      >
                        <option value="">Select Size</option>
                        {formData.sizes.map((size, idx) => (
                          <option key={idx} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Price and Quantity */}
                  <div className="mt-4 flex flex-col md:flex-row md:items-center md:gap-4">
                    <div className="mb-4 w-full md:mb-0 md:w-1/2">
                      <label className="text-sm font-medium text-gray-600">
                        Price
                      </label>
                      <input
                        type="text"
                        placeholder="Enter price"
                        value={combination.price}
                        onChange={(e) =>
                          handleCombinationChange(
                            e.target.value,
                            index,
                            "price",
                          )
                        }
                        className="w-full rounded-lg border px-4 py-2 ring-blue-500 focus:outline-none focus:ring-2"
                      />
                    </div>
                    <div className="w-full md:w-1/2">
                      <label className="text-sm font-medium text-gray-600">
                        Quantity
                      </label>
                      <input
                        type="text"
                        placeholder="Enter quantity"
                        value={combination.quantity}
                        onChange={(e) =>
                          handleCombinationChange(
                            e.target.value,
                            index,
                            "quantity",
                          )
                        }
                        className="w-full rounded-lg border px-4 py-2 ring-blue-500 focus:outline-none focus:ring-2"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-4 flex items-center gap-1 rounded-lg bg-red-500 px-4 py-2 text-white"
                    onClick={() => removeCombination(index)}
                  >
                    <FiTrash size={16} />
                    <span>Remove Combination</span>
                  </button>
                </div>
              ))
            )}
            <button
              type="button"
              className="mt-4 flex items-center gap-1 rounded-lg bg-blue-500 px-4 py-2 text-white"
              onClick={addCombination}
            >
              <FiPlusCircle size={18} />
              <span>Add Combination</span>
            </button>
          </div>

          <div className="mt-6 flex justify-between gap-4">
            <button
              type="button"
              className="w-1/2 rounded-lg bg-gray-500 px-4 py-2 text-white"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              type="submit"
              className="w-1/2 rounded-lg bg-blue-500 px-4 py-2 text-white"
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : productId
                  ? "Update Product"
                  : "Create Product"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
