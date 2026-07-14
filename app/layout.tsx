import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kausap — Tagalog voice practice",
  description: "Real-time Tagalog conversation practice for heritage speakers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/10">
          <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              🗣️ Kausap
            </Link>
            <div className="flex gap-5 text-sm">
              <Link href="/" className="hover:text-accent">
                Practice
              </Link>
              <Link href="/sessions" className="hover:text-accent">
                Sessions
              </Link>
              <Link href="/vocab" className="hover:text-accent">
                Vocab
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        <footer className="mx-auto w-full max-w-3xl px-4 py-4 text-xs opacity-50">
          Kausap — usap tayo. Personal Tagalog practice.
        </footer>
      </body>
    </html>
  );
}
