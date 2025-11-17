import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "El Dorado - Archaeological Map Management",
  description: "Manage archaeological sites, findings, and points of interest on interactive maps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
