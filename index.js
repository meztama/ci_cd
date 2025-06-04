/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const { Readable } = require("stream");
const { parse } = require("url");
const next = require("next");
const path = require("path");

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

    const chunks = [];
    res.write = (chunk) => {
      if (chunk)
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    };
    res.writeHead = (statusCode, responseHeaders) => {
      res.statusCode = statusCode;
      res._headers = responseHeaders || {};
    };

    return await new Promise((resolve) => {
      res.end = (chunk) => {
        if (chunk)
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        const buffer = Buffer.concat(chunks);

        resolve({
          statusCode: res.statusCode || 200,
          headers: {
            ...res._headers,
            "Content-Type": "text/html; charset=utf-8", // 🎯 명시적으로 HTML Content-Type 지정
          },
          isBase64Encoded: true,
          body: buffer.toString("base64"),
        });
      };

      handle(req, res, parse(req.url, true));
    });
  } catch (err) {
    console.error("SSR handler error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "Internal Server Error (SSR)",
    };
  }
};
