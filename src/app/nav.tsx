'use client';

import Link from "next/link";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function Navigation() {
  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">Saber</Link>
      <div className="nav-right">
        <ThemeSwitcher />
        <ul className="nav-links">
          <li><a href="#hero" className="nav-link">// home</a></li>
          <li><a href="#skills" className="nav-link">// expertise</a></li>
          <li><a href="#projects" className="nav-link">// experience</a></li>
          <li><a href="#about" className="nav-link">// about</a></li>
        </ul>
      </div>
    </nav>
  );
}
