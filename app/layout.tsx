import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "Rift helps founders discover business opportunities from real customer complaints.";

export const metadata: Metadata = {
  title: {
    default: "Rift — Opportunity Intelligence Platform",
    template: "%s · Rift",
  },
  description,
  openGraph: {
    title: "Rift — Opportunity Intelligence Platform",
    description,
    siteName: "Rift",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rift — Opportunity Intelligence Platform",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}