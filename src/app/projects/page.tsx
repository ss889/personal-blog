import Link from "next/link";

export default function ProjectsPage() {
  const projects = [
    {
      title: "Personal Website",
      excerpt: "Built a custom website using Next.js and Tailwind CSS.",
      slug: "project-1",
      technologies: "Next.js, Tailwind CSS, TypeScript",
    },
    {
      title: "To-Do List App",
      excerpt: "Created a simple to-do list app using React and local storage.",
      slug: "project-2",
      technologies: "React, JavaScript, HTML/CSS",
    },
    {
      title: "Weather API App",
      excerpt: "Built a weather API app using OpenWeatherMap API and React.",
      slug: "project-3",
      technologies: "React, JavaScript, HTML/CSS, OpenWeatherMap API",
    },
    {
      title: "E-commerce Website",
      excerpt: "Designed and developed an e-commerce website using Next.js and Stripe.",
      slug: "project-4",
      technologies: "Next.js, Stripe, TypeScript",
    },
    {
      title: "Chatbot App",
      excerpt: "Built a chatbot app using Dialogflow and React.",
      slug: "project-5",
      technologies: "React, JavaScript, HTML/CSS, Dialogflow",
    },
    {
      title: "Simple Calculator",
      excerpt: "A simple calculator built using JavaScript and HTML/CSS.",
      slug: "project-6",
      technologies: "JavaScript, HTML/CSS",
    },
  ];

  return (
    <main className="section" style={{ maxWidth: 720 }}>
      <p className="section-label">Portfolio</p>
      <h1 className="section-title">Projects</h1>
      <p className="section-subtitle">{projects.length} projects completed</p>

      <div>
        {projects.map((project) => (
          <Link 
            key={project.slug} 
            href={`/projects/${project.slug}`} 
            className="blog-list-item"
            style={{
              display: 'block',
              padding: '2rem',
              marginBottom: '1.5rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(94, 234, 212, 0.2)',
              borderRadius: '0.5rem',
              transition: 'all 0.2s ease',
              color: '#e5e7eb',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(94, 234, 212, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(94, 234, 212, 0.4)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.borderColor = 'rgba(94, 234, 212, 0.2)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <h2 style={{ fontSize: '1.5rem', margin: '0.75rem 0', color: '#5eead4', fontWeight: 700 }}>{project.title}</h2>
            <p style={{ color: '#9ca3af', margin: '0.75rem 0 0 0', fontSize: '0.95rem' }}>{project.excerpt}</p>
            <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.75rem 0 0 0' }}>Technologies: {project.technologies}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}