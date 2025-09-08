// import React, { useEffect, useState } from "react";
// import ProductCard from "./ProductCard";
// import { useAppContext } from "@/context/AppContext";

// const HomeProducts = () => {
//   const { router } = useAppContext();
//   const [products, setProducts] = useState([]);

//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const res = await fetch("/api/product/getAllProducts");
//         const data = await res.json();
//         setProducts(data);
//       } catch (err) {
//         console.error("Failed to fetch products", err);
//       }
//     };

//     fetchProducts();
//   }, []);

//   return (
//     <div className="flex flex-col items-center pt-14">
//       <p className="text-2xl font-medium text-left w-full">Popular products</p>
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-6 pb-14 w-full">
//         {products?.map((product, index) => (
//           <ProductCard key={index} product={product} />
//         ))}
//       </div>
//       <button
//         onClick={() => router.push("/all-products")}
//         className="px-12 py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 transition"
//       >
//         See more
//       </button>
//     </div>
//   );
// };

// export default HomeProducts;

import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

const HomeProducts = () => {
  const app = useAppContext();
  const nextRouter = useRouter();
  const router = app?.router ?? nextRouter; // <-- fallback so push never breaks
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/product/getAllProducts");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchProducts();
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
      <p className="text-2xl font-medium text-left w-full">Popular products</p>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-6 pb-14 w-full"
      >
        {products?.map((product, index) => (
          <motion.div
            key={index}
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push("/all-products")}
        className="px-12 py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 transition"
      >
        See more
      </motion.button>
    </div>
  );
};

export default HomeProducts;
