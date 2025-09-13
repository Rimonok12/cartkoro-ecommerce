import React, { useEffect, useState } from "react";
import CategoryCard from "./CategoryCard";
import { useRouter } from "next/router";

const HomeCategories = () => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`/api/product/getHomeCategories`);
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="w-full pt-14">
      {/* page padding stays even on both sides */}
      <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
      <h1 className="md:text-4xl text-2xl font-medium text-center text-orange-600 ">
        Popular Categories
      </h1>

        {/* FLEX version, premium spacing & clear separation */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 sm:gap-8">
          {categories?.map((category, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full pl-12 sm:w-[48%] md:w-[31%] lg:w-[23%] xl:w-[18%] max-w-sm"
            >
              <CategoryCard category={category} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeCategories;




