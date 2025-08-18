"use client";
import React from "react";

const PriceInputs = ({ MRP, setMRP, SP, setSP, totalStocks, setTotalStocks, discountPct }) => (
  <div className="flex gap-5 flex-wrap items-end">
    <div className="flex flex-col gap-1 w-40">
      <label className="text-sm font-medium">MRP</label>
      <input
        type="number"
        step="0.01"
        min="0"
        className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
        onChange={(e) => setMRP(e.target.value)}
        value={MRP}
        required
      />
    </div>
    <div className="flex flex-col gap-1 w-40">
      <label className="text-sm font-medium">Selling Price</label>
      <input
        type="number"
        step="0.01"
        min="0"
        className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
        onChange={(e) => setSP(e.target.value)}
        value={SP}
        required
      />
    </div>
    <div className="flex flex-col gap-1 w-40">
      <label className="text-sm font-medium">Total Stocks</label>
      <input
        type="number"
        step="1"
        min="0"
        className="outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-gray-500"
        onChange={(e) => setTotalStocks(e.target.value)}
        value={totalStocks}
        required
      />
    </div>
    {discountPct > 0 && (
      <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
        {discountPct}% off
      </div>
    )}
  </div>
);

export default PriceInputs;
