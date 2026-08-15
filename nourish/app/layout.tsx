import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nourish — Your cycle is unique. Your wellness should be too.",
  description:
    "An AI-powered wellness companion that learns your patterns and helps you move, eat, recover, and feel better throughout your month.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
