import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="nav">
          <Link href="/" className="nav-brand">Sab's Blog</Link>
          <ul className="nav-links">
            <li><Link href="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>Home</Link></li>
            <li><Link href="/blog" className={`nav-link ${isActive("/blog") ? "active" : ""}`}>Articles</Link></li>
            <li><Link href="/projects" className={`nav-link ${isActive("/projects") ? "active" : ""}`}>Projects</Link></li>
            <li><Link href="/" className="nav-link">Contact</Link></li>
            <li>
              <a
                href="https://github.com/ss889"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
        {children}
        <footer className="footer">
          Built with Next.js &amp; deployed on GitHub Pages
        </footer>
      </body>
    </html>
  );
}