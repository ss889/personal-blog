import { getAllPosts } from "@/lib/markdown";
import Link from "next/link";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="section" style={{ maxWidth: 720 }}>
      <p className="section-label">Writing</p>
      <h1 className="section-title">All Posts</h1>
      <p className="section-subtitle">{posts.length} articles so far</p>

      <div>
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-list-item">
            <time>{new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}</time>
            <h2>{post.title}</h2>
            {post.excerpt && <p>{post.excerpt}</p>}
          </Link>
        ))}
      </div>
    </main>
  );
}
