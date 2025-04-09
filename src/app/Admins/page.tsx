"use client";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db } from "@/js/firebase";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CalendarBox from "@/components/CalenderBox";
import { FiX, FiPlus } from "react-icons/fi";
import { useCollection } from "react-firebase-hooks/firestore";
import { useRouter } from "next/navigation";


const CalendarPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");

  const [adminsSnapshot, loadingAdmins, adminError] = useCollection(
    query(collection(db, "admins")), // Ensure this matches the target collection
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const validateForm = () => {
    let isValid = true;
    
    if (!adminName.trim()) {
      setNameError("Name is required");
      isValid = false;
    } else {
      setNameError("");
    }

    if (!adminEmail.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(adminEmail)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    } else {
      setEmailError("");
    }

    return isValid;
  };
  
  const handleAddAdmin = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      setError("");
  
      const adminsRef = collection(db, "admins");
      const adminExists = adminsSnapshot?.docs?.find(
        (doc) => doc.data()?.email === adminEmail
      );
  
      if (!adminExists) {
        const docRef = await addDoc(adminsRef, {
          name: adminName,
          email: adminEmail,
          created_at: new Date(),
        });
  
        const adminDocRef = doc(db, "admins", docRef.id);
        await updateDoc(adminDocRef, { id: docRef.id });
  
        console.log("Admin added successfully!");
        setSuccess("Admin added successfully!");
        
        // Reset form and redirect after successful operation
        resetForm();
        
        // Add a short timeout before redirecting to ensure state updates complete
        setTimeout(() => {
          router.push("/Admins");
        }, 500);
        
      } else {
        setError("An admin with this email already exists.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      setError("Failed to add admin. Please try again.");
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAdminName("");
    setAdminEmail("");
    setNameError("");
    setEmailError("");
    setIsDialogOpen(false);
  };

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <>
      <Breadcrumb pageName="Admins" />
      <CalendarBox />

      {/* Floating action button to open dialog */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300"
        >
          <FiPlus size={24} />
        </button>
      </div>

      {/* Admin Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={resetForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
            
            <h2 className="text-xl font-semibold mb-6">Add New Admin</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className={`w-full p-2 border rounded-md ${nameError ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter admin name"
                />
                {nameError && <p className="mt-1 text-sm text-red-500">{nameError}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className={`w-full p-2 border rounded-md ${emailError ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter admin email"
                />
                {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
              </div>
              
              <div className="pt-4">
                <button
                  onClick={handleAddAdmin}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  ) : (
                    "Add Admin"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
          {success}
        </div>
      )}
    </>
  );
};

export default CalendarPage;