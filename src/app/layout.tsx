import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "./nav";
import { ChatProvider } from "@/lib/ChatContext";
import ChatLayoutWrapper from "./ChatLayoutWrapper";
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
  title: "Saber's Blog — Developer Portfolio",
  description: "Software developer portfolio and blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ChatProvider>
          <Navigation />
          {children}
          <ChatLayoutWrapper />
          <footer className="footer">
            Built with Next.js &amp; deployed on GitHub Pages
          </footer>
        </ChatProvider>
      </body>
    </html>
  );
}