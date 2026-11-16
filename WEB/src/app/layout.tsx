import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { getContent } from "@/lib/content";
import { themeBoot } from "@/lib/theme-boot";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const wide = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const serif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Al Safr — Complete Holiday Packages",
  description: "All-inclusive holiday packages: flights, stays, transfers and experiences, handled end to end.",
};

// the public site's chrome lives in (site)/layout.tsx; /admin has its own
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { display } = await getContent();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} ${wide.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot(display) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
