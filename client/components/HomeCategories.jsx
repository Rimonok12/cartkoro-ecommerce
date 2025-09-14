"use client";
import React, { useEffect, useState } from "react";
import CategoryCard from "./CategoryCard";

export default function HomeCategories() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/product/getHomeCategories");
        const data = await res.json();
        setParents(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("getHomeCategories:", e);
        setParents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="w-full pt-10">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 space-y-6">
          {Array.from({ length: 2 }).map((_, s) => (
            <div key={s} className="relative rounded-3xl overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-b from-orange-50 via-orange-50/60 to-transparent"
              />
              <div className="relative p-5 sm:p-7 text-center">
                <div className="h-6 w-56 mx-auto rounded-full bg-gray-200 animate-pulse" />
                <div className="mt-5 flex flex-wrap justify-center gap-5">
                  {Array.from({ length: 5 }).map((__, i) => (
                    <div
                      key={i}
                      className="h-48 w-[200px] rounded-2xl bg-white/70 ring-1 ring-black/5 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!parents.length) return null;

  return (
    <section className="w-full pt-10">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 space-y-10">
        {parents.map((parent) => {
          const kids = (parent?.children || []).filter(
            (c) => c?.thumbnail_img && c?.name
          );
          if (!kids.length) return null;

          return (
            <div
              key={parent._id}
              className="relative rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-sm"
            >
              {/* 🔸 Centered orange gradient background */}
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,115,0,0.15),rgba(255,237,213,0.4),transparent_80%)]"
              />

              <div className="relative p-5 sm:p-7 text-center">
                {/* Heading */}
                <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-gray-900">
                  Popular{" "}
                  <span className="text-orange-600">{parent.name}</span>{" "}
                  Categories
                </h2>

                {/* Cards layout */}
                <div className="mt-6 flex flex-wrap justify-center gap-5">
                  {kids.map((c) => (
                    <div
                      key={c._id}
                      className="w-[200px] sm:w-[220px] flex-shrink-0"
                    >
                      <CategoryCard category={c} fluid />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
