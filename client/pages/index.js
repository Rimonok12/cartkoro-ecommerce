"use client";
import React, { useContext } from "react";
import HeaderSlider from "@/components/HeaderSlider";
import HomeCategories from "@/components/HomeCategories";
import Banner from "@/components/Banner";
import NewsLetter from "@/components/NewsLetter";
import FeaturedProduct from "@/components/FeaturedProduct";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { essentialsOnLoad } from "@/lib/ssrHelper";
import { useAppContext } from "@/context/AppContext";


export async function getServerSideProps(context) {
  const essentials = await essentialsOnLoad(context);
  const EMAILJS_SERVICE_ID=process.env.EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID=process.env.EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY=process.env.EMAILJS_PUBLIC_KEY;
  return {
    props: {
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      EMAILJS_PUBLIC_KEY,
      ...essentials.props,
    },
  };
}

const Home = ({EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,EMAILJS_PUBLIC_KEY}) => {
  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32">
        <HeaderSlider/>
        <HomeCategories />
        {/* <FeaturedProduct /> */}
        {/* <Banner /> */}
        <NewsLetter 
          EMAILJS_SERVICE_ID={EMAILJS_SERVICE_ID}
          EMAILJS_TEMPLATE_ID={EMAILJS_TEMPLATE_ID}
          EMAILJS_PUBLIC_KEY={EMAILJS_PUBLIC_KEY}
        />
      </div>
      <Footer />
    </>
  );
};

export default Home;
