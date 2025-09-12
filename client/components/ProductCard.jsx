import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";

const ProductCard = ({ product }) => {
  const { currency } = useAppContext();

  // calculate discount
  const discount =
    product.mrp && product.mrp > product.selling_price
      ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
      : 0;

  return (
    <Link
      href={product.visitUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-start gap-0.5 max-w-[200px] w-full cursor-pointer"
    >
      <div className="cursor-pointer group relative bg-gray-500/10 rounded-lg w-full h-52 flex items-center justify-center">
        <Image
          src={product.thumbnail_img}
          alt={product.name}
          className="group-hover:scale-105 transition object-cover w-4/5 h-4/5 md:w-full md:h-full"
          width={800}
          height={800}
        />
        {/* <button
          type="button"
          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md"
          onClick={(e) => e.preventDefault()} // prevent navigation when clicking heart
        >
          <Image className="h-3 w-3" src={assets.heart_icon} alt="heart_icon" />
        </button> */}
      </div>

      <p className="md:text-base font-medium pt-2 w-full truncate">
        {product.name}
      </p>
      <p className="w-full text-xs text-gray-500/70 max-sm:hidden truncate">
        {product.category_name}
      </p>

      {/* <div className="flex items-center gap-2">
        <p className="text-xs">{4.5}</p>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Image
              key={index}
              className="h-3 w-3"
              src={
                index < Math.floor(4) ? assets.star_icon : assets.star_dull_icon
              }
              alt="star_icon"
            />
          ))}
        </div>
      </div> */}

      <div className="flex items-end justify-between w-full mt-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <p className="text-base font-medium">
              {currency}
              {product.selling_price}
            </p>
            {product.mrp && product.mrp > product.selling_price && (
              <p className="text-sm text-gray-400 line-through">
                {currency}
                {product.mrp}
              </p>
            )}
          </div>
          {discount > 0 && (
            <p className="text-xs text-green-600 font-medium">
              {discount}% off
            </p>
          )}
        </div>

        <button
          type="button"
          className="max-sm:hidden px-4 py-1.5 text-gray-500 border border-gray-500/20 rounded-full text-xs hover:bg-slate-50 transition"
          onClick={(e) => {
            e.preventDefault(); // prevent card link click
            window.open(product.visitUrl, "_blank");
          }}
        >
          Buy now
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
