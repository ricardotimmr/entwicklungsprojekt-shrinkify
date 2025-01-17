const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const port = 3000;

app.use('/src/styles', express.static(path.join(__dirname, '/src/styles')));
app.use('/src/scripts', express.static(path.join(__dirname, '/src/scripts')));
app.use('/src/fonts', express.static(path.join(__dirname, '/src/fonts')));
app.use('/src/html', express.static(path.join(__dirname, '/src/html')));

app.listen(port, () => {
    console.log(`Server läuft unter http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "/src/index.html"));
});
