import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Football Predictions",
  description: "Predict football match scores and compete with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-parchment text-near-black font-sans">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border-cream py-6 text-center text-stone text-sm">
          <p>&copy; {new Date().getFullYear()} Football Predictions</p>
        </footer>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
