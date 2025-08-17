"use client";
import React from "react";

const SuccessModal = ({ open, message, onOK }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Success</h2>
        <p className="text-sm text-gray-600 mt-1">{message}</p>
        <div className="mt-6 flex justify-end">
          <button className="px-5 py-2 bg-orange-600 text-white rounded-lg" onClick={onOK}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;