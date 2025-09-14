import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "@/context/AuthContext";
import Header from "@/components/Header"; // We are using the new Header component

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
          {/* This renders the header on every page */}
          <Header />
          {/* Your page content will be displayed here */}
          <main className="p-4">{children}</main>
        </AuthContextProvider>
      </body>
    </html>
  );
}
