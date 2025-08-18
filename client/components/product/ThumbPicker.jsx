"use client";
import React from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";

const ThumbPicker = ({ file, onChange, uploadKey }) => (
  <div>
    <p className="text-sm font-medium">Product Thumbnail Image</p>
    <div className="flex flex-wrap items-center gap-3 mt-2">
      <label htmlFor={`thumb-${uploadKey}`} className="cursor-pointer">
        <input
          key={`thumb-input-${uploadKey}`}
          type="file"
          id={`thumb-${uploadKey}`}
          hidden
          accept="image/*"
          onChange={onChange}
        />
        <div className="relative">
          <Image
            className="max-w-24 rounded-lg border"
            src={file ? URL.createObjectURL(file) : assets.upload_area}
            alt="thumbnail"
            width={100}
            height={100}
          />
        </div>
      </label>
    </div>
  </div>
);

export default ThumbPicker;
