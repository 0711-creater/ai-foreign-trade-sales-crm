import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "MirrorPro Supply | Custom Mirror Manufacturer",
  description:
    "B2B mirror manufacturer for LED makeup mirrors, travel mirrors, compact mirrors, wall mirrors and custom promotional mirrors.",
  keywords: [
    "B2B mirror manufacturer",
    "custom mirror supplier",
    "OEM makeup mirror",
    "ODM mirror factory",
    "wholesale compact mirror",
    "promotional gift mirror"
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
