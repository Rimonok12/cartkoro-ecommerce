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

  // ---------- User State ----------
  const [userData, setUserData] = useState(initialUserData);
  const [cartData, setCartData] = useState(initialCartData || { items: [] });
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
        quantity: updated.items[index].quantity + qty,
      };
    } else {
      updated.items.push({ sku_id: itemId, quantity: qty });
    }

    setCartData(updated);
  };

  const updateCartQuantity = (itemId, quantity) => {
    const updated = { ...cartData, items: [...cartData.items] };
    const index = updated.items.findIndex((item) => item.sku_id === itemId);

    if (index >= 0) {
      if (quantity <= 0) {
        updated.items.splice(index, 1);
      } else {
        updated.items[index] = { ...updated.items[index], quantity };
      }
    }

    setCartData(updated);
  };

  const getCartCount = () => {
    if (!cartData?.items) return 0;
    return cartData.items.length;
  };

  // ---------- Context Value ----------
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
