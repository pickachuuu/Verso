// app/layout.tsx or app/layout.ts (Next.js App Router)

import type { Metadata } from "next";
import { Geist, Geist_Mono, Just_Another_Hand, Varela_Round } from "next/font/google";
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

// Metadata
export const metadata: Metadata = {
  title: "MemoForge - Smart Learning Platform",
  description: "Organize your learning with notes and flashcards",
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
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${justAnotherHand.variable} ${varelaRound.variable} antialiased`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
