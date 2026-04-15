import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Layers } from "lucide-react";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TipStack — Curated AI Workflow Tips",
  description:
    "Actionable AI workflow tips, tool updates, and best practices curated from YouTube and Reddit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#EDF2EC] text-[#1A1A2E] font-sans dark:bg-[#161B16] dark:text-[#EDF2EC]">
        <header className="sticky top-0 z-40 bg-[#EDF2EC]/90 backdrop-blur-sm dark:bg-[#161B16]/90">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2D2D3F] dark:bg-[#EDF2EC]">
                <Layers className="h-4 w-4 text-white dark:text-[#161B16]" />
              </div>
              <span className="text-lg font-bold tracking-tight font-heading">
                TipStack
              </span>
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
