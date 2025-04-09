"use client";

import React, { useEffect } from "react";

const Alert = ({
  message,
  type,
  setMessage,
}: {
  message: string | null;
  type: "error" | "success";
  setMessage: (msg: string | null) => void;
}) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message, setMessage]);

  if (!message) return null;

  return (
    <div className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2 transform">
      <div
        className={`relative mx-auto w-[90vw] max-w-md rounded-lg px-6 py-4 shadow-md transition-all duration-300 ${
          type === "error"
            ? "bg-red-100 text-red-800"
            : "bg-green-100 text-green-800"
        }`}
      >
        <button
          onClick={() => setMessage(null)}
          className="absolute right-2 top-2 text-xl font-semibold leading-none text-inherit hover:text-opacity-80 focus:outline-none"
          aria-label="Close"
        >
          &times;
        </button>
        <strong className="block text-base font-semibold">
          {type === "error" ? "Error" : "Success"}
        </strong>
        <p className="mt-1 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default Alert;
