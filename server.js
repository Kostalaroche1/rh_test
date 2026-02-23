const { createServer } = require("http");
const next = require("next");
const url = require("url");

const dev = process.env.NODE_ENV !== "production";
const appDir = __dirname;
const app = next({ dev, dir: appDir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    console.log(`Request received for ${parsedUrl.pathname}`);
    handle(req, res, parsedUrl);
  }).listen(3000, () => {
    console.log(`> Server ready on http://localhost:3000 (dir: ${appDir})`);
  });
});
