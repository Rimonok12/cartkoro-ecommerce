import React from "react";
import { assets } from "../../assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/router";

const Navbar = () => {
  const router = useRouter();

  return (
    <div className="flex items-center px-4 md:px-8 py-3 justify-between border-b">
      <Image
        onClick={() => router.push("/")}
        className="w-28 lg:w-32 cursor-pointer"
        src="/1.png"
        width={300}
        height={300}
        alt="logo"
      />
    </div>
  );
};

export default Navbar;
