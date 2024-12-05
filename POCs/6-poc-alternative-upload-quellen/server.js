const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const helmet = require("helmet");

const app = express();
const port = 3000;

// Enable CORS for all origins (or specify your frontend URL)
app.use(cors());

// Use helmet to secure HTTP headers
app.use(
    helmet.contentSecurityPolicy({
        useDefaults: true, // Verwende die Standard CSP-Einstellungen
        directives: {
            "script-src": [
                "'self'", 
                "https://apis.google.com", 
                "https://www.gstatic.com", 
                "https://accounts.google.com",
                "https://www.googleapis.com",
                "https://unpkg.com"
            ],
            "frame-src": [
                "'self'", 
                "https://accounts.google.com"
            ],
            "img-src": ["'self'", "data:", "https://*"],  
            "style-src": ["'self'", "'unsafe-inline'"],  
            "font-src": ["'self'"],  
        },
    })
);



// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Speicheroptionen für Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
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
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Keine Datei hochgeladen." });
    }

    res.status(200).json({
        message: `Datei erfolgreich hochgeladen.`,
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
        return res.status(400).json({ message: `Multer-Fehler: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});

// Server starten
app.listen(port, () => {
    console.log(`Server läuft unter http://localhost:${port}`);
});