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
app.use(express.static(path.join(__dirname, "public")));

// Upload-Route
app.post("/upload", upload.array("file", 10), (req, res) => { // Maximal 10 Dateien auf einmal
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Keine Dateien hochgeladen." });
    }

    res.status(200).json({
        message: `${req.files.length} Datei(en) erfolgreich hochgeladen.`,
        files: req.files.map((file) => ({
            originalName: file.originalname,
            size: file.size,
            path: file.path,
        })),
    });
});


// Fehlerbehandlung für Multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ message: "Eine oder mehrere Dateien sind zu groß. Maximal 50 MB pro Datei erlaubt." });
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

app.use(express.json());
