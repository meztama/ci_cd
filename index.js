/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const { Readable } = require("stream");
const { parse } = require("url");
const next = require("next");

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
      rawQueryString = "",
      headers = {},
      requestContext = {},
      body,
      isBase64Encoded = false,
    } = event;

    const method = requestContext?.http?.method || "GET";
    const query = rawQueryString ? `?${rawQueryString}` : "";

    // Lambda → Node.js Request 구성
    const req = new Readable();
    req.url = rawPath + query;
    req.method = method;
    req.headers = headers;

    if (body) {
      const buffer = isBase64Encoded
        ? Buffer.from(body, "base64")
        : Buffer.from(body);
      req.push(buffer);
    }
    req.push(null); // 스트림 종료

    // Lambda → Node.js Response 구성
    const res = new http.ServerResponse(req);

    let responseHeaders = {};
    const responseBodyChunks = [];

    res.write = (chunk) => {
      responseBodyChunks.push(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      );
    };

    res.writeHead = (statusCode, headers) => {
      res.statusCode = statusCode;
      responseHeaders = {
        ...headers,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      };
    };

    return await new Promise((resolve) => {
      res.end = (chunk) => {
        if (chunk) {
          responseBodyChunks.push(
            Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
          );
        }

        const finalBody = Buffer.concat(responseBodyChunks).toString("utf8");

        resolve({
          statusCode: res.statusCode || 200,
          headers: responseHeaders,
          body: finalBody,
        });
      };

      handle(req, res, parse(req.url, true));
    });
  } catch (err) {
    console.error("❌ SSR handler error:", err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "Internal Server Error (SSR)",
    };
  }
};
