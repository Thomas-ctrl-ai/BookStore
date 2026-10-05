import type { Metadata } from "next";
import { StoreProvider } from "@/components/store-provider";
import "./globals.css";

export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), title: { default: "P&K Book Store — Books, learning, and more", template: "%s | P&K Book Store" }, description: "A Myanmar bookstore for young learners, English skills, exam preparation, and more. Find your next book or request a print quote.", openGraph: { title: "P&K Book Store", description: "Books, learning, and more.", images: ["/pnk-bookstore-logo.jpg"] } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><StoreProvider>{children}</StoreProvider></body></html>; }
