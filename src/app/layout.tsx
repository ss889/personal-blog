import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Navigation from "./nav";
import { ChatProvider } from "@/lib/ChatContext";
import ChatLayoutWrapper from "./ChatLayoutWrapper";
import BackgroundPattern from "@/components/BackgroundPattern";
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

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('portfolio-theme') || 'theme-night';
    document.documentElement.classList.remove('theme-night', 'theme-ink', 'theme-terminal');
    document.documentElement.classList.add(saved);
  } catch (e) {
    document.documentElement.classList.add('theme-night');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <BackgroundPattern />
        <div className="site-shell">
          <ChatProvider>
            <Navigation />
            <ScrollAnimationProvider>
              {children}
            </ScrollAnimationProvider>
            <ChatLayoutWrapper />
          </ChatProvider>
        </div>
      </body>
    </html>
  );
}