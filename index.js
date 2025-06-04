/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

const http = require("http");
const { Readable } = require("stream");
const { parse } = require("url");
const next = require("next");
const path = require("path");

// 🔧 Next.js 앱 준비 (서버 모드, config 명시)
const app = next({
  dev: false,
  conf: require("./.next/required-server-files.json"),
});
const handle = app.getRequestHandler();

let serverInitialized = false;

// 🧠 바이너리 응답인지 판별 (gzip 또는 이미지 등)
const isBinaryType = (headers = {}) => {
  const encoding = headers["content-encoding"] || headers["Content-Encoding"];
  const type = headers["content-type"] || headers["Content-Type"];
  return (
    (encoding && encoding.includes("gzip")) ||
    (type &&
      !type.includes("text") &&
      !type.includes("json") &&
      !type.includes("javascript"))
  );
};

// ✅ Lambda Handler
exports.handler = async (event, context) => {
  try {
    if (!serverInitialized) {
      await app.prepare();
      serverInitialized = true;
    }

    const { rawPath, rawQueryString, headers, requestContext, body } = event;

    const method = requestContext?.http?.method || "GET";
    const pathName = rawPath || "/";
    const query = rawQueryString ? `?${rawQueryString}` : "";

    // 📥 요청 객체 생성
    const req = new Readable();
    req.url = pathName + query;
    req.method = method;
    req.headers = headers;
    req.push(body || null);
    req.push(null);

    // 📤 응답 객체 가짜로 구성
    const res = new http.ServerResponse(req);

    let responseBody = "";
    let responseHeaders = {
      "content-type": "text/html; charset=utf-8", // 🛡️ 기본값 (보호 로직)
    };

    // 🔁 응답 마무리
    const resolveResponse = (isBinary) => ({
      statusCode: res.statusCode || 200,
      headers: responseHeaders,
      body: isBinary
        ? Buffer.from(responseBody).toString("base64")
        : responseBody,
      isBase64Encoded: isBinary,
    });

    // 🧱 res 메서드 오버라이드
    res.write = (chunk) => {
      responseBody += chunk;
    };

    res.writeHead = (statusCode, headers) => {
      res.statusCode = statusCode;
      responseHeaders = headers || responseHeaders;
    };

    return await new Promise((resolve) => {
      res.end = (chunk) => {
        if (chunk) responseBody += chunk;
        const isBinary = isBinaryType(responseHeaders || {});
        resolve(resolveResponse(isBinary));
      };

      handle(req, res, parse(req.url, true));
    });
  } catch (err) {
    console.error("❌ SSR handler error:", err);
    return {
      statusCode: 500,
      headers: { "content-type": "text/plain" },
      body: "Internal Server Error (SSR)",
    };
  }
};
