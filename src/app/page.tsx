import { getAllPosts } from "@/lib/markdown";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  tags: string[];
  description: string;
  githubUrl: string;
  liveUrl?: string;
  status: "Live" | "In Progress" | "Completed";
}

const PROJECTS: Project[] = [
  {
    id: "cockpit",
    name: "AI Career Intelligence Cockpit",
    tags: ["Claude API", "Web Search", "Next.js", "TypeScript"],
    description: "A sidebar-driven operator dashboard with three panels: Analyze (job descriptions with Claude), Search (live job listings via Claude web search), and Tracker (saved jobs with status management). Built with Next.js 16, Anthropic SDK, and localStorage persistence.",
    githubUrl: "https://github.com/ss889/cockpit",
    liveUrl: "https://cockpit.vercel.app",
    status: "Live",
  },
  {
    id: "blog-platform",
    name: "Agentic Blog Platform",
    tags: ["MCP", "Claude API", "TypeScript", "GitHub Actions"],
    description: "A voice and chat-controlled blog editor using Model Context Protocol. Manages content, automates design changes, and deploys to GitHub Pages in approximately 2 minutes from command to live site. Integrates Claude Desktop and VS Code Copilot for AI-driven content generation.",
    githubUrl: "https://github.com/ss889/agentic-blog-platform",
    status: "In Progress",
  },
  {
    id: "research-assistant",
    name: "Research Assistant Chatbot",
    tags: ["Python", "LangChain", "Groq API"],
    description: "A domain-specific research assistant built on LangChain that maintains conversational context across multi-turn queries. Implements prompt engineering and tool chaining to answer questions about quantum computing with consistent relevance and intent tracking.",
    githubUrl: "https://github.com/ss889/research-assistant",
    status: "Completed",
  },
  {
    id: "funding-scraper",
    name: "AI Funding Data Scraper",
    tags: ["Python", "SQLite", "Docker"],
    description: "Automated scraper that extracts structured startup funding data from AlleyWatch — company, amount, investors, dates — into a persistent SQLite store with deduplication, historical tracking, and Docker deployment.",
    githubUrl: "https://github.com/ss889/ai-funding-scraper",
    status: "In Progress",
  },
];

const AI_SYSTEMS_SKILLS = [
  "Claude API", "MCP (Model Context Protocol)", "LangChain", 
  "Groq API", "RAG", "Prompt Engineering", "Agentic Workflows", 
  "Spec-Based Development"
];

const DEVELOPMENT_SKILLS = [
  "TypeScript", "Python", "React", "Next.js", "React Native",
  "Docker", "GitHub Actions", "Cursor", "Windsurf", "VS Code Copilot"
];

function getStatusColor(status: string) {
  switch (status) {
    case "Live":
      return "#10b981"; // green
    case "In Progress":
      return "#f59e0b"; // yellow
    case "Completed":
      return "#6b7280"; // gray
    default:
      return "#6b7280";
  }
}

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span>•</span> Open to opportunities
        </div>
        <h1>
          I build AI systems that do real work
        </h1>
        <p>
          Agentic pipelines, MCP tooling, and operator interfaces for the way professionals actually use AI.
        </p>
        <p style={{ fontSize: "0.95rem", color: "#9ca3af", marginTop: "-1rem" }}>
          CS student at NJIT · Open to FDE and AI Engineer roles · Graduating May 2026
        </p>
        <div className="hero-buttons">
          <a href="#projects" className="btn-primary">
            View my work ↓
          </a>
        </div>
      </section>

      <hr className="divider" />

      {/* About Section */}
      <section className="section">
        <p className="section-label">About</p>
        <h2 className="section-title">How I got here</h2>
        <div className="about-content">
          <p>
            I fell in love with web development in my Information Systems classes at NJIT. I still remember being proud of the first site I ever built — but I always had more ideas than I could execute. Debugging took time. Getting things to look right took time. The gap between what I imagined and what I could ship felt frustrating.
          </p>
          <p>
            When AI blew up, I built a site that looked miles better than anything I'd made before, in a fraction of the time. Less debugging. Less friction. That was the moment things clicked. I started going deeper — prompt engineering, MCP, agentic workflows, spec-based development. Spec-based dev in particular changed how I work. It's the most efficient way I've found to get the most out of an AI agent. You define what you want precisely, and it executes. That loop is what I build around now.
          </p>
          <p>
            What drives me is simple: I want to build things that give people more breathing room. Tools that take the tedious parts off your plate so you can focus on what actually matters. That's the kind of work I want to keep doing.
          </p>
          <p style={{ marginTop: "2rem" }}>
            <a href="/about" style={{ color: "#5eead4", fontWeight: "600" }}>Read more about me →</a>
          </p>
        </div>
      </section>

      <hr className="divider" id="projects" />

      {/* Projects */}
      <section className="section">
        <p className="section-label">Projects</p>
        <h2 className="section-title">Featured work</h2>
        <p className="section-subtitle">AI systems and tools in production</p>
        <div className="posts-grid">
          {PROJECTS.map((project) => (
            <div key={project.id} className="post-card project-card-enhanced">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {project.tags.map((tag) => (
                    <span key={tag} style={{ 
                      fontSize: "0.75rem", 
                      color: "#5eead4", 
                      fontWeight: "600" 
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <span style={{
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "0.25rem",
                  backgroundColor: `${getStatusColor(project.status)}20`,
                  color: getStatusColor(project.status),
                  whiteSpace: "nowrap"
                }}>
                  {project.status}
                </span>
              </div>
              <h3>{project.name}</h3>
              <p style={{ marginBottom: "1.5rem" }}>{project.description}</p>
              <div style={{ display: "flex", gap: "1rem" }}>
                <a 
                  href={project.githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: "#5eead4", fontWeight: "600", fontSize: "0.95rem" }}
                >
                  GitHub →
                </a>
                {project.liveUrl && (
                  <a 
                    href={project.liveUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: "#5eead4", fontWeight: "600", fontSize: "0.95rem" }}
                  >
                    Live Demo →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* Skills */}
      <section className="section">
        <p className="section-label">Skills</p>
        <h2 className="section-title">Tools & Technologies</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "3rem" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "#ffffff" }}>AI & Agentic Systems</h3>
            <div className="skills-grid">
              {AI_SYSTEMS_SKILLS.map((skill) => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "#ffffff" }}>Development & Tooling</h3>
            <div className="skills-grid">
              {DEVELOPMENT_SKILLS.map((skill) => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* Posts */}
      {posts.length > 0 && (
        <section className="section">
          <p className="section-label">Writing</p>
          <h2 className="section-title">Latest Posts</h2>
          <p className="section-subtitle">Thoughts on code, projects, and more</p>
          <div className="posts-grid">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="post-card">
                <div className="post-card-date">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <h3>{post.title}</h3>
                {post.excerpt && <p>{post.excerpt}</p>}
                <div className="post-card-arrow">Read more →</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}