import { Post } from "../packages/api/domain/posts";

// /app/isr/page.tsx
export const revalidate = 60; // 60초마다 재생성

export default async function ISRPage() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    next: { revalidate: 60 },
  });
  const posts = await res.json();

  return (
    <div>
      <h1>ISR Page (revalidates every 60s)</h1>
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
