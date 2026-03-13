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
          <Link key={project.slug} href={`/projects/${project.slug}`} className="blog-list-item">
            <h2>{project.title}</h2>
            <p>{project.excerpt}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Technologies: {project.technologies}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
          }
          .project-card p:last-child {
            margin-bottom: 0;
          }
        `}
      </style>
    </div>
  );
}