"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/js/firebase.js";
import { FiTrash2 } from "react-icons/fi";

// Define the type for an Admin object
type Admin = {
  id: string;
  name: string;
  email: string;
};

export function AdminsList() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; title: string; description?: string } | null>(null);

  // Fetch data from Firestore for the 'admins' collection
  useEffect(() => {
    async function fetchAdmins() {
      const adminsCollection = collection(db, "admins");
      const snapshot = await getDocs(adminsCollection);

      const adminsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Admin[];

      console.log("Fetched Admins:", adminsData);
      setAdmins(adminsData);
    }

    fetchAdmins();
  }, []);

  // Function to delete an admin
  const deleteAdmin = async (id: string) => {
    if (admins.length === 1) {
      setAlert({
        variant: "error",
        title: "Cannot Delete Last Admin",
        description: "At least one admin must remain in the system.",
      });
      return;
    }

    try {
      // Delete document from Firestore
      await deleteDoc(doc(db, "admins", id));
      console.log(`Admin with ID ${id} deleted successfully.`);

      // Update local admin list state
      setAdmins((prevAdmins) => prevAdmins.filter((admin) => admin.id !== id));

      // Show success alert
      setAlert({
        variant: "success",
        title: "Admin Deleted Successfully",
        description: `Admin with ID ${id} was removed from the system.`,
      });
    } catch (error) {
      console.error("Error deleting admin:", error);

      // Show error alert
      setAlert({
        variant: "error",
        title: "Failed to Delete Admin",
        description:  "An unexpected error occurred.",
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Alerts */}
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          description={alert.description}
        />
      )}

      <h1 className="text-2xl font-bold mb-4">Admins List</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {admins.map((admin) => (
          <AdminCard key={admin.id} admin={admin} deleteAdmin={deleteAdmin} />
        ))}
      </div>
    </div>
  );
}

// Admin card component to display individual admin details
function AdminCard({
  admin,
  deleteAdmin,
}: {
  admin: Admin;
  deleteAdmin: (id: string) => void;
}) {
  const { name, email, id } = admin;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex items-center">
      <div className="flex-1">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-gray-600 text-sm">
          <strong>Email:</strong> {email}
        </p>
      </div>
      <FiTrash2
        className="text-red-500 hover:text-red-600 cursor-pointer"
        size={24}
        onClick={() => deleteAdmin(id)}
        title="Delete Admin"
      />
    </div>
  );
}

// Alert component to display success or error messages
const Alert = ({
  variant,
  title,
  description,
}: {
  variant: "success" | "error";
  title: string;
  description?: string;
}) => {
  const isSuccess = variant === "success";
  const colorClasses = isSuccess
    ? "bg-green-100 border-green-400 text-green-700"
    : "bg-red-100 border-red-400 text-red-700";

  return (
    <div className={`fixed top-4 right-4 border px-4 py-3 rounded shadow-lg ${colorClasses}`}>
      <strong>{title}</strong>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
};

export default AdminsList;