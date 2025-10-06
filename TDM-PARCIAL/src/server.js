const http = require("http");
const fs = require("fs");
const path = require("path");
const handleItemsRoutes = require("./routes/items");

const PORT = 3000;
const PUBLIC_PATH = path.join(__dirname, "..", "public");

const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

const server = http.createServer((req, res) => {
  if (handleItemsRoutes(req, res)) return;

  let filePath = req.url === "/" ? "index.html" : req.url;
  filePath = path.join(PUBLIC_PATH, filePath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    } else {
      res.writeHead(200, { "Content-Type": mime[ext] || "text/plain" });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
