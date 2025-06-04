/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const { Readable } = require("stream");
const { parse } = require("url");
const next = require("next");

// 🔧 명시적으로 Next.js config 파일 로드
const app = next({
  dev: false,
  conf: require("./.next/required-server-files.json"),
});
const handle = app.getRequestHandler();

let serverInitialized = false;

exports.handler = async (event, context) => {
  try {
    if (!serverInitialized) {
      await app.prepare();
      serverInitialized = true;
    }

    const {
      rawPath = "/",
      rawQueryString,
      headers = {},
      requestContext,
      body,
    } = event;
    const method = requestContext?.http?.method || "GET";
    const query = rawQueryString ? `?${rawQueryString}` : "";

    // Lambda용 mock Request 객체 생성
    const req = new Readable();
    req.url = rawPath + query;
    req.method = method;
    req.headers = headers;
    req.push(body || null);
    req.push(null);

    // Lambda용 mock Response 객체 생성
    const res = new http.ServerResponse(req);

    // 응답 데이터 수집용 변수
    let responseBody = "";
    let responseHeaders = {};

    // Response method 오버라이드
    res.write = (chunk) => {
      responseBody += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : chunk;
    };

    res.writeHead = (statusCode, headers) => {
      res.statusCode = statusCode;
      responseHeaders = {
        ...headers,
        "Content-Type": "text/html; charset=utf-8", // 💡 반드시 명시
        "Cache-Control": "no-cache", // 선택사항: 캐싱 비활성화
      };
    };

    return await new Promise((resolve) => {
      res.end = (chunk) => {
        if (chunk) {
          responseBody += Buffer.isBuffer(chunk)
            ? chunk.toString("utf8")
            : chunk;
        }

        resolve({
          statusCode: res.statusCode || 200,
          headers: responseHeaders,
          body: responseBody,
        });
      };

      // Next.js SSR 핸들러에 요청 위임
      handle(req, res, parse(req.url, true));
    });
  } catch (err) {
    console.error("SSR handler error:", err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "Internal Server Error (SSR)",
    };
  }
};
