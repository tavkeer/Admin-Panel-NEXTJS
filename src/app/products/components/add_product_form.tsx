"use client";

import React, { useState, useEffect } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { FiTrash, FiPlusCircle } from "react-icons/fi";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/js/firebase";
import QuillEditorWrapper from "@/app/artisans/_components/custom_editor_wrapper";

type FormDataType = {
  id: string;
  name: string;
  thumbnail_image: string;
  images: string[];
  artisan_id: string;
  artisan_name: string;
  created_at: Date;
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

type ProductsFormProps = {
  onClose: () => void;
  onSubmit: (formData: FormDataType) => void;
  initialData?: FormDataType | null;
};

const ProductsForm: React.FC<ProductsFormProps> = ({
  onClose,
  onSubmit,
  initialData = null,
}) => {
  // Form State
  const [formData, setFormData] = useState<FormDataType>({
    id: "",
    name: "",
    thumbnail_image: "",
    images: ["", ""], // Minimum 2 fields
    artisan_id: "",
    artisan_name: "",
    created_at: new Date(),
    description: "",
    enabled: true,
    price: "",
    colors: [""], // Minimum 1 field
    sizes: [""], // Minimum 1 field
    combinations: [], // Empty initially
  });

  const [step, setStep] = useState(1); // Track the current form step
  const [artisans, setArtisans] = useState<Artisan[]>([]); // List of artisans

  /** Fetch Artisans from Firestore **/
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

  /** Preload Initial Data **/
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  /** Handle Input Changes **/
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoryChange = (content: string) => {
    setFormData((prev) => ({ ...prev, description: content }));
  };

  /** Images Management **/
  const handleImageChange = (value: string, index: number) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ""] });
  };

  const removeImageField = (index: number) => {
    if (formData.images.length > 2) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData({ ...formData, images: newImages });
    }
  };

  /** Colors Management **/
  const handleColorChange = (value: string, index: number) => {
    const newColors = [...formData.colors];
    newColors[index] = value;
    setFormData({ ...formData, colors: newColors });
  };

  const addColorField = () => {
    setFormData({ ...formData, colors: [...formData.colors, ""] });
  };

  const removeColorField = (index: number) => {
    if (formData.colors.length > 1) {
      const newColors = formData.colors.filter((_, i) => i !== index);
      setFormData({ ...formData, colors: newColors });
    }
  };

  /** Sizes Management **/
  const handleSizeChange = (value: string, index: number) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = value;
    setFormData({ ...formData, sizes: newSizes });
  };

  const addSizeField = () => {
    setFormData({ ...formData, sizes: [...formData.sizes, ""] });
  };

  const removeSizeField = (index: number) => {
    if (formData.sizes.length > 1) {
      const newSizes = formData.sizes.filter((_, i) => i !== index);
      setFormData({ ...formData, sizes: newSizes });
    }
  };

  /** Combinations Management **/
  const handleCombinationChange = (
    value: string,
    index: number,
    field: keyof FormDataType["combinations"][0],
  ) => {
    const newCombinations = [...formData.combinations];
    newCombinations[index][field] = value;
    setFormData({ ...formData, combinations: newCombinations });
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
    const newCombinations = formData.combinations.filter((_, i) => i !== index);
    setFormData({ ...formData, combinations: newCombinations });
  };

  /** Handle Form Submission **/
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 2) {
      onSubmit(formData); // Submit the data at the last step
    } else {
      setStep(2); // Move to step 2
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-70">
      <div className="relative z-50 mx-auto max-h-[90vh] w-full max-w-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        {/* Close Button */}
        <button
          className="absolute right-4 top-4 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          &#x2715;
        </button>

        {/* Step Indication */}
        <h2 className="mb-6 text-2xl font-semibold">
          {step === 1 ? "Add Product Details" : "Add Combinations"}
        </h2>

        {/* Step 1: Product Details */}
        {step === 1 && (
          <form onSubmit={handleSubmit}>
            <InputGroup
              label="Name"
              placeholder="Enter product name"
              type="text"
              name="name"
              value={formData.name}
              handleChange={handleInputChange}
              required
            />
            {/* Thumbnail Image */}
            <InputGroup
              label="Thumbnail Image Link"
              placeholder="Enter thumbnail image link"
              type="text"
              name="thumbnail_image"
              value={formData.thumbnail_image}
              handleChange={handleInputChange}
              required
              className="mt-4"
            />

            {/* Images */}
            <div className="mt-4">
              <label className="text-body-sm font-medium text-dark">
                Images <span className="ml-1 select-none text-red">*</span>
              </label>
              {formData.images.map((image, index) => (
                <div key={index} className="my-2 flex items-center gap-2">
                  <InputGroup
                    placeholder="Enter image link"
                    label=""
                    type="text"
                    name={`image-${index}`}
                    value={image}
                    handleChange={(e) =>
                      handleImageChange(e.target.value, index)
                    }
                    required
                  />
                  <FiTrash
                    className="cursor-pointer text-red-500 hover:text-red-700"
                    size={20}
                    onClick={() => removeImageField(index)}
                  />
                </div>
              ))}
              <FiPlusCircle
                className="mt-2 cursor-pointer text-blue-500 hover:text-blue-600"
                size={24}
                onClick={addImageField}
              />
            </div>

            {/* Artisan Dropdown */}
            <div className="mt-4">
              <label className="text-body-sm font-medium text-dark">
                Artisan <span className="ml-1 select-none text-red">*</span>
              </label>
              <select
                className="mt-2 w-full rounded-lg border px-4 py-2 ring-blue-500 focus:outline-none focus:ring-2"
                value={formData.artisan_id}
                onChange={(e) => {
                  const selectedArtisan = artisans.find(
                    (a) => a.id === e.target.value,
                  );
                  if (selectedArtisan) {
                    setFormData({
                      ...formData,
                      artisan_id: selectedArtisan.id,
                      artisan_name: selectedArtisan.name,
                    });
                  }
                }}
              >
                <option value="">Select Artisan</option>
                {artisans.map((artisan) => (
                  <option key={artisan.id} value={artisan.id}>
                    {artisan.name}
                  </option>
                ))}
              </select>
              {formData.artisan_name && (
                <p className="mt-2 font-medium text-gray-600">
                  Selected Artisan: {formData.artisan_name}
                </p>
              )}
            </div>

            {/* Colors */}
            <div className="mt-4">
              <label className="text-body-sm font-medium text-dark">
                Colors <span className="ml-1 select-none text-red">*</span>
              </label>
              {formData.colors.map((color, index) => (
                <div key={index} className="my-2 flex items-center gap-2">
                  <InputGroup
                    label=""
                    placeholder="Enter color"
                    type="text"
                    name={`color-${index}`}
                    value={color}
                    handleChange={(e) =>
                      handleColorChange(e.target.value, index)
                    }
                    required
                  />
                  <FiTrash
                    className="cursor-pointer text-red-500 hover:text-red-700"
                    size={20}
                    onClick={() => removeColorField(index)}
                  />
                </div>
              ))}
              <FiPlusCircle
                className="mt-2 cursor-pointer text-blue-500 hover:text-blue-600"
                size={24}
                onClick={addColorField}
              />
            </div>

            {/* Sizes */}
            <div className="mt-4">
              <label className="text-body-sm font-medium text-dark">
                Sizes <span className="ml-1 select-none text-red">*</span>
              </label>
              {formData.sizes.map((size, index) => (
                <div key={index} className="my-2 flex items-center gap-2">
                  <InputGroup
                    placeholder="Enter size"
                    type="text"
                    label=""
                    name={`size-${index}`}
                    value={size}
                    handleChange={(e) =>
                      handleSizeChange(e.target.value, index)
                    }
                    required
                  />
                  <FiTrash
                    className="cursor-pointer text-red-500 hover:text-red-700"
                    size={20}
                    onClick={() => removeSizeField(index)}
                  />
                </div>
              ))}
              <FiPlusCircle
                className="mt-2 cursor-pointer text-blue-500 hover:text-blue-600"
                size={24}
                onClick={addSizeField}
              />
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="text-body-sm font-medium text-dark">
                Description <span className="ml-1 select-none text-red">*</span>
              </label>
              <QuillEditorWrapper
                value={formData.description}
                onChange={handleStoryChange}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-blue-500 px-4 py-2 text-white"
            >
              Next
            </button>
          </form>
        )}

        {/* Step 2: Add Combinations */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <h3 className="mb-4 text-xl font-semibold">Define Combinations</h3>
            {formData.combinations.map((combination, index) => (
              <div key={index} className="mb-4 flex flex-wrap gap-4">
                <div className="w-1/2">
                  <label className="text-sm font-medium text-gray-600">
                    Color
                  </label>
                  <select
                    className="w-full rounded-lg border px-4 py-2 ring-blue-500 focus:outline-none focus:ring-2"
                    value={combination.color}
                    onChange={(e) =>
                      handleCombinationChange(e.target.value, index, "color")
                    }
                  >
                    <option value="">Select Color</option>
                    {formData.colors.map((color, i) => (
                      <option key={i} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-1/2">
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
                    {formData.sizes.map((size, i) => (
                      <option key={i} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <InputGroup
                  label="Price"
                  placeholder="Enter price"
                  type="text"
                  name={`combination-price-${index}`}
                  value={combination.price}
                  handleChange={(e) =>
                    handleCombinationChange(e.target.value, index, "price")
                  }
                  required
                />
                <InputGroup
                  label="Quantity"
                  placeholder="Enter quantity"
                  type="text"
                  name={`combination-quantity-${index}`}
                  value={combination.quantity}
                  handleChange={(e) =>
                    handleCombinationChange(e.target.value, index, "quantity")
                  }
                  required
                />
                <FiTrash
                  className="cursor-pointer text-red-500 hover:text-red-700"
                  size={20}
                  onClick={() => removeCombination(index)}
                />
              </div>
            ))}
            <FiPlusCircle
              className="mt-2 cursor-pointer text-blue-500 hover:text-blue-600"
              size={24}
              onClick={addCombination}
            />
            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-blue-500 px-4 py-2 text-white"
            >
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProductsForm;
