"use client";
import React from "react";
import { Plus } from "lucide-react";
import VariantBox from "@/components/product/VariantBox";

/**
 * Renders VariantBox rows even if `variants` is empty.
 * When there are no variants, the selectors section in VariantBox is simply not shown,
 * but MRP/SP/Stock + images remain available per row.
 */
const VariantList = ({
  variants,
  rows,
  onVariantChange,     // (rowIdx, variantId, value)
  onPriceChange,       // (rowIdx, { field: "MRP"|"SP"|"totalStocks", value })
  onThumbChange,       // (rowIdx, e)
  onGalleryChange,     // (rowIdx, imageIdx, e)
  onClearGalleryAt,    // (rowIdx, imageIdx)
  onAddRow,            // ()
  onRemoveRow,         // (rowIdx)
}) => {
  // NOTE: Do NOT early-return when variants is empty.
  // We still want to show the rows so users can input price/images etc.
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Variant Details</h2>
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-2 text-blue-600 hover:underline"
        >
          <Plus size={18} /> Add Variant
        </button>
      </div>

      <div className="space-y-4">
        {rows.map((row, idx) => (
          <VariantBox
            key={idx}
            rowIndex={idx}
            row={row}
            variants={variants || []} // empty → no selectors, rest of the box still shows
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
    </div>
  );
};

export default VariantList;
