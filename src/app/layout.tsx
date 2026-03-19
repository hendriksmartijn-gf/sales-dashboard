import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Goldfizh Sales",
  description: "Intern sales platform voor Goldfizh",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={`${geist.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-[#0a0a0a] text-white">{children}</body>
    </html>
  );
}
