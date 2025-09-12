"use client";
import React from "react";

const ErrorBanner = ({ message }) => {
  if (!message) return null;
  return (
    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
      {message}
    </div>
  );
};

export default ErrorBanner;