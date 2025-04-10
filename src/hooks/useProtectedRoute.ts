"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export function useProtectedRoute() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && !isAdmin) {
      // If user is logged in but not an admin
      router.push("/login");
    }
  }, [user, loading, isAdmin, router]);

  return { user, loading, isAdmin };
}
