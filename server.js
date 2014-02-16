var fs = require('fs');
var http = require("http");

// create a server
http.createServer(function(req, res) {
    if (req.url === "/") {
        req.url = "/index.html";
    }
    res.setHeader("Content-Type", "text/html");
    res.end(fs.readFileSync(req.url.slice(1)));
}).listen(process.env.PORT, process.env.IP);

