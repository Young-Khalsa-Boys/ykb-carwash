import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YKB Car Wash Booking",
  description: "Simple booking for YKB Car Wash event",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Script
          src="https://widgets.givebutter.com/latest.umd.cjs?acct=TkUJ8X9QfqsbXiJL"
          strategy="afterInteractive"
        />
        <Analytics />
      </body>
    </html>
  );
}
