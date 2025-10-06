const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "items.json");

function readData() {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}
function writeData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}
function validateItem(obj) {
    if (!obj) return { ok: false, msg: "Objeto vacío" };
    const { name, model, price, year, color } = obj;
    if (!name || !model || price === undefined || year === undefined || !color) {
        return { ok: false, msg: "Campos requeridos: name, model, price, year, color" };
    }
    if (isNaN(Number(price)) || isNaN(Number(year))) {
        return { ok: false, msg: "price y year deben ser números" };
    }
    return { ok: true };
}

function handleItemsRoutes(req, res) {
    if (!req.url.startsWith("/api/items")) return false;
    res.setHeader("Content-Type", "application/json");

    // GET /api/items
    if (req.method === "GET" && (req.url === "/api/items" || req.url === "/api/items/")) {
        res.end(JSON.stringify(readData()));
        return true;
    }

    // GET /api/items/:id
    if (req.method === "GET" && req.url.startsWith("/api/items/")) {
        const id = parseInt(req.url.split("/").pop());
        if (!isNaN(id)) {
            const item = readData().find(i => i.id === id);
            res.end(JSON.stringify(item || { error: "No encontrado" }));
            return true;
        }
    }

    // POST /api/items
    if (req.method === "POST" && (req.url === "/api/items" || req.url === "/api/items/")) {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const nuevo = JSON.parse(body);
                const v = validateItem(nuevo);
                if (!v.ok) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: v.msg }));
                    return;
                }
                const items = readData();
                nuevo.id = Date.now();
                items.push(nuevo);
                writeData(items);
                res.statusCode = 201;
                res.end(JSON.stringify(nuevo));
            } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "JSON inválido" }));
            }
        });
        return true;
    }

    // PUT /api/items/:id
    if (req.method === "PUT" && req.url.startsWith("/api/items/")) {
        const id = parseInt(req.url.split("/").pop());
        if (!isNaN(id)) {
            let body = "";
            req.on("data", chunk => body += chunk);
            req.on("end", () => {
                try {
                    const update = JSON.parse(body);
                    const items = readData();
                    const idx = items.findIndex(i => i.id === id);
                    if (idx >= 0) {
                        const candidate = { ...items[idx], ...update, id };
                        const v = validateItem(candidate);
                        if (!v.ok) {
                            res.statusCode = 400;
                            res.end(JSON.stringify({ error: v.msg }));
                            return;
                        }
                        items[idx] = candidate;
                        writeData(items);
                        res.end(JSON.stringify(candidate));
                    } else {
                        res.statusCode = 404;
                        res.end(JSON.stringify({ error: "No encontrado" }));
                    }
                } catch {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: "JSON inválido" }));
                }
            });
            return true;
        }
    }

    // DELETE /api/items/:id
    if (req.method === "DELETE" && req.url.startsWith("/api/items/")) {
        const id = parseInt(req.url.split("/").pop());
        if (!isNaN(id)) {
            let items = readData();
            const newItems = items.filter(i => i.id !== id);
            if (newItems.length !== items.length) {
                writeData(newItems);
                res.end(JSON.stringify({ mensaje: "Eliminado" }));
            } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "No encontrado" }));
            }
            return true;
        }
    }

    return false;
}

module.exports = handleItemsRoutes;

