"use client";
import React from "react";

const CategorySelector = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  subCategories,
  selectedSubCategory,
  setSelectedSubCategory,
  // NEW: brand props so Brand renders inline with same sizing
  brands = [],
  selectedBrand = "",
  setSelectedBrand = () => {},
}) => (
  <div className="flex gap-5 flex-wrap">
    {/* Category */}
    <div className="flex flex-col gap-1 w-48">
      <label className="text-sm font-medium">Category</label>
      <select
        className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
        onChange={(e) => setSelectedCategory(e.target.value)}
        value={selectedCategory}
      >
        <option value="">Select</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>

    {/* Subcategory */}
    {subCategories.length > 0 && (
      <div className="flex flex-col gap-1 w-48">
        <label className="text-sm font-medium">Subcategory</label>
        <select
          className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
          onChange={(e) => setSelectedSubCategory(e.target.value)}
          value={selectedSubCategory}
        >
          <option value="">Select</option>
          {subCategories.map((sc) => (
            <option key={sc._id} value={sc._id}>
              {sc.name}
            </option>
          ))}
        </select>
      </div>
    )}

    {/* Brand (inline, same compact width) */}
    {brands.length > 0 && (
      <div className="flex flex-col gap-1 w-48">
        <label className="text-sm font-medium">Brand</label>
        <select
          className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          disabled={!brands.length}
          required
        >
          <option value="" disabled>
            Select
          </option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
);

export default CategorySelector;
