'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
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
  );
}
