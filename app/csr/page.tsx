// /app/csr/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Post } from "../packages/api/domain/posts";

export default function CSRPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data.slice(0, 5)));
  }, []);

  return (
    <div>
      <h1>CSR Page</h1>
      {posts.length > 0 ? (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <strong>{post.title}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
