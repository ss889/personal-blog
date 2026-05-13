import { getAllPosts } from "@/lib/markdown";
import Link from "next/link";
import AnimatedSection from "@/components/AnimatedSection";
import HeroHeading from "@/components/HeroHeading";
import HeroBodyMotion from "@/components/HeroBodyMotion";

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <main>
      <section id="hero" className="hero">
        <p className="hero-label">AVAILABLE FOR OPPORTUNITIES · 2026</p>
        <HeroHeading>
          I build AI systems<br />
          that give people<br />
          back their time.
        </HeroHeading>
        <HeroBodyMotion>
          <p>
            I use AI as a collaborator — not a shortcut — to close the gap between what I can imagine and what I can ship.
          </p>
          <div className="proof-strip">
            <span className="proof-item">3 deployed projects</span>
            <span className="proof-item">NJIT · Graduating May 2026</span>
            <span className="proof-item">Open to FDE & AI Engineer roles</span>
          </div>
          <div className="cta-group">
            <a href="#projects" className="btn-primary">View my work ↓</a>
            <a href="https://github.com/ss889" target="_blank" rel="noopener noreferrer" className="btn-secondary">GitHub ↗</a>
            <a href="https://cockpit-cnd0chh2l-ss889s-projects.vercel.app/" target="_blank" rel="noopener noreferrer" className="btn-secondary">Live: Career Cockpit ↗</a>
          </div>
        </HeroBodyMotion>
      </section>

      <hr />

      <AnimatedSection id="projects">
        <p className="section-label">// WORK</p>
        <h2 className="section-title">Featured projects</h2>
        <div className="projects-grid">
          <a href="https://cockpit-cnd0chh2l-ss889s-projects.vercel.app/" target="_blank" rel="noopener noreferrer" className="project-card">
            <div className="project-image">AI Career Intelligence Cockpit</div>
            <div className="project-body">
              <div className="project-tags">
                <span className="project-tag">Claude API</span>
                <span className="project-tag">Web Search</span>
                <span className="project-tag">Next.js</span>
              </div>
              <h3 className="project-title">AI Career Intelligence Cockpit</h3>
              <p className="project-description">A sidebar-driven operator dashboard with three panels: Analyze job descriptions with Claude, Search live job listings via web search, and Track saved jobs with status management.</p>
              <div className="project-footer">
                <span className="project-status status-live">Live</span>
                <span className="project-link">View →</span>
              </div>
            </div>
          </a>

          <div className="project-card">
            <div className="project-image">Agentic Blog Platform</div>
            <div className="project-body">
              <div className="project-tags">
                <span className="project-tag">MCP</span>
                <span className="project-tag">Claude API</span>
                <span className="project-tag">TypeScript</span>
              </div>
              <h3 className="project-title">Agentic Blog Platform</h3>
              <p className="project-description">A voice and chat-controlled blog editor using Model Context Protocol. Manages content, automates design changes, and deploys to GitHub Pages in approximately 2 minutes from command to live site.</p>
              <div className="project-footer">
                <span className="project-status status-progress">In Progress</span>
                <span className="project-link">View →</span>
              </div>
            </div>
          </div>

          <a href="https://company-jjvx.onrender.com/" target="_blank" rel="noopener noreferrer" className="project-card">
            <div className="project-image">Company Intelligence</div>
            <div className="project-body">
              <div className="project-tags">
                <span className="project-tag">Claude API</span>
                <span className="project-tag">React</span>
                <span className="project-tag">Node.js</span>
              </div>
              <h3 className="project-title">Company Intelligence</h3>
              <p className="project-description">An AI-powered interview prep platform that transforms company research into structured intelligence briefings. Analyzes tech stacks, business models, and industry insights to generate personalized interview guidance.</p>
              <div className="project-footer">
                <span className="project-status status-live">Live</span>
                <span className="project-link">View →</span>
              </div>
            </div>
          </a>

          <div className="project-card">
            <div className="project-image">AI Funding Data Scraper</div>
            <div className="project-body">
              <div className="project-tags">
                <span className="project-tag">Python</span>
                <span className="project-tag">SQLite</span>
                <span className="project-tag">Docker</span>
              </div>
              <h3 className="project-title">AI Funding Data Scraper</h3>
              <p className="project-description">Automated scraper that extracts structured startup funding data from AlleyWatch with deduplication, historical tracking, and Docker deployment for persistent storage.</p>
              <div className="project-footer">
                <span className="project-status status-progress">In Progress</span>
                <span className="project-link">View →</span>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <hr />

      <AnimatedSection id="skills">
        <p className="section-label">// EXPERTISE</p>
        <h2 className="section-title">Expertise</h2>
        <div className="expertise-grid">
          <div className="expertise-card">
            <div className="expertise-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M8 3h8v4H8zM6 9h12v12H6z" />
              </svg>
            </div>
            <h3 className="expertise-title">Software Development</h3>
            <p className="expertise-description">Experienced in both functional and OOP: Dart, Python, Java, JavaScript, TypeScript.</p>
          </div>

          <div className="expertise-card">
            <div className="expertise-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
              </svg>
            </div>
            <h3 className="expertise-title">Frontend Dev React, Next.js</h3>
            <p className="expertise-description">Passionate about UI/UX. Expert in HTML, CSS, JS, React and Next.js frameworks.</p>
          </div>

          <div className="expertise-card">
            <div className="expertise-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M4 16l5-5 4 4 7-7" />
                <path d="M20 10V4h-6" />
              </svg>
            </div>
            <h3 className="expertise-title">AI & Agentic Systems</h3>
            <p className="expertise-description">Skilled in building AI systems, agentic workflows, prompt engineering, and spec-based development using Claude and LangChain.</p>
          </div>
        </div>
      </AnimatedSection>

      <hr />

      <AnimatedSection id="about">
        <p className="section-label">// ABOUT</p>
        <p className="about-header">SADIKUL SABER · NJIT · WEB & INFORMATION SYSTEMS</p>
        <div className="about-content">
          <p>
            I fell in love with web development in my Information Systems classes at NJIT. I still remember being proud of the first site I ever built — but I always had more ideas than I could execute. Debugging took time. Getting things to look right took time.
          </p>
          <p>
            When AI blew up, I built a site that looked miles better than anything I'd made before, in a fraction of the time. That was the moment things clicked. I went deeper into agentic systems, prompt engineering, and spec-based development. Spec-based dev especially changed how I work — you define what you want precisely, and Claude executes it. That loop is what I build around now.
          </p>
          <p>
            What drives me: building things that give people more breathing room. Tools that take the tedious parts off your plate so you can focus on what matters. That's the kind of work I want to keep doing.
          </p>
          <p style={{ marginTop: "1.5rem" }}>
            <Link href="/about">Read more about me →</Link>
          </p>
        </div>
      </AnimatedSection>

      <hr />

      <AnimatedSection id="contact" className="contact-section">
        <p className="section-label">// CONTACT</p>
        <div className="contact-links">
          <a href="https://github.com/ss889" target="_blank" rel="noopener noreferrer" className="contact-link">GitHub ↗</a>
          <a href="https://linkedin.com/in/saber889" target="_blank" rel="noopener noreferrer" className="contact-link">LinkedIn ↗</a>
          <a href="mailto:hi@example.com" className="contact-link">Email ↗</a>
        </div>
        <div className="footer-credit">© 2026 Saber — Built with Next.js</div>
      </AnimatedSection>
    </main>
  );
}
