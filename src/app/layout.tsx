// app/layout.tsx or app/layout.ts (Next.js App Router)

import type { Metadata } from "next";
import { Geist, Geist_Mono, Just_Another_Hand, Varela_Round, Cinzel } from "next/font/google";
import { Cormorant_Garamond } from "next/font/google";
import { QueryProvider } from "@/lib/queryClient";
import "./globals.css";

// Font declarations
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const justAnotherHand = Just_Another_Hand({
  variable: "--font-handwritten",
  subsets: ["latin"],
  weight: "400",
});

const varelaRound = Varela_Round({
  variable: "--font-rounded",
  subsets: ["latin"],
  weight: "400",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Metadata
const ogImage =
  "https://pub-5d0fe94a3da5458ca88e4e79220a6798.r2.dev/Verso/ChatGPT%20Image%20Feb%2012%2C%202026%2C%2012_39_09%20AM.png";

export const metadata: Metadata = {
  title: "Verso - Smart Learning Platform",
  description: "Organize your learning with notes and flashcards",
  openGraph: {
    title: "Verso - Smart Learning Platform",
    description: "Organize your learning with notes and flashcards",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Verso - Smart Learning Platform",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verso - Smart Learning Platform",
    description: "Organize your learning with notes and flashcards",
    images: [ogImage],
  },
};

// Root Layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${justAnotherHand.variable} ${varelaRound.variable} ${cinzel.variable} antialiased`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
