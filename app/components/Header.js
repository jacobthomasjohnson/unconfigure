"use client";

import { useState, useEffect, useRef } from "react";

export default function Header({ currentDate = null }) {
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const dateToUse = currentDate ? new Date(currentDate) : new Date();

  const formattedDate = dateToUse.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    console.log("currentDate in Header:", currentDate);

    if (headerRef.current) {
      const element = headerRef.current;
      const styles = getComputedStyle(element);
      const marginTop = parseFloat(styles.marginTop);
      const marginBottom = parseFloat(styles.marginBottom);
      const totalHeight =
        element.getBoundingClientRect().height + marginTop + marginBottom;
      setHeaderHeight(totalHeight);
    }
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed z-[1000] top-0 left-1/2 -translate-x-1/2 flex flex-col justify-center items-start w-full max-w-md mx-auto p-4 lg:px-0 py-5"
        style={{
          backgroundImage: `linear-gradient(to bottom, #161616 0%, #161616 70%, rgba(16,16,16,0) 100%)`,
        }}
      >
        <h1 className="text-3xl tracking-tight font-black flex items-center justify-between w-full">
          UNCONFIGURE
          <span className="text-neutral-500 font-medium text-sm ml-2">
            {currentDate}
          </span>
        </h1>
      </header>
      <div style={{ height: headerHeight + "px" }} />
    </>
  );
}
