const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const port = 3000;

app.listen(port, () => {
    console.log(`Server läuft unter http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});
