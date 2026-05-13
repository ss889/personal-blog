import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "./nav";
import { ChatProvider } from "@/lib/ChatContext";
import ChatLayoutWrapper from "./ChatLayoutWrapper";
import ScrollAnimationProvider from "./ScrollAnimationProvider";
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
  title: "Saber — AI Systems Builder",
  description: "AI systems builder, MCP developer, and CS student at NJIT",
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
          <ScrollAnimationProvider>
            {children}
          </ScrollAnimationProvider>
          <ChatLayoutWrapper />
          <footer className="footer">
            <div style={{ marginBottom: "1rem" }}>
              <a href="https://github.com/ss889" target="_blank" rel="noopener noreferrer" style={{ marginRight: "2rem" }}>
                GitHub
              </a>
              <a href="https://linkedin.com/in/sadikul-saber" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </div>
            Built with Next.js &amp; deployed on GitHub Pages
          </footer>
        </ChatProvider>
      </body>
    </html>
  );
}