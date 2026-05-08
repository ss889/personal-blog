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
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4">Projects</p>
        <h2 className="text-4xl font-bold text-white mb-2">Featured work</h2>
        <p className="text-lg text-indigo-400 mb-12">AI systems and tools in production</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="group relative rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:bg-slate-800/40 overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-400 to-cyan-500 opacity-80"></div>
            
            <div className="flex justify-between items-start mb-6 gap-2">
              <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs font-bold text-emerald-400">
                <span>Claude API</span>
                <span>Web Search</span>
                <span>Next.js</span>
                <span>TypeScript</span>
              </div>
              <a 
                href="https://cockpit-cnd0chh2l-ss889s-projects.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="shrink-0 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-800/60 transition-colors"
              >
                Live
              </a>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-4">AI Career Intelligence Cockpit</h3>
            <p className="text-[15px] text-slate-300 leading-relaxed">
              A sidebar-driven operator dashboard with three panels: Analyze (job descriptions with Claude), Search (live job listings via Claude web search), and Tracker (saved jobs with status management).
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:bg-slate-800/40 overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-400 to-cyan-500 opacity-80"></div>
            
            <div className="flex justify-between items-start mb-6 gap-2">
              <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs font-bold text-emerald-400">
                <span>MCP</span>
                <span>Claude API</span>
                <span>TypeScript</span>
                <span>GitHub Actions</span>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-900/30 text-amber-500 border border-amber-500/30">
                In Progress
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-4">Agentic Blog Platform</h3>
            <p className="text-[15px] text-slate-300 leading-relaxed">
              A voice and chat-controlled blog editor using Model Context Protocol. Manages content, automates design changes, and deploys to GitHub Pages in approximately 2 minutes from command to live site. Integrates...
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:bg-slate-800/40 overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-400 to-cyan-500 opacity-80"></div>
            
            <div className="flex justify-between items-start mb-6 gap-2">
              <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs font-bold text-emerald-400">
                <span>Python</span>
                <span>LangChain</span>
                <span>Groq API</span>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                Completed
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-4">Research Assistant Chatbot</h3>
            <p className="text-[15px] text-slate-300 leading-relaxed">
              A domain-specific research assistant built on LangChain that maintains conversational context across multi-turn queries. Implements prompt engineering and tool chaining to answer questions about quantum...
            </p>
          </div>

          {/* Card 4 */}
          <div className="group relative rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:bg-slate-800/40 overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-400 to-cyan-500 opacity-80"></div>
            
            <div className="flex justify-between items-start mb-6 gap-2">
              <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs font-bold text-emerald-400">
                <span>Python</span>
                <span>SQLite</span>
                <span>Docker</span>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-900/30 text-amber-500 border border-amber-500/30">
                In Progress
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-4">AI Funding Data Scraper</h3>
            <p className="text-[15px] text-slate-300 leading-relaxed">
              Automated scraper that extracts structured startup funding data from AlleyWatch — company, amount, investors, dates — into a persistent SQLite store with deduplication, historical tracking, and Docker deployment.
            </p>
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
