import { Post } from "../packages/api/domain/posts";

// /app/ssg/page.tsx
export const dynamic = "force-static";

export default async function SSGPage() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    cache: "force-cache",
  });
  const posts = await res.json();

  return (
    <div>
      <h1>SSG Page (built at build time)</h1>
      <ul>
        {posts.slice(0, 5).map((post: Post) => (
          <li key={post.id}>
            <strong>{post.title}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
