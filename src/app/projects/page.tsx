import Link from "next/link";

export default function ProjectsPage() {
  const projects = [
    {
      title: "Personal Website",
      excerpt: "Built a custom website using Next.js and Tailwind CSS.",
      slug: "project-1",
      date: "January 1, 2022",
      technologies: "Next.js, Tailwind CSS, TypeScript",
    },
    {
      title: "To-Do List App",
      excerpt: "Created a simple to-do list app using React and local storage.",
      slug: "project-2",
      date: "February 15, 2022",
      technologies: "React, JavaScript, HTML/CSS",
    },
    {
      title: "Weather API App",
      excerpt: "Built a weather API app using OpenWeatherMap API and React.",
      slug: "project-3",
      date: "March 10, 2022",
      technologies: "React, JavaScript, HTML/CSS, OpenWeatherMap API",
    },
    {
      title: "E-commerce Website",
      excerpt: "Designed and developed an e-commerce website using Next.js and Stripe.",
      slug: "project-4",
      date: "April 5, 2022",
      technologies: "Next.js, Stripe, TypeScript",
    },
    {
      title: "Chatbot App",
      excerpt: "Built a chatbot app using Dialogflow and React.",
      slug: "project-5",
      date: "May 20, 2022",
      technologies: "React, JavaScript, HTML/CSS, Dialogflow",
    },
    {
      title: "Simple Calculator",
      excerpt: "A simple calculator built using JavaScript and HTML/CSS.",
      slug: "project-6",
      date: "June 12, 2022",
      technologies: "JavaScript, HTML/CSS",
    },
  ];

  return (
    <main className="section" style={{ maxWidth: 1000 }}>
      <p className="section-label">Portfolio</p>
      <h1 className="section-title">Projects</h1>
      <p className="section-subtitle">Personal and professional projects</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginTop: '2rem',
      }}>
        {projects.map((project) => (
          <div 
            key={project.slug}
            style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(94, 234, 212, 0.2)',
              borderRadius: '0.5rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(94, 234, 212, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(94, 234, 212, 0.4)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.borderColor = 'rgba(94, 234, 212, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <p style={{ color: '#5eead4', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem 0' }}>
              {project.date}
            </p>
            <h2 style={{ fontSize: '1.25rem', margin: '0.5rem 0', color: '#ffffff', fontWeight: 700 }}>{project.title}</h2>
            <p style={{ color: '#9ca3af', margin: '0.75rem 0', fontSize: '0.95rem' }}>{project.excerpt}</p>
            <Link 
              href={`/projects/${project.slug}`}
              style={{ color: '#5eead4', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none', marginTop: '1rem', display: 'inline-block' }}
            >
              View project →
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
}