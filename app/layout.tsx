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

const metadata: Metadata = {
  title: "Job Tracker - AI_Powered Application Manager",
  description: "Track your jobapplications with AI assistance",
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

export { metadata };
export default RootLayout;
