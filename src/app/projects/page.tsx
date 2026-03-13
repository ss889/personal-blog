import Link from "next/link";

export default function ProjectsPage() {
  return (
    <div className="container mx-auto p-4 pt-6 md:p-6 lg:p-12 xl:p-12 2xl:p-12">
      <h1 className="text-3xl font-bold mb-4">Projects</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
        <div className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
          <Link href="/projects/project-1" className="block p-4">
            <h2 className="text-lg font-bold mb-2">Personal Website</h2>
            <p className="text-gray-300">Built a custom website using Next.js and Tailwind CSS.</p>
            <p className="text-gray-400">Technologies: Next.js, Tailwind CSS, TypeScript</p>
          </Link>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
          <Link href="/projects/project-2" className="block p-4">
            <h2 className="text-lg font-bold mb-2">To-Do List App</h2>
            <p className="text-gray-300">Created a simple to-do list app using React and local storage.</p>
            <p className="text-gray-400">Technologies: React, JavaScript, HTML/CSS</p>
          </Link>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
          <Link href="/projects/project-3" className="block p-4">
            <h2 className="text-lg font-bold mb-2">Weather API App</h2>
            <p className="text-gray-300">Built a weather API app using OpenWeatherMap API and React.</p>
            <p className="text-gray-400">Technologies: React, JavaScript, HTML/CSS, OpenWeatherMap API</p>
          </Link>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
          <Link href="/projects/project-4" className="block p-4">
            <h2 className="text-lg font-bold mb-2">E-commerce Website</h2>
            <p className="text-gray-300">Designed and developed an e-commerce website using Next.js and Stripe.</p>
            <p className="text-gray-400">Technologies: Next.js, Stripe, TypeScript</p>
          </Link>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
          <Link href="/projects/project-5" className="block p-4">
            <h2 className="text-lg font-bold mb-2">Chatbot App</h2>
            <p className="text-gray-300">Built a chatbot app using Dialogflow and React.</p>
            <p className="text-gray-400">Technologies: React, JavaScript, HTML/CSS, Dialogflow</p>
          </Link>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Projects</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
          <div className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
            <Link href="/projects/sample-project-1" className="block p-4 hover:text-gray-200">
              <h2 className="text-lg font-bold mb-2">Simple Calculator</h2>
              <p className="text-gray-300">A simple calculator built using JavaScript and HTML/CSS.</p>
              <p className="text-gray-400">Technologies: JavaScript, HTML/CSS</p>
            </Link>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
            <Link href="/projects/sample-project-2" className="block p-4 hover:text-gray-200">
              <h2 className="text-lg font-bold mb-2">To-Do List App</h2>
              <p className="text-gray-300">A simple to-do list app built using React and local storage.</p>
              <p className="text-gray-400">Technologies: React, JavaScript, HTML/CSS</p>
            </Link>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
            <Link href="/projects/sample-project-3" className="block p-4 hover:text-gray-200">
              <h2 className="text-lg font-bold mb-2">Weather API App</h2>
              <p className="text-gray-300">A weather API app built using OpenWeatherMap API and React.</p>
              <p className="text-gray-400">Technologies: React, JavaScript, HTML/CSS, OpenWeatherMap API</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}