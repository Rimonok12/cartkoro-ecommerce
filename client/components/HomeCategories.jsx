import React, { useEffect, useState } from "react";
import CategoryCard from "./CategoryCard";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.05 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 260, damping: 20 },
    },
  };

  return (
    <div className="flex flex-col items-center pt-14">
      <p className="text-2xl font-medium text-left w-full">
        Popular Categories
      </p>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-6 pb-14 w-full"
      >
        {categories?.map((category, index) => (
          <motion.div
            key={index}
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CategoryCard category={category} />
          </motion.div>
        ))}
      </motion.div>

      {/* <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push("/all-products")}
        className="px-12 py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 transition"
      >
        See more
      </motion.button> */}
    </div>
  );
};

export default HomeCategories;
