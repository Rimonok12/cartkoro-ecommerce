import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";

const CategoryCard = ({ category }) => {
  const { currency } = useAppContext();

  return (
    <>
      {category.thumbnail_img && (
        <Link
          href={`/all-products?categoryId=${category._id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center cursor-pointer 
                 rounded-2xl bg-white shadow-sm 
                 transition duration-300 p-3 w-[200px] md:w-[220px]"
        >
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={category.thumbnail_img}
              alt={category.name}
              className="object-cover w-full h-full transform 
                       hover:scale-105 transition duration-500"
              width={400}
              height={400}
            />
          </div>

          {/* Name */}
          <p className="mt-3 text-center text-base font-medium text-gray-800 truncate w-full">
            {category.name}
          </p>
        </Link>
      )}
    </>
  );
};

export default CategoryCard;
