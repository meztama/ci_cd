/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
// index.js (==> output/index.js 에 위치해야 함)
const nextServer = require("./server.js"); // standalone 빌드로 생성된 서버
const http = require("http");
const { Readable } = require("stream");

exports.handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    const req = new Readable();
    req.push(event.body || "");
    req.push(null);

    req.url = event.rawPath || "/";
    req.method = event.requestContext.http.method;
    req.headers = event.headers;

    const res = new http.ServerResponse(req);

    let body = "";
    res.write = (chunk) => {
      body += chunk;
    };

    res.end = () => {
      resolve({
        statusCode: res.statusCode || 200,
        headers: res.getHeaders(),
        body,
      });
    };

    nextServer.default.emit("request", req, res);
  });
};
