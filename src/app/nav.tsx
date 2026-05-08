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
      <Link href="/" className="nav-brand">Saber</Link>
      <ul className="nav-links">
        <li><Link href="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>Work</Link></li>
        <li><Link href="/about" className={`nav-link ${isActive("/about") ? "active" : ""}`}>About</Link></li>
        <li>
          <a
            href="/resume.pdf"
            className="nav-link"
          >
            Resume
          </a>
        </li>
      </ul>
    </nav>
  );
}
