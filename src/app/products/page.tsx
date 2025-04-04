"use client";

import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FiPlus } from "react-icons/fi";
import { collection, getDocs, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/js/firebase";
import ProductsForm from "./components/add_product_form";

type Product = {
  id: string;
  name: string;
  thumbnail_image: string;
  artisan_id: string;
  artisan_name: string;
  price: string;
  enabled: boolean;
};

type FormDataType = {
  id: string;
  name: string;
  thumbnail_image: string;
  images: string[];
  category_id: string, // Initialize category_id
  category_name: string, // Initialize category_name
  artisan_id: string;
  artisan_name: string;
  created_at: Date;
  description: string;
  enabled: boolean;
  price: string;
  colors: string[];
  sizes: string[]; //
  combinations: {
    color: string;
    size: string;
    price: string;
    quantity: string;
  }[];
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FormDataType | null>(
    null,
  );

  /** Utility: Convert Product to FormDataType **/
  const convertToFormDataType = (product: Product): FormDataType => {
    return {
      id: product.id,
      name: product.name,
      thumbnail_image: product.thumbnail_image,
      images: [], // Initialize as empty since raw Product doesn't include images
      artisan_id: product.artisan_id,
      artisan_name: product.artisan_name,
      created_at: new Date(), // Use current date if editing; could be fetched in the future
      description: "", // Initialize empty if not provided
      enabled: product.enabled,
      price: product.price,
      category_id: '', // Initialize category_id
      category_name: '', // Initialize category_name
      colors: [], // Initialize empty since raw Product doesn't include colors
      sizes: [], // Initialize empty since raw Product doesn't include sizes
      combinations: [], // Initialize empty since raw Product doesn't include combinations
    };
  };

  /** Fetch products from Firestore **/
  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, "products");
      const snapshot = await getDocs(productsRef);

      const productsData = snapshot.docs.map((doc) => ({
        ...(doc.data() as Product),
      }));
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  /** Save product combinations as a subcollection **/
  const saveCombinations = async (productId: string, combinations: any[]) => {
    try {
      const combinationsRef = collection(
        db,
        `products/${productId}/combinations`,
      );
      // Add each combination into the subcollection
      for (const combination of combinations) {
        const combinationDoc = doc(combinationsRef); // Generate a new document
        await setDoc(combinationDoc, combination);
      }
      console.log("Combinations created successfully!");
    } catch (error) {
      console.error("Error saving combinations:", error);
    }
  };

  /** Add or Update Product **/
  const handleSubmit = async (productData: FormDataType) => {
    try {
      let productId = productData.id;

      if (productId) {
        // Update existing product
        await setDoc(doc(db, "products", productId), {
          ...productData,
          updated_at: new Date(),
        });
        console.log(`Product "${productData.name}" updated successfully!`);
      } else {
        // Add new product
        const productRef = await addDoc(collection(db, "products"), {
          ...productData,
          created_at: new Date(),
        });
        productId = productRef.id;
        console.log(
          `Product "${productData.name}" added successfully with ID: ${productId}`,
        );
      }

      // Save combinations as a subcollection
      await saveCombinations(productId, productData.combinations);

      // Refresh product list
      setShowPopup(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="mx-auto w-full max-w-[970px]">
      {/* Breadcrumb */}
      <Breadcrumb pageName="Products" />

      {/* Product Grid */}
      <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product, index) => (
          <ProductTile
            key={index}
            product={product}
            onClick={() => setSelectedProduct(convertToFormDataType(product))}
          />
        ))}
      </div>

      {/* Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          className="flex items-center justify-center rounded-full bg-blue-400 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl"
          onClick={() => {
            setShowPopup(true);
            setSelectedProduct(null); // Reset selected product
          }}
        >
          <FiPlus size={24} />
        </button>
      </div>

      {/* Popup Form */}
      {showPopup && (
        <ProductsForm
          onClose={() => setShowPopup(false)}
          onSubmit={handleSubmit}
          initialData={selectedProduct}
        />
      )}
    </div>
  );
}

/** Small Product Card **/
const ProductTile = ({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) => {
  const { name, thumbnail_image } = product;

  return (
    <div
      className="group relative transform cursor-pointer overflow-hidden rounded-xl shadow-lg backdrop-blur-md transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
      onClick={onClick}
    >
      <img
        src={thumbnail_image}
        alt={name}
        className="h-40 w-full rounded-xl object-cover"
        onError={(e) => {
          e.currentTarget.src = "https://via.placeholder.com/300?text=No+Image";
        }}
      />
      {/* Product Name Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 px-2 text-lg font-semibold text-white">
        <span className="w-full truncate text-center">{name}</span>
      </div>
    </div>
  );
};
