import { getPostBySlug, getAllPostSlugs } from "@/lib/markdown";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const post = await getPostBySlug(slug);
    return {
      title: post.title,
      description: post.excerpt,
    };
  } catch {
    return {
      title: "Post Not Found",
    };
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
          <time className="text-gray-500 dark:text-gray-400">
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </header>

        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <nav className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/blog"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to all posts
        </Link>
      </nav>
    </main>
  );
}
