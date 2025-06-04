// /app/ssr/page.tsx
export const dynamic = "force-dynamic";

export default async function SSRPage() {
  try {
    // const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    //   cache: "no-store",
    // });

    // if (!res.ok) {
    //   // fetch 자체는 성공했지만 4xx/5xx 에러 상태일 경우
    //   console.error("❌ SSR fetch 실패:", res.status, res.statusText);
    //   throw new Error(`Failed to fetch: ${res.status}`);
    // }

    // const posts: Post[] = await res.json();

    return (
      <div>
        <h1>SSR Page</h1>
        <p>이 페이지는 서버에서 동적으로 렌더링되었습니다.</p>
        {/* <ul>
          {posts.slice(0, 5).map((post) => (
            <li key={post.id}>
              <strong>{post.title}</strong>
            </li>
          ))}
        </ul> */}
      </div>
    );
  } catch (error) {
    console.error("❗ SSRPage 오류:", error);

    return (
      <div>
        <h1>SSR Page</h1>
        <p>⚠️ 데이터를 불러오는 중 문제가 발생했습니다.</p>
        <p style={{ color: "gray" }}>{(error as Error).message}</p>
      </div>
    );
  }
}
