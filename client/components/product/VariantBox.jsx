"use client";
import React from "react";
import { Trash2 } from "lucide-react";
import PriceInputs from "@/components/product/PriceInputs";
import ThumbPicker from "@/components/product/ThumbPicker";
import GalleryPicker from "@/components/product/GalleryPicker";

const VariantBox = ({
  rowIndex,
  row,
  variants,
  onVariantChange,
  onRemove,
  MRP,
  setMRP,
  SP,
  setSP,
  totalStocks,
  setTotalStocks,
  discountPct,
  thumbFile,
  onThumbChange,
  galleryFiles,
  onGalleryChange,
  clearGalleryAt,
  uploadKey,
}) => {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Variant #{rowIndex + 1}</h3>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(rowIndex)}
            className="text-red-600 p-1 rounded hover:bg-red-50"
            aria-label={`Remove variant row ${rowIndex + 1}`}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Variant selectors */}
      <div className="flex gap-3 flex-wrap">
        {variants.map((variant) => (
          <select
            key={variant.variantId}
            className="outline-none py-2 px-3 rounded-md border border-gray-300"
            value={row.values[variant.variantId] || ""}
            onChange={(e) => onVariantChange(rowIndex, variant.variantId, e.target.value)}
          >
            <option value="">Select {variant.name}</option>
            {variant.values.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        ))}
      </div>

      {/* Pricing */}
      <PriceInputs
        MRP={MRP}
        setMRP={setMRP}
        SP={SP}
        setSP={setSP}
        totalStocks={totalStocks}
        setTotalStocks={setTotalStocks}
        discountPct={discountPct}
      />

      {/* Images */}
      <div className="space-y-4">
        <ThumbPicker file={thumbFile} onChange={onThumbChange} uploadKey={uploadKey} />
        <GalleryPicker
          files={galleryFiles}
          onChange={onGalleryChange}
          onClearAt={clearGalleryAt}
          uploadKey={uploadKey}
        />
      </div>
    </div>
  );
};

export default VariantBox;
