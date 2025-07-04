import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Unconfigure - Reorder it",
  description: "A game where you guess the correct order of items",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon_192.png" />
        <meta name="theme-color" content="#121413" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body className="antialiased overflow-auto h-[100svh]">
        <div className="flex flex-col px-4">{children}</div>
      </body>
    </html>
  );
}
