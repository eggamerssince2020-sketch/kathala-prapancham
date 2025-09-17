// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import { WavyBackground } from "@/components/WavyBackground"; // <-- Import the new component
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kathala Prapancham",
  description: "A world of stories",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthContextProvider>
          {/* WavyBackground wraps all visible content */}
          <WavyBackground 
            className="w-full max-w-7xl mx-auto" 
            backgroundFill="#fefae0" // A beautiful warm cream background
            colors={["#fa9451", "#ffc071", "#ff6b6b", "#e07a5f"]} // Sunset/sunrise colors
            waveOpacity={0.4}
            blur={15}
          >
            <Header />
            <main className="p-4">{children}</main>
          </WavyBackground>
        </AuthContextProvider>
      </body>
    </html>
  );
}
