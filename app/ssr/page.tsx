import { Post } from "../packages/api/domain/posts";

// /app/ssr/page.tsx
export const dynamic = "force-dynamic";

export default async function SSRPage() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    cache: "no-store",
  });
  const posts = await res.json();

  return (
    <div>
      <h1>SSR Page</h1>
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
