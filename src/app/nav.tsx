'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`nav ${isScrolled ? "nav-scrolled" : ""}`}>
      <Link href="/" className="nav-brand">Saber</Link>
      <ul className="nav-links">
        <li><a href="#hero" className="nav-link">// home</a></li>
        <li><a href="#experience" className="nav-link">// experience</a></li>
        <li><a href="#projects" className="nav-link">// work</a></li>
        <li><a href="#skills" className="nav-link">// skills</a></li>
        <li><a href="#about" className="nav-link">// about</a></li>
      </ul>
    </nav>
  );
}
