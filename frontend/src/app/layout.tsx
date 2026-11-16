import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nftix. — Event marketplace & authentic ticketing",
  description: "Curated events, concerts, and cultural moments with anti-scalping price lock and dynamic QR entry.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${jakartaSans.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased bg-[#FAF9F6] text-[#171717] min-h-screen selection:bg-[#FF5A36] selection:text-white">
        {children}
      </body>
    </html>
  );
}
