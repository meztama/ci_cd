const http = require("http");
const { Readable } = require("stream");
const { parse } = require("url");
const next = require("next");
const path = require("path");

// 🔧 명시적으로 Next.js 빌드 설정 참조
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

    const { rawPath, rawQueryString, headers, requestContext, body } = event;

    const method = requestContext?.http?.method || "GET";
    const pathName = rawPath || "/";
    const query = rawQueryString ? `?${rawQueryString}` : "";

    const req = new Readable();
    req.url = pathName + query;
    req.method = method;
    req.headers = headers;
    req.push(body || null);
    req.push(null);

    const res = new http.ServerResponse(req);

    let responseBody = "";
    let responseHeaders = {
      "Content-Type": "text/html", // ✅ Content-Type 명시
    };

    res.write = (chunk) => {
      responseBody += chunk;
    };

    res.writeHead = (statusCode, headers) => {
      res.statusCode = statusCode;
      responseHeaders = { ...responseHeaders, ...headers };
    };

    return await new Promise((resolve) => {
      res.end = (chunk) => {
        if (chunk) responseBody += chunk;
        resolve({
          statusCode: res.statusCode || 200,
          headers: responseHeaders,
          body: responseBody,
        });
      };
      handle(req, res, parse(req.url, true));
    });
  } catch (err) {
    console.error("SSR handler error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: "Internal Server Error (SSR)",
    };
  }
};
