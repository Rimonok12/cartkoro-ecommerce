// import { createContext, useContext, useState, useEffect } from 'react';

// const AppContext = createContext();

// export function AppContextProvider({ children }) {
//   const [userName, setUserName] = useState(null);

//   // Load from localStorage on first render
//   useEffect(() => {
//     const storedName = localStorage.getItem('userName');
//     if (storedName) {
//       setUserName(storedName);
//     }
//   }, []);

//   // Save to localStorage whenever userName changes
//   useEffect(() => {
//     if (userName) {
//       localStorage.setItem('userName', userName);
//     } else {
//       localStorage.removeItem('userName');
//     }
//   }, [userName]);

//   // Login = set username
//   const login = (name) => setUserName(name);

//   // Logout = clear username
//   const logout = () => setUserName(null);

//   return (
//     <AppContext.Provider value={{ userName, login, logout }}>
//       {children}
//     </AppContext.Provider>
//   );
// }

// export const useAppContext = () => useContext(AppContext);






'use client'

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productsDummyData, userDummyData } from "@/assets/assets";

export const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const router = useRouter();
  const currency = process.env.NEXT_PUBLIC_CURRENCY;

  // ---------- User Name / Login-Logout ----------
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);
  }, []);

  useEffect(() => {
    console.log("in context userName:", userName)
    if (userName) {
      localStorage.setItem('userName', userName);
    } else {
      localStorage.removeItem('userName');
    }
  }, [userName]);

  const login = (name) => setUserName(name);
  const logout = () => setUserName(null);

  // ---------- E-commerce Data ----------
  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(false);
  const [isSeller, setIsSeller] = useState(true);
  const [cartItems, setCartItems] = useState({});

  const fetchProductData = async () => setProducts(productsDummyData);
  const fetchUserData = async () => setUserData(userDummyData);

  const addToCart = (itemId) => {
    const cartData = structuredClone(cartItems);
    cartData[itemId] = (cartData[itemId] || 0) + 1;
    setCartItems(cartData);
  };

  const updateCartQuantity = (itemId, quantity) => {
    const cartData = structuredClone(cartItems);
    if (quantity === 0) {
      delete cartData[itemId];
    } else {
      cartData[itemId] = quantity;
    }
    setCartItems(cartData);
  };

  const getCartCount = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  };

  const getCartAmount = () => {
    let total = 0;
    for (const itemId in cartItems) {
      const product = products.find((p) => p._id === itemId);
      if (product) total += product.offerPrice * cartItems[itemId];
    }
    return Math.floor(total * 100) / 100;
  };

  // Fetch initial data
  useEffect(() => { fetchProductData(); }, []);
  useEffect(() => { fetchUserData(); }, []);

  // ---------- Context Value ----------
  const value = {
    // Login/User
    userName, login, logout,

    // E-commerce
    currency, router,
    products, fetchProductData,
    userData, fetchUserData,
    isSeller, setIsSeller,
    cartItems, setCartItems,
    addToCart, updateCartQuantity,
    getCartCount, getCartAmount
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};





