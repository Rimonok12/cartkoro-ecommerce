"use client";
import React from "react";
import { Plus } from "lucide-react";
import VariantBox from "@/components/product/VariantBox";

const VariantList = ({
  variants,
  rows,
  onVariantChange,
  onPriceChange,
  onThumbChange,
  onGalleryChange,
  onClearGalleryAt,
  onAddRow,
  onRemoveRow,
}) => {
  return (
    <div className="space-y-6">
      {/* Heading only */}
      <h2 className="text-lg font-semibold">Variant Details</h2>

      <div className="space-y-4">
        {rows.map((row, idx) => (
          <VariantBox
            key={idx}
            rowIndex={idx}
            row={row}
            variants={variants || []}
            onVariantChange={onVariantChange}
            onRemove={rows.length > 1 ? onRemoveRow : undefined}
            /* pricing (per-row) */
            MRP={row.MRP}
            setMRP={(v) => onPriceChange(idx, { field: "MRP", value: v })}
            SP={row.SP}
            setSP={(v) => onPriceChange(idx, { field: "SP", value: v })}
            totalStocks={row.totalStocks}
            setTotalStocks={(v) => onPriceChange(idx, { field: "totalStocks", value: v })}
            discountPct={row.discountPct || 0}
            /* images (per-row) */
            thumbFile={row.thumbFile}
            onThumbChange={(e) => onThumbChange(idx, e)}
            galleryFiles={row.galleryFiles}
            onGalleryChange={(imageIdx, e) => onGalleryChange(idx, imageIdx, e)}
            clearGalleryAt={(imageIdx) => onClearGalleryAt(idx, imageIdx)}
            uploadKey={row.uploadKey}
          />
        ))}
      </div>

      {/* Add Variant Button at bottom */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 shadow"
        >
          <Plus size={18} /> Add Variant
        </button>
      </div>
    </div>
  );
};

export default VariantList;
