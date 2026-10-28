import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const wide = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const serif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Al Safr — Complete Holiday Packages",
  description: "All-inclusive holiday packages: flights, stays, transfers and experiences, handled end to end.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} ${wide.variable} antialiased`}>
      <body>
        <Preloader />
        <SmoothScroll />
        <Cursor />
        <Nav />
        {children}
        <Footer />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
