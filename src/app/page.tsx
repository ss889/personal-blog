import { getAllPosts } from "@/lib/markdown";
import Link from "next/link";

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <h1>I build AI systems that do real work</h1>
        <p>Agentic pipelines, operator interfaces, and tooling for the way professionals use AI.</p>
      </section>

      <hr />

      {/* Experience */}
      <section className="section">
        <p className="section-label">Experience</p>
        
        <div className="timeline">
          <div className="timeline-year">2026</div>
          <div className="timeline-item">
            <div className="timeline-role">AI Engineer (Open to opportunities)</div>
            <div className="timeline-company">NJIT · CS Student</div>
          </div>

          <div className="timeline-year">2025</div>
          <div className="timeline-item">
            <div className="timeline-role">Built: Career Intelligence Cockpit</div>
            <div className="timeline-company">Claude API, Web Search, Next.js</div>
          </div>

          <div className="timeline-year">2024</div>
          <div className="timeline-item">
            <div className="timeline-role">Built: AI Blog Platform</div>
            <div className="timeline-company">Model Context Protocol, Claude</div>
          </div>

          <div className="timeline-year">2023</div>
          <div className="timeline-item">
            <div className="timeline-role">Started: AI Systems Learning</div>
            <div className="timeline-company">LangChain, Groq, Agentic Workflows</div>
          </div>
        </div>
      </section>

      <hr />

      {/* Projects */}
      <section className="section">
        <p className="section-label">Projects</p>
        <div className="projects-grid">
          <div className="project-card">
            <h3>Career Intelligence Cockpit</h3>
            <div className="project-meta">Claude API · Web Search · Next.js 16 · TypeScript · 2025</div>
            <p className="project-description">Chat interface for analyzing job descriptions, searching live listings with Claude web search, and tracking saved jobs with status management.</p>
            <div className="project-links">
              <a href="https://github.com/ss889/cockpit">GitHub</a>
              <a href="https://cockpit.vercel.app">Live</a>
            </div>
          </div>

          <div className="project-card">
            <h3>Personal Blog Platform</h3>
            <div className="project-meta">Next.js · React · Markdown · Tailwind · 2025</div>
            <p className="project-description">Minimal portfolio with blog engine, showcasing AI projects and writing on agentic systems, prompt engineering, and spec-based development.</p>
            <div className="project-links">
              <a href="https://github.com/ss889/personal-blog">GitHub</a>
              <a href="https://ss889.github.io/personal-blog">Live</a>
            </div>
          </div>

          <div className="project-card">
            <h3>Research Assistant Chatbot</h3>
            <div className="project-meta">Python · LangChain · Groq API · 2024</div>
            <p className="project-description">Domain-specific research assistant with conversational context, prompt engineering, and multi-turn query handling for technical topics.</p>
            <div className="project-links">
              <a href="https://github.com/ss889/research-assistant">GitHub</a>
            </div>
          </div>

          <div className="project-card">
            <h3>AI Funding Data Scraper</h3>
            <div className="project-meta">Python · SQLite · Docker · 2024</div>
            <p className="project-description">Automated scraper for startup funding data with deduplication, historical tracking, and Docker deployment for persistent data storage.</p>
            <div className="project-links">
              <a href="https://github.com/ss889/ai-funding-scraper">GitHub</a>
            </div>
          </div>
        </div>
      </section>

      <hr />

      {/* Skills */}
      <section className="section">
        <p className="section-label">Skills</p>
        <div className="skills-container">
          <div className="skill-category">
            <h3>AI & Agentic Systems</h3>
            <div className="skill-tags">
              <span className="skill-tag">Claude API</span>
              <span className="skill-tag">Agentic Workflows</span>
              <span className="skill-tag">Web Search</span>
              <span className="skill-tag">Prompt Engineering</span>
              <span className="skill-tag">LangChain</span>
              <span className="skill-tag">Spec-Based Dev</span>
            </div>
          </div>

          <div className="skill-category">
            <h3>Development & Tooling</h3>
            <div className="skill-tags">
              <span className="skill-tag">TypeScript</span>
              <span className="skill-tag">Python</span>
              <span className="skill-tag">Next.js 16</span>
              <span className="skill-tag">React</span>
              <span className="skill-tag">Docker</span>
              <span className="skill-tag">GitHub Actions</span>
              <span className="skill-tag">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </section>

      <hr />

      {/* About */}
      <section className="section">
        <p className="section-label">About</p>
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
        <div className="footer-links">
          <a href="https://github.com/ss889">GitHub</a>
          <a href="https://linkedin.com/in/saber889">LinkedIn</a>
          <a href="mailto:hi@example.com">Email</a>
        </div>
        <div className="footer-credit">Designed + Coded by Saber · 2026</div>
      </footer>
    </main>
  );
}
