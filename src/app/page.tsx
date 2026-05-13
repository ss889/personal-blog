import { getAllPosts } from "@/lib/markdown";
import Link from "next/link";

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <main>
      {/* Hero */}
      <section id="hero" className="hero">
        <h1>I build AI systems that give people back their time</h1>
        <p>Intelligent automation, seamless integrations, and tools that work the way you do.</p>
      </section>

      <hr />

      {/* Skills / Expertise */}
      <section id="skills" className="section scroll-animate">
        <h2 className="expertise-title">My Skills</h2>
        
        <div className="expertise-grid">
          {/* Card 1 */}
          <div className="expertise-card scroll-animate">
            <div className="expertise-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="9" x2="27" y2="9"></line>
                <path d="M5,24H27a4,4,0,0,1,4,4V40a4,4,0,0,1-4,4H5a4,4,0,0,1-4-4V28A4,4,0,0,1,5,24Z"></path>
              </svg>
            </div>
            <h3 className="expertise-card-title">
              <span className="expertise-highlight magenta">Software</span><br/>Development
            </h3>
            <p className="expertise-description">
              Experienced in both functional and OOP: Dart, Python, Java, JavaScript, TypeScript.
            </p>
          </div>

          {/* Card 2 */}
          <div className="expertise-card scroll-animate">
            <div className="expertise-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="44.964" viewBox="0 0 40 44.964" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="20" cy="22.5" r="6"></circle>
                <path d="M20,2a20.5,20.5,0,0,1,0,41M2,22.5H40M9,9l7.79,7.79M31,9l-7.79,7.79M9,36l7.79-7.79M31,36l-7.79-7.79"></path>
              </svg>
            </div>
            <h3 className="expertise-card-title">
              <span className="expertise-highlight blue">Frontend Dev</span><br/>React, Next.js
            </h3>
            <p className="expertise-description">
              Passionate about UI/UX. Expert in HTML, CSS, JS, React and Next.js frameworks.
            </p>
          </div>

          {/* Card 3 */}
          <div className="expertise-card scroll-animate">
            <div className="expertise-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="38" height="46.769" viewBox="0 0 38 46.769" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8,32L24,16M24,16l12-12m0,0H24m12,0V16"></path>
                <path d="M30,30l-6,6m-18-6l18-18"></path>
              </svg>
            </div>
            <h3 className="expertise-card-title">
              <span className="expertise-highlight yellow">AI & Agentic</span><br/>Systems
            </h3>
            <p className="expertise-description">
              Skilled in building AI systems, agentic workflows, prompt engineering, and spec-based development using Claude and LangChain.
            </p>
          </div>
        </div>
      </section>

      <hr />

      {/* Projects */}
      <section id="projects" className="section scroll-animate">
        <p className="section-label">0 // Projects</p>
        <h2 className="section-title">Featured work</h2>

        <div className="projects-grid">
          {/* Card 1 */}
          <a
            href="https://cockpit-cnd0chh2l-ss889s-projects.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="project-card project-card-link scroll-animate"
          >
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex flex-wrap gap-2 text-xs font-semibold card-meta">
                <span>Claude API</span>
                <span>Web Search</span>
                <span>Next.js</span>
              </div>
              <span className="text-xs card-meta hover-link transition-colors">
                View →
              </span>
            </div>
            
            <h3 className="project-card-title">AI Career Intelligence Cockpit</h3>
            <p className="project-description">
              A sidebar-driven operator dashboard with three panels: Analyze job descriptions with Claude, Search live job listings via web search, and Track saved jobs with status management.
            </p>
          </a>

          {/* Card 2 */}
          <div className="project-card scroll-animate">
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex flex-wrap gap-2 text-xs font-semibold card-meta">
                <span>MCP</span>
                <span>Claude API</span>
                <span>TypeScript</span>
              </div>
              <span className="text-xs card-meta">
                In Progress
              </span>
            </div>
            
            <h3 className="project-card-title">Agentic Blog Platform</h3>
            <p className="project-description">
              A voice and chat-controlled blog editor using Model Context Protocol. Manages content, automates design changes, and deploys to GitHub Pages in approximately 2 minutes from command to live site.
            </p>
          </div>

          {/* Card 3 */}
          <a
            href="https://company-jjvx.onrender.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="project-card project-card-link scroll-animate"
          >
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex flex-wrap gap-2 text-xs font-semibold card-meta">
                <span>Claude API</span>
                <span>React</span>
                <span>Node.js</span>
              </div>
              <span className="text-xs card-meta hover-link transition-colors">
                View →
              </span>
            </div>
            
            <h3 className="project-card-title">Company Intelligence</h3>
            <p className="project-description">
              An AI-powered interview prep platform that transforms company research into structured intelligence briefings. Analyzes tech stacks, business models, and industry insights to generate personalized interview guidance.
            </p>
          </a>

          {/* Card 4 */}
          <div className="project-card scroll-animate">
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex flex-wrap gap-2 text-xs font-semibold card-meta">
                <span>Python</span>
                <span>SQLite</span>
                <span>Docker</span>
              </div>
              <span className="text-xs card-meta">
                In Progress
              </span>
            </div>
            
            <h3 className="project-card-title">AI Funding Data Scraper</h3>
            <p className="project-description">
              Automated scraper that extracts structured startup funding data from AlleyWatch with deduplication, historical tracking, and Docker deployment for persistent storage.
            </p>
          </div>
        </div>
      </section>

      <hr />

      {/* About */}
      <section id="about" className="section scroll-animate">
        <p className="section-label">0 // About</p>
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
      </section>

      <hr />

      {/* Footer */}
      <footer className="footer">
        <div className="footer-icons">
          <a href="mailto:hi@example.com" className="footer-icon" title="Email">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
          </a>
          <a href="https://github.com/ss889" className="footer-icon" title="GitHub">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 .5 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 -.5-3 1.5-2.64-.5-5.36-.5-8 0-2-2-3-1.5-3-1.5-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 6 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
              <path d="M9 18c-4.51 2-5-2-7-2"></path>
            </svg>
          </a>
          <a href="https://linkedin.com/in/saber889" className="footer-icon" title="LinkedIn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6 z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
          </a>
        </div>
        <div className="footer-credit">© 2026 - Portfolio designed and developed by Saber</div>
      </footer>
    </main>
  );
}
