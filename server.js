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

// Filter für Dateitypen und Begrenzung der Dateigröße
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB in Bytes
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Ungültiger Dateityp. Nur JPEG und PNG erlaubt."));
        }
    },
});

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, "src")));

// Upload-Route
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        console.error("🚨 Keine Datei hochgeladen oder falsches Format!");
        return res.status(400).json({ message: "Keine Datei hochgeladen oder ungültiges Format." });
    }

    console.log("✅ Datei erfolgreich hochgeladen:", req.file.originalname);
    res.status(200).json({
        message: "Datei erfolgreich hochgeladen.",
        file: {
            originalName: req.file.originalname,
            size: req.file.size,
            path: req.file.path,
        },
    });
});

// Fehlerbehandlung für Multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ message: "Datei zu groß. Maximal 50 MB erlaubt." });
        }
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});

// Server starten
app.listen(port, () => {
    console.log(`Server läuft unter http://localhost:${port}`);
});