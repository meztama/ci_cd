import http from "http";
import next from "next";
import { Readable } from "stream";
import { parse } from "url";

import requiredServerFiles from "./.next/required-server-files.json" assert { type: "json" };

const app = next({
  dev: false,
  conf: requiredServerFiles,
});
const handle = app.getRequestHandler();

let serverInitialized = false;

exports.handler = async (event) => {
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
            "Content-Type": res._headers?.["content-type"] || "text/html",
            ...res._headers,
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
      headers: { "Content-Type": "text/plain" },
      body: "Internal Server Error (SSR)",
    };
  }
};
