const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
};
http
  .createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const relative = pathname === "/" ? "index.html" : pathname.slice(1);
    if (
      relative !== "index.html" &&
      !/^src\/[a-z]+\.(js|css)$/.test(relative)
    ) {
      res.writeHead(404).end();
      return;
    }
    fs.readFile(path.join(root, relative), (error, data) => {
      if (error) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, {
        "Content-Type": `${types[path.extname(relative)]}; charset=utf-8`,
      });
      res.end(data);
    });
  })
  .listen(8080, "127.0.0.1", () =>
    console.log("Loopchip: http://127.0.0.1:8080"),
  );
