export const metadata = {
  title: "About | Saber",
  description: "My story and how I got here",
};

export default function About() {
  return (
    <>
      <section className="hero-about">
        <h1>About me</h1>
      </section>

      <hr className="divider" />

      <section className="section section-about">
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
        </div>

        <hr className="divider" style={{ marginTop: "4rem", marginBottom: "4rem" }} />

        <div>
          <h2 className="section-title" style={{ marginBottom: "2rem" }}>Currently</h2>
          <p style={{ marginBottom: "1.5rem" }}>
            CS student at NJIT, graduating May 2026. Building AI systems and tools. Open to FDE, AI Engineer, and Applied AI roles.
          </p>
          <p>
            When I'm not coding, I'm thinking about how to make tools feel natural to use, or exploring new ways AI agents can handle complex workflows.
          </p>
        </div>
      </section>

      <hr className="divider" />

      <section className="section">
        <h2 className="section-title" style={{ marginBottom: "2rem" }}>Links</h2>
        <div className="about-links">
          <a href="https://github.com/ss889" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://linkedin.com/in/sadikul-saber" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="mailto:sadikulsaber@gmail.com">Email</a>
        </div>
      </section>
    </>
  );
}
