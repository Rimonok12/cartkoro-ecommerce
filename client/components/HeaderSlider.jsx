"use client";

import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

const HeaderSlider = () => {
  const {currency, userName}=useAppContext();
  const sliderData = [
    {
      id: 1,
      title: (
        <>
          Special Puja Offers! <br /> Celebrate Puja with Exciting Special
          Discounts!
        </>
      ),
      offer: "Limited Time Offer 70% Off",
      buttonText1: "Explore Best Deal",
      buttonHref1: "/all-products",
      imgSrc: "/f5.png",
      width: 1200,
      height: 800,
      alt: "Durga Puja festive banner",
    },
    {
      id: 2,
      title: (
        <>
          Sign Up Today & Get{"  "}
          <span className="text-green-600 font-bold">
            {currency}50 Instant Bonus 🎉
          </span>
        </>
      ),
      offer: "Limited Time — Don’t Miss Out!",
      buttonText1: "Grab Your Bonus",
     buttonHref1: userName
        ? "/rewards"
        : "/login?redirect=rewards",
      imgSrc: "/g1.png",
      width: 1200,
      height: 800,
      alt: "Sign up bonus festive banner",
    },
    {
      id: 3,
      title: (
        <>
          Get All Products in One Platform <br /> Shop Smart, Save Big, Live
          Better ✨
        </>
      ),
      offer: "Exclusive Mega Deal — Up to 90% Off!",
      buttonText1: "Start Shopping",
      buttonHref1: "/all-products",
      imgSrc: "/g2.png",
      width: 1200,
      height: 800,
      alt: "All products one platform promotional banner",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 4000); // 3 seconds
    return () => clearInterval(interval);
  }, [sliderData.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  // Framer Motion Variants
  const textVariant = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  const imageVariant = {
    hidden: { opacity: 0, scale: 0.96 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const primaryBtnVariant = {
    initial: { y: 0, scale: 1, boxShadow: "0px 0px 0px rgba(0,0,0,0)" },
    hover: {
      y: -2,
      scale: 1.05,
      boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
      transition: { type: "spring", stiffness: 400, damping: 20 },
    },
    tap: { scale: 0.97, y: 0 },
    pulse: {
      boxShadow: [
        "0 0 0 rgba(0,0,0,0)",
        "0 8px 18px rgba(0,0,0,0.12)",
        "0 0 0 rgba(0,0,0,0)",
      ],
      transition: { duration: 2, repeat: Infinity },
    },
  };

  const ghostBtnVariant = {
    initial: { y: 0, scale: 1 },
    hover: {
      y: -1,
      scale: 1.02,
      transition: { type: "spring", stiffness: 400, damping: 20 },
    },
    tap: { scale: 0.98, y: 0 },
  };

  return (
    <div className="overflow-hidden relative w-full">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        {sliderData.map((slide, index) => (
          <div
            key={slide.id}
            className={`flex flex-col-reverse md:flex-row items-center justify-between              
              py-8 md:px-14 px-5 mt-6 rounded-xl min-w-full
              ${
                slide.id === 1
                  ? "bg-[#FEFDF3]"
                  : slide.id === 2
                  ? "bg-[#DBE4C9]"
                  : "bg-[rgba(215,215,215,0.29)]"
              }`}
          >
            {/* Left Text */}
            <motion.div
              className="md:pl-8 mt-10 md:mt-0"
              variants={textVariant}
              initial="hidden"
              animate="show"
              key={`txt-${slide.id}-${currentSlide === index}`}
            >
              <p className="md:text-base text-orange-600 pb-1">{slide.offer}</p>
              <h1 className="max-w-lg md:text-[40px] md:leading-[48px] text-2xl font-semibold">
                {slide.title}
              </h1>

              <div className="flex items-center mt-4 md:mt-6 gap-3">
                {/* Primary CTA */}
                <Link href={slide.buttonHref1} aria-label={slide.buttonText1}>
                  <motion.button
                    variants={primaryBtnVariant}
                    initial="initial"
                    animate="pulse"
                    whileHover="hover"
                    whileTap="tap"
                    className="md:px-10 px-7 md:py-2.5 py-2 bg-orange-600 rounded-full text-white font-medium shadow-sm"
                  >
                    {slide.buttonText1}
                  </motion.button>
                </Link>

              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              className="flex items-center flex-1 justify-center"
              variants={imageVariant}
              initial="hidden"
              animate="show"
              key={`img-${slide.id}-${currentSlide === index}`}
            >
              <Image
                className="md:w-72 w-48 h-auto"
                src={slide.imgSrc}
                alt={slide.alt ?? `Slide ${index + 1}`}
                width={slide.width ?? 800}
                height={slide.height ?? 600}
                priority={index === 0}
              />
            </motion.div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {sliderData.map((_, index) => (
          <motion.div
            key={index}
            onClick={() => handleSlideChange(index)}
            whileHover={{ scale: 1.2 }}
            className={`h-2 w-2 rounded-full cursor-pointer transition ${
              currentSlide === index ? "bg-orange-600" : "bg-gray-500/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeaderSlider;