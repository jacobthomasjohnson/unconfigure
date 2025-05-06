import "./globals.css";

export const metadata = {
  title: "Unconfigure - Reorder it",
  description: "A game where you guess the correct order of items",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased px-4 overflow-hidden h-[100svh]`}>
        {children}
      </body>
    </html>
  );
}
