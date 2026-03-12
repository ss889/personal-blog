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
    <main className="section" style={{ maxWidth: 720 }}>
      <Link
        href="/blog"
        style={{ fontSize: "0.85rem", color: "#7c3aed", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          marginBottom: "2.5rem"
        }}
      >
        ← All posts
      </Link>

      <article>
        <header style={{ marginBottom: "2.5rem", paddingBottom: "2rem",
          borderBottom: "1px solid var(--border)" }}>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800,
            letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.2,
            marginBottom: "1rem" }}>
            {post.title}
          </h1>
          <time style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </time>
          {post.excerpt && (
            <p style={{ marginTop: "0.75rem", color: "var(--text-muted)",
              fontSize: "1.05rem", lineHeight: 1.6 }}>
              {post.excerpt}
            </p>
          )}
        </header>

        <div
          className="prose prose-invert prose-portfolio max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
}
