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
  let responseHeaders = {};

  const isBinaryType = (headers) => {
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

  return await new Promise((resolve) => {
    res.write = (chunk) => {
      responseBody += chunk;
    };

    res.writeHead = (statusCode, headers) => {
      res.statusCode = statusCode;
      responseHeaders = headers;
    };

    res.end = (chunk) => {
      if (chunk) responseBody += chunk;
      const isBinary = isBinaryType(responseHeaders);

      resolve({
        statusCode: res.statusCode || 200,
        headers: responseHeaders,
        body: isBinary
          ? Buffer.from(responseBody).toString("base64")
          : responseBody,
        isBase64Encoded: isBinary,
      });
    };

    handle(req, res, parse(req.url, true));
  });
};
