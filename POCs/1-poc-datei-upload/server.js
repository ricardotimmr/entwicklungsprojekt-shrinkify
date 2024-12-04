const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const port = 3000;

// Speicheroptionen für Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// Stelle statische Dateien bereit
app.use(express.static(path.join(__dirname, "public")));

// Upload-Route
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Keine Datei hochgeladen." });
    }
    res.status(200).json({ message: "Datei erfolgreich hochgeladen.", file: req.file });
});

// Server starten
app.listen(port, () => {
    console.log(`Server läuft unter http://localhost:${port}`);
});
