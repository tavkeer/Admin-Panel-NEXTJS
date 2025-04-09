"use client";

import React, { useState } from "react";
import { collection, doc, deleteDoc, orderBy, query } from "firebase/firestore";
import { db } from "@/js/firebase.js";
import { useCollection } from "react-firebase-hooks/firestore";
import { FiTrash2 } from "react-icons/fi";
import Alert from "../Alert/Alert";
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog";

// Define the type for an Admin object
type Admin = {
  id: string;
  name: string;
  email: string;
};

export function AdminsList() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const adminsRef = collection(db, "admins");
  const adminsQuery = query(adminsRef, orderBy("created_at", "desc"));
  const [snapshot, loading, hookError] = useCollection(adminsQuery);

  const admins: Admin[] =
    snapshot?.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Admin, "id">),
    })) || [];

  if (hookError) {
    console.error("Error loading admins:", hookError);
    setError("An unexpected error occurred while loading admins.");
  }

  const deleteAdmin = (id: string) => {
    setPendingDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (admins.length === 1) {
      setError(
        "Cannot delete admin! At least one admin must remain in the system.",
      );
      return;
    }

    try {
      if (!pendingDeleteId) return;
      await deleteDoc(doc(db, "admins", pendingDeleteId));

      const deletedAdmin = admins.find((a) => a.id === pendingDeleteId);
      setSuccess(
        `Admin with email ${deletedAdmin?.email} deleted successfully.`,
      );
    } catch (error) {
      console.error("Error deleting admin:", error);
      setError("Failed to delete admin! An unexpected error occurred.");
    } finally {
      setPendingDeleteId(null);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {error && <Alert type="error" message={error} setMessage={setError} />}
      {success && (
        <Alert type="success" message={success} setMessage={setSuccess} />
      )}

      <h1 className="mb-4 text-2xl font-bold">Admins List</h1>

      {loading ? (
        <p>Loading admins...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-semibold">{admin.name}</h3>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {admin.email}
                </p>
              </div>
              <FiTrash2
                className="cursor-pointer text-red-500 hover:text-red-600"
                size={24}
                onClick={() => deleteAdmin(admin.id)}
                title="Delete Admin"
              />
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Delete Admin?"
        description={`This action cannot be undone. Are you sure you want to delete this admin, ${admins.find((a) => a.id === pendingDeleteId)?.email}?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

export default AdminsList;
