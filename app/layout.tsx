import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grocery Optimizer - Smart Shopping Made Simple",
  description: "Compare prices across multiple stores and find the best deals for your grocery list",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
          {children}
        </div>
      </body>
    </html>
  );
}
