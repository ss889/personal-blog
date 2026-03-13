import { getAllPosts } from "@/lib/markdown";
import Link from "next/link";

const SKILLS = [
  "TypeScript", "React", "Next.js", "Node.js",
  "Python", "Electron", "Tailwind CSS", "Git",
];

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span>•</span> Open to opportunities
        </div>
        <h1 className="text-4xl font-bold leading-tight">
          <span>Hi, I&apos;m Saber</span>
        </h1>
        <p>
          AI engineer who transforms complex problems into intelligent solutions. I design and deploy machine learning models that drive real-world impact.
        </p>
        <div className="hero-buttons">
          <Link href="/blog" className="btn-primary">
            Read the blog →
          </Link>
          <a
            href="https://github.com/ss889"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            GitHub
          </a>
        </div>
      </section>

      <hr className="divider" />

      {/* Skills */}
      <section className="section" style={{ paddingBottom: "2rem" }}>
        <p className="section-label">Tech Stack</p>
        <h2 className="section-title">What I work with</h2>
        <p className="section-subtitle">Technologies I use day-to-day</p>
        <div className="skills-grid">
          {SKILLS.map((skill) => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* Projects */}
      <section className="section">
        <p className="section-label">Projects</p>
        <h2 className="section-title">Some of my work</h2>
        <p className="section-subtitle">Personal and professional projects</p>
        <div className="posts-grid">
          <Link href="/projects" className="post-card">
            <div className="post-card-date">
              {new Date("2022-01-01").toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <h3>Personal Website</h3>
            <p>A Next.js website built with Tailwind CSS</p>
            <div className="post-card-arrow">View project →</div>
          </Link>
          <Link href="/projects" className="post-card">
            <div className="post-card-date">
              {new Date("2022-02-01").toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <h3>Blog</h3>
            <p>A blog built with Next.js and Markdown</p>
            <div className="post-card-arrow">View project →</div>
          </Link>
        </div>
      </section>

      <hr className="divider" />

      {/* Posts */}
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
    </>
  );
}