"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InputGroup from "@/components/FormElements/InputGroup";
import QuillEditorWrapper from "@/app/artisans/_components/custom_editor_wrapper";
import { collection, getDocs, doc, setDoc, addDoc, getDoc } from "firebase/firestore";
import { db } from "@/js/firebase";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiTrash, FiPlusCircle } from "react-icons/fi";

type FormDataType = {
  id: string;
  name: string;
  thumbnail_image: string;
  images: string[];
  artisan_id: string;
  artisan_name: string;
  category_id: string;
  category_name: string;
  description: string;
  enabled: boolean;
  price: string;
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

export default function ProductsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams?.get("id"); // Check if we're in edit mode

  const [formData, setFormData] = useState<FormDataType>({
    id: "",
    name: "",
    thumbnail_image: "",
    images: ["", ""], // Minimum two fields for images
    artisan_id: "",
    artisan_name: "",
    category_id: "",
    category_name: "",
    description: "",
    enabled: false,
    price: "",
    colors: [""], // Minimum one field for colors
    sizes: [""], // Minimum one field for sizes
    combinations: [],
  });

  const [step, setStep] = useState(1); // Two-step form (Step 1: Product details, Step 2: Combinations)
  const [loading, setLoading] = useState(false);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch artisans from Firestore
  useEffect(() => {
    const fetchArtisans = async () => {
      try {
        const artisansRef = collection(db, "artisans");
        const snapshot = await getDocs(artisansRef);
        const artisansData = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setArtisans(artisansData);
      } catch (error) {
        console.error("Error fetching artisans:", error);
      }
    };

    fetchArtisans();
  }, []);

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, "categories");
        const snapshot = await getDocs(categoriesRef);
        const categoriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().category_name,
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Prepopulate form data in edit mode
  useEffect(() => {
    const fetchProductData = async () => {
      if (productId) {
        try {
          const productRef = doc(db, "products", productId);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            setFormData(productSnap.data() as FormDataType);
          } else {
            console.error("Product not found.");
            router.push("/products"); // Redirect if the product is not found
          }
        } catch (error) {
          console.error("Error fetching product data:", error);
          alert("An error occurred while fetching product details.");
        }
      }
    };

    fetchProductData();
  }, [productId, router]);

  /** Handle Input Field Changes **/
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleStoryChange = (content: string) => {
    setFormData((prevData) => ({ ...prevData, description: content }));
  };

  /** Dynamic Field Management **/
  const handleArrayFieldChange = (value: string, index: number, field: keyof FormDataType) => {
    const updatedArray = [...formData[field] as string[]];
    updatedArray[index] = value;
    setFormData((prevData) => ({ ...prevData, [field]: updatedArray }));
  };

  const addArrayField = (field: keyof FormDataType) => {
    const updatedArray = [...formData[field] as string[], ""];
    setFormData((prevData) => ({ ...prevData, [field]: updatedArray }));
  };

  const removeArrayField = (index: number, field: keyof FormDataType) => {
    const updatedArray = (formData[field] as string[]).filter((_, i) => i !== index);
    setFormData((prevData) => ({ ...prevData, [field]: updatedArray }));
  };

  /** Combinations Management **/
  const handleCombinationChange = (
    value: string,
    index: number,
    field: keyof FormDataType["combinations"][0]
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
    const updatedCombinations = formData.combinations.filter((_, i) => i !== index);
    setFormData({ ...formData, combinations: updatedCombinations });
  };

  /** Step 1 Validation **/
  const validateStep1 = (): boolean => {
    if (!formData.name.trim()) {
      setError("Product name is required.");
      return false;
    }

    const validImages = formData.images.filter((image) => image.trim() !== "");
    if (validImages.length < 2) {
      setError("Please add at least two valid image links.");
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
        combination.quantity.trim() !== ""
    );

    if (!validCombinations) {
      setError("Each combination must include valid color, size, price, and quantity.");
      return false;
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
        alert("Product updated successfully.");
      } else {
        const productsRef = collection(db, "products");
        const productDoc = await addDoc(productsRef, {
          ...formData,
          created_at: new Date(),
        });
        alert("Product added successfully.");
        setFormData({ ...formData, id: productDoc.id });
      }

      router.push("/products");
    } catch (error) {
      console.error("Error saving product:", error);
      alert("An error occurred while saving the product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-white p-6">
      <Breadcrumb pageName={productId ? "Update Product" : "Create Product"} />

      {error && (
        <div className="p-4 mb-4 rounded-lg bg-red-100 text-red-800">
          <p>{error}</p>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={(e) => e.preventDefault()}>
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
            <label className="text-body-sm font-medium text-dark">Images</label>
            {formData.images.map((image, index) => (
              <div key={index} className="flex items-center gap-2">
                <InputGroup
                  placeholder="Enter image link"
                  label=""
                  type="text"
                  value={image}
                  name={`image-${index}`}
                  handleChange={(e) =>
                    handleArrayFieldChange(e.target.value, index, "images")
                  }
                />
                {index >= 2 && (
                  <FiTrash
                    size={20}
                    className="text-red-500 cursor-pointer hover:text-red-700"
                    onClick={() => removeArrayField(index, "images")}
                  />
                )}
              </div>
            ))}
            <FiPlusCircle
              size={24}
              className="text-blue-500 cursor-pointer hover:text-blue-600"
              onClick={() => addArrayField("images")}
            />
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
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Combinations</h2>
            {formData.combinations.map((combination, index) => (
              <div key={index} className="border rounded-lg p-4 mb-4">
                <div className="flex items-center gap-4">
                  {/* Color */}
                  <div className="w-full md:w-1/2">
                    <label className="text-sm font-medium text-gray-600">Color</label>
                    <select
                      className="w-full rounded-lg border px-4 py-2 ring-blue-500 focus:outline-none focus:ring-2"
                      value={combination.color}
                      onChange={(e) =>
                        handleCombinationChange(e.target.value, index, "color")
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
                    <label className="text-sm font-medium text-gray-600">Size</label>
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
                <div className="flex items-center gap-4 mt-4">
                  <div className="w-full md:w-1/2">
                    <InputGroup
                      label="Price"
                      placeholder="Enter price"
                      type="text"
                      name={`combination-price-${index}`}
                      value={combination.price}
                      handleChange={(e) =>
                        handleCombinationChange(e.target.value, index, "price")
                      }
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <InputGroup
                      label="Quantity"
                      placeholder="Enter quantity"
                      type="text"
                      name={`combination-quantity-${index}`}
                      value={combination.quantity}
                      handleChange={(e) =>
                        handleCombinationChange(e.target.value, index, "quantity")
                      }
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-white"
                  onClick={() => removeCombination(index)}
                >
                  Remove Combination
                </button>
              </div>
            ))}
            <button
              type="button"
              className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white"
              onClick={addCombination}
            >
              Add Combination
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
              type="submit"
              className="w-1/2 rounded-lg bg-blue-500 px-4 py-2 text-white"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}