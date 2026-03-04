import { getAllPosts } from "@/lib/markdown";
import Link from "next/link";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Blog</h1>
        <p className="text-gray-600 dark:text-gray-400">
          All posts and articles
        </p>
      </header>

      <div className="space-y-8">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group border-b border-gray-200 dark:border-gray-700 pb-8"
          >
            <Link href={`/blog/${post.slug}`} className="block">
              <h2 className="text-2xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {post.title}
              </h2>
              <time className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {post.excerpt && (
                <p className="mt-3 text-gray-600 dark:text-gray-300">
                  {post.excerpt}
                </p>
              )}
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-12">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
