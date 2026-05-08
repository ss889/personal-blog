import Link from "next/link";

export const metadata = {
  title: "About | Saber",
  description: "My story and how I got here",
};

export default function About() {
  return (
    <main>
      <section className="hero">
        <h1>About me</h1>
        <p>My story with building and AI</p>
      </section>

      <hr />

      <section className="section">
        <div className="about-content">
          <p>
            I fell in love with web development in my Information Systems classes at NJIT. I still remember being proud of the first site I ever built — it had animations, gradient backgrounds, all the bells and whistles. But I always had more ideas than I could execute. Debugging took time. Getting things to look right took time. The gap between what I imagined and what I could ship felt frustrating and limiting.
          </p>

          <p>
            When AI blew up, everything changed. I built a site that looked miles better than anything I'd made before, in a fraction of the time. Less debugging. Less friction. That was the moment things clicked. I started going deeper — prompt engineering, agentic workflows, model context protocol, spec-based development. Spec-based dev in particular changed how I work. It's the most efficient way I've found to get the most out of Claude. You define what you want precisely, you include examples, you be explicit about constraints and format — and Claude executes. That loop is what I build around now.
          </p>

          <p>
            I've built things with the Anthropic SDK, integrated Claude's web search for real-time job listings, used LangChain for agentic pipelines, and experimented with everything from Model Context Protocol to voice-controlled blogging. Every project taught me something about how AI actually works in practice, not in theory.
          </p>

          <p>
            What drives me is simple: I want to build things that give people more breathing room. Tools that automate the tedious parts so you can focus on what actually matters. That's the kind of work I want to keep doing. Not flashy dashboards. Not over-engineered solutions. Just tools that work, that fit into how people actually operate.
          </p>

          <p>
            I'm graduating from NJIT in May 2026 and I'm looking for FDE and AI Engineer roles where I can keep building at this level. If you're working on something interesting, let me know.
          </p>
        </div>
      </section>

      <hr />

      <section className="section">
        <p className="section-label">Contact</p>
        <div className="footer-links">
          <a href="https://github.com/ss889">GitHub</a>
          <a href="https://linkedin.com/in/saber889">LinkedIn</a>
          <a href="mailto:hi@example.com">Email</a>
        </div>
      </section>

      <div style={{ marginTop: "3rem", marginBottom: "3rem" }}>
        <Link href="/">← Back to home</Link>
      </div>
    </main>
  );
}
