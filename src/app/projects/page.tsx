import Link from "next/link";

export default function ProjectsPage() {
  return (
    <div className="container mx-auto p-4 pt-6 md:p-6 lg:p-12 xl:p-12 2xl:p-12">
      <h1 className="text-3xl font-bold mb-8">Projects</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
        {[
          {
            title: "Personal Website",
            excerpt: "Built a custom website using Next.js and Tailwind CSS.",
            slug: "/projects/project-1",
            technologies: "Next.js, Tailwind CSS, TypeScript",
          },
          {
            title: "To-Do List App",
            excerpt: "Created a simple to-do list app using React and local storage.",
            slug: "/projects/project-2",
            technologies: "React, JavaScript, HTML/CSS",
          },
          {
            title: "Weather API App",
            excerpt: "Built a weather API app using OpenWeatherMap API and React.",
            slug: "/projects/project-3",
            technologies: "React, JavaScript, HTML/CSS, OpenWeatherMap API",
          },
          {
            title: "E-commerce Website",
            excerpt: "Designed and developed an e-commerce website using Next.js and Stripe.",
            slug: "/projects/project-4",
            technologies: "Next.js, Stripe, TypeScript",
          },
          {
            title: "Chatbot App",
            excerpt: "Built a chatbot app using Dialogflow and React.",
            slug: "/projects/project-5",
            technologies: "React, JavaScript, HTML/CSS, Dialogflow",
          },
          {
            title: "Simple Calculator",
            excerpt: "A simple calculator built using JavaScript and HTML/CSS.",
            slug: "/projects/project-6",
            technologies: "JavaScript, HTML/CSS",
          },
        ].map((project) => (
          <div
            key={project.slug}
            className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out"
          >
            <Link href={project.slug} className="block p-4">
              <h2 className="text-lg font-bold mb-2">{project.title}</h2>
              <p className="text-gray-300">{project.excerpt}</p>
              <p className="text-gray-400">{project.technologies}</p>
            </Link>
          </div>
        ))}
      </div>
      <style jsx>
        {`
          .project-card {
            padding: 2.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            transition: box-shadow 0.3s ease-in-out;
          }
          .project-card:hover {
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
          }
          .project-card h2 {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }
          .project-card p {
            font-size: 1rem;
            color: var(--text-muted);
            margin-bottom: 1rem;
          }
          .project-card p:last-child {
            margin-bottom: 0;
          }
        `}
      </style>
    </div>
  );
}