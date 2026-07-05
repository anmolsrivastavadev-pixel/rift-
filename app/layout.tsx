import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const title = "Rift — Turn complaints into business ideas";
const description =
  "Type a market or paste real complaints. Rift finds repeated problems and turns them into ideas you can compare.";

export const metadata: Metadata = {
  // Reuses the canonical app origin so OG images and sitemap URLs absolutize
  // to the deployed domain on Vercel without a separate env var.
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: {
    default: title,
    template: "%s · Rift",
  },
  description,
  openGraph: {
    title,
    description,
    siteName: "Rift",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
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
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
