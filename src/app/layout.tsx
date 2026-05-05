import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Bricolage_Grotesque,
  Source_Serif_4,
  JetBrains_Mono,
} from "next/font/google";
import Link from "next/link";
import { getAllCategoryConfigs } from "@/lib/categories";
import { CategorySidebar, MobileTopicDrawer } from "@/components/category-sidebar";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  const categories = getAllCategoryConfigs();

  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#EDF2EC] text-[#1A1A2E] font-sans dark:bg-[#161B16] dark:text-[#EDF2EC]">
        <header className="sticky top-0 z-40 bg-[#EDF2EC]/90 backdrop-blur-sm dark:bg-[#161B16]/90">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center px-5">
            <Link
              href="/"
              className="text-lg font-heading font-bold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] hover:opacity-70 transition-opacity"
            >
              TipStack
            </Link>
            <nav className="ml-8 hidden sm:flex items-center gap-1" aria-label="Main">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-full text-[14px] font-medium text-[#5A5A6E] hover:text-[#1A1A2E] hover:bg-[#dde4db] dark:text-[#A8B0A6] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A] transition-colors duration-150"
              >
                What&apos;s New
              </Link>
              <Link
                href="/timeline"
                className="px-3 py-1.5 rounded-full text-[14px] font-medium text-[#5A5A6E] hover:text-[#1A1A2E] hover:bg-[#dde4db] dark:text-[#A8B0A6] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A] transition-colors duration-150"
              >
                Timeline
              </Link>
            </nav>
            <div className="ml-auto">
              <Suspense>
                <MobileTopicDrawer categories={categories} />
              </Suspense>
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-[1200px] gap-10 px-5">
          <Suspense>
            <CategorySidebar categories={categories} />
          </Suspense>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
