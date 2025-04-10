"use client";

import React from "react";
import { useProtectedRoute } from "../../hooks/useProtectedRoute";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, isAdmin } = useProtectedRoute();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // The hook will handle redirection
  }

  return <>{children}</>;
}
