/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
const http = require("http");
const { Readable } = require("stream");
const { parse } = require("url");
const next = require("next");

const app = next({ dev: false });
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
    const path = rawPath || "/";
    const query = rawQueryString ? `?${rawQueryString}` : "";

    const req = new Readable();
    req.url = path + query;
    req.method = method;
    req.headers = headers;
    req.push(body || null);
    req.push(null);

    const res = new http.ServerResponse(req);

    let responseBody = "";
    let responseHeaders = {};
    res.write = (chunk) => {
      responseBody += chunk;
    };
    res.writeHead = (statusCode, headers) => {
      res.statusCode = statusCode;
      responseHeaders = headers;
    };
    res.end = (chunk) => {
      if (chunk) responseBody += chunk;
      return resolveResponse();
    };

    const resolveResponse = () =>
      new Promise((resolve) => {
        resolve({
          statusCode: res.statusCode || 200,
          headers: responseHeaders,
          body: responseBody,
        });
      });

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
      body: "Internal Server Error (SSR)",
    };
  }
};
