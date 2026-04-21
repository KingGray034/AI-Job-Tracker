import type { Metadata } from "next";
import { Public_Sans, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Job Tracker - AI-Powered Application Manager",
  description: "Track your job applications with AI assistance",
  manifest: "/manifest.json",
  themeColor: "#ec5b13",
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${publicSans.variable} ${lora.variable} font-sans bg-background-light min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;