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
      <head>
        <style>{`
          :root {
            --canvas-bg: #F7F5EE;
            --surface-white: #FFFFFF;
            --surface-subtle: #F0EDE4;
            --brand-primary: #D94520;
            --brand-hover: #BF3B19;
            --brand-tint: #FBECE7;
            --text-main: #171717;
            --text-muted: #736E65;
            --border-hairline: rgba(0, 0, 0, 0.08);

            --background: #F7F5EE;
            --foreground: #171717;
            --card: #FFFFFF;
            --card-foreground: #171717;
            --popover: #FFFFFF;
            --popover-foreground: #171717;
            --primary: #D94520;
            --primary-foreground: #FFFFFF;
            --secondary: #F0EDE4;
            --secondary-foreground: #171717;
            --muted: #F0EDE4;
            --muted-foreground: #736E65;
            --accent: #FBECE7;
            --accent-foreground: #D94520;
            --border: rgba(0, 0, 0, 0.08);
            --input: rgba(0, 0, 0, 0.08);
            --ring: #D94520;
          }
          body {
            background-color: #F7F5EE !important;
            color: #171717 !important;
            font-feature-settings: "cv02", "cv03", "cv04", "cv11";
          }
          ::selection {
            background-color: #D94520;
            color: #FFFFFF;
          }
        `}</style>
      </head>
      <body className="font-sans antialiased bg-[#F7F5EE] text-[#171717] min-h-screen">
        {children}
      </body>
    </html>
  );
}
