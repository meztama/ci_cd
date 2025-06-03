/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const app = next({ dev: false });
const handle = app.getRequestHandler();

let serverReady = false;

exports.handler = async (event, context) => {
  try {
    if (!serverReady) {
      await app.prepare();
      serverReady = true;
    }

    const { rawPath, queryStringParameters, headers, body, requestContext } =
      event;

    const path = rawPath || "/";
    const method = requestContext?.http?.method || "GET";

    const req = new createServer.IncomingMessage();
    req.url =
      path +
      (queryStringParameters
        ? "?" + new URLSearchParams(queryStringParameters).toString()
        : "");
    req.method = method;
    req.headers = headers;
    req.body = body;

    return new Promise((resolve, reject) => {
      const res = new createServer.ServerResponse(req);
      let responseBody = "";

      res.write = (chunk) => {
        responseBody += chunk;
      };

      res.end = () => {
        resolve({
          statusCode: res.statusCode || 200,
          headers: res.getHeaders(),
          body: responseBody,
        });
      };

      handle(req, res, parse(req.url, true));
    });
  } catch (error) {
    console.error("Error in Lambda handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
