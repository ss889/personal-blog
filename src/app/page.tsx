import { getHomepageData, getAllPosts } from "@/lib/markdown";
import Link from "next/link";

export default async function Home() {
  const homepage = await getHomepageData();
  const posts = getAllPosts();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-2">{homepage.title}</h1>
        {homepage.subtitle && (
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {homepage.subtitle}
          </p>
        )}
      </header>

      <article
        className="prose dark:prose-invert max-w-none mb-16"
        dangerouslySetInnerHTML={{ __html: homepage.content }}
      />

      <section>
        <h2 className="text-2xl font-bold mb-6 border-b pb-2">Latest Posts</h2>
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/blog/${post.slug}`} className="block">
                <h3 className="text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h3>
                <time className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                {post.excerpt && (
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {post.excerpt}
                  </p>
                )}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
