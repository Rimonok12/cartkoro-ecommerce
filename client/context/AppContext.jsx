// context/AppContext.jsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { setLogoutCallback } from "@/lib/axios";

export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({
  children,
  initialUserData = {},
  initialCartData = { items: [] },
  initialCashbackData = {},
}) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY;

  // 🔹 Parse cart if it arrived as JSON string from SSR
  const parsedInitialCart =
    typeof initialCartData === "string"
      ? (() => { try { return JSON.parse(initialCartData); } catch { return { items: [] }; } })()
      : (initialCartData || { items: [] });

  // ---------- User State ----------
  const [userData, setUserData] = useState(initialUserData);
  const [cartData, setCartData] = useState(parsedInitialCart);
  const [cashbackData, setCashbackData] = useState(initialCashbackData);

  // ---------- Logout ----------
  const logoutContext = () => {
    setUserData({});
    setCartData({ items: [] });
    setCashbackData({});
  };

  // Inject logoutContext into Axios once
  useEffect(() => {
    setLogoutCallback(logoutContext);
  }, []);

  // ---------- Cart Helpers ----------
  const addToCart = (itemId, qty = 1) => {
    const updated = { ...cartData, items: [...(cartData.items || [])] };
    const index = updated.items.findIndex((item) => item.sku_id === itemId);

    if (index >= 0) {
      updated.items[index] = {
        ...updated.items[index],
        quantity: (Number(updated.items[index].quantity) || 0) + (Number(qty) || 1),
      };
    } else {
      updated.items.push({ sku_id: itemId, quantity: Number(qty) || 1 });
    }

    setCartData(updated);
  };

  const updateCartQuantity = (itemId, quantity) => {
    const updated = { ...cartData, items: [...(cartData.items || [])] };
    const index = updated.items.findIndex((item) => item.sku_id === itemId);

    if (index >= 0) {
      const q = Number(quantity) || 0;
      if (q <= 0) {
        updated.items.splice(index, 1);
      } else {
        updated.items[index] = { ...updated.items[index], quantity: q };
      }
    }

    setCartData(updated);
  };

  const getCartCount = () => Array.isArray(cartData?.items) ? cartData.items.length : 0;

  const value = {
    // User
    userData,
    setUserData,
    logoutContext,

    // Cart
    cartData,
    setCartData,
    addToCart,
    updateCartQuantity,
    getCartCount,

    // Cashback
    cashbackData,
    setCashbackData,

    // Global
    currency,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
