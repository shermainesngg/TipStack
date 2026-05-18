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
import { HeaderNav } from "@/components/header-nav";
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
            <HeaderNav />
            <div className="ml-auto">
              <Suspense>
                <MobileTopicDrawer categories={categories} />
              </Suspense>
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-[1200px] gap-10 px-5">
          <Suspense>
            <div className="relative z-30">
              <CategorySidebar categories={categories} />
            </div>
          </Suspense>
          <main className="relative z-0 flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
