'use client'
import Navbar from '@/components/seller/Navbar';
import Sidebar from '@/components/seller/Sidebar';
import Footer from "@/components/seller/Footer";
import React from 'react'

const Layout = ({ children }) => {
  return (
    <div>
      <Navbar />
      <div className='flex w-full'>
        <Sidebar />
        {children}
      </div>
    </div>
  )
}

export default Layout