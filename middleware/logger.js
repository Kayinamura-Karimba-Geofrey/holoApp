
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");


const logDir = path.join(__dirname, "../logs");
fs.mkdirSync(logDir, { recursive: true });

const logStream = fs.createWriteStream(path.join(logDir, "access.log"), { flags: "a" });


const logger = morgan("combined", { stream: logStream });

module.exports = logger;
