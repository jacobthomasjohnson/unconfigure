"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function Header({ currentDate = null }) {
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
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
        className="fixed z-[1000] top-0 left-1/2 -translate-x-1/2 flex flex-col justify-center w-full max-w-md mx-auto p-4 lg:px-0 py-6 pb-3"
        style={{
          backgroundImage: `linear-gradient(to bottom, #161616 0%, #161616 70%, rgba(16,16,16,0) 100%)`,
        }}
      >
        <h1 className="tracking-tighter font-black flex items-center justify-between w-full">
          <Image
            src="/logo_white.svg"
            alt="Unconfigure"
            width={621}
            height={67}
            className={`w-full`}
          />

        </h1>
      </header>
      <div style={{ height: headerHeight + "px" }} />
    </>
  );
}
