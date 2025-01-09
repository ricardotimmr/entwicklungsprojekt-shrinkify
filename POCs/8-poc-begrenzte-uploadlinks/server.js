const express = require("express");
const multer = require("multer");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken"); // JWT-Bibliothek

const app = express();
const port = 3000;

// SQLite-Datenbank initialisieren
const db = new sqlite3.Database("./links.db", (err) => {
    if (err) {
        console.error("Fehler beim Öffnen der Datenbank:", err.message);
    } else {
        console.log("Verbunden mit SQLite-Datenbank.");

        // Tabelle erstellen, falls sie nicht existiert
        db.run(
            `CREATE TABLE IF NOT EXISTS links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                expiry_date TEXT NOT NULL,
                url TEXT NOT NULL
            )`,
            (err) => {
                if (err) {
                    console.error("Fehler beim Erstellen der Tabelle:", err.message);
                } else {
                    console.log("Tabelle 'links' ist bereit.");
                }
            }
        );
    }
});

// Middleware
app.use(express.json()); // Zum Verarbeiten von JSON-Daten
app.use(express.static(path.join(__dirname, "public"))); // Statische Dateien

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

// Upload-Route
app.post("/upload", upload.array("file", 10), (req, res) => {
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

// Route für die Token-Generierung
app.post("/generate-token", (req, res) => {
    const { name, expiryDate, url } = req.body;

    if (!name || !expiryDate || !url) {
        return res.status(400).json({ message: "Name, Ablaufdatum und URL sind erforderlich." });
    }

    try {
        // Token generieren
        const payload = {
            name: name,
            url: url, // Ziel-URL
            exp: Math.floor(new Date(expiryDate).getTime() / 1000), // Ablaufdatum in Sekunden
        };
        const token = jwt.sign(payload, SECRET_KEY);

        res.status(200).json({ token });
    } catch (err) {
        console.error("Fehler beim Generieren des Tokens:", err.message);
        res.status(500).json({ message: "Fehler beim Generieren des Tokens" });
    }
});

// Route: Link erstellen
app.post("/create-link", (req, res) => {
    const { name, expiryDate, url } = req.body;

    if (!name || !expiryDate || !url) {
        return res.status(400).json({ message: "Name, Ablaufdatum und URL sind erforderlich." });
    }

    const query = `INSERT INTO links (name, expiry_date, url) VALUES (?, ?, ?)`;
    db.run(query, [name, expiryDate, url], function (err) {
        if (err) {
            console.error("Fehler beim Speichern des Links:", err.message);
            res.status(500).json({ message: "Fehler beim Speichern des Links", error: err.message });
        } else {
            res.status(201).json({
                message: "Link erfolgreich erstellt",
                link: { id: this.lastID, name, expiryDate, url },
            });
        }
    });
});

// Route: Links abrufen
app.get("/links", (req, res) => {
    const query = `SELECT * FROM links`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Fehler beim Abrufen der Links:", err.message);
            res.status(500).json({ message: "Fehler beim Abrufen der Links", error: err.message });
        } else {
            res.status(200).json(rows);
        }
    });
});

// Route: Datenbank löschen (alle Links entfernen)
app.delete("/delete-links", (req, res) => {
    const query = `DELETE FROM links`;

    db.run(query, function (err) {
        if (err) {
            console.error("Fehler beim Löschen der Links:", err.message);
            res.status(500).json({ message: "Fehler beim Löschen der Links", error: err.message });
        } else {
            res.status(200).json({
                message: "Alle Links erfolgreich gelöscht.",
                changes: this.changes, // Anzahl der gelöschten Einträge
            });
        }
    });
});

// Geheime Schlüssel für die Token-Generierung und -Verifizierung
const SECRET_KEY = "secret-key";

// Route zur Validierung und Weiterleitung
app.get("/access-link", (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send("Token fehlt.");
    }

    try {
        // Token verifizieren und dekodieren
        const decoded = jwt.verify(token, SECRET_KEY);

        // Ablaufdatum prüfen
        const currentDate = Math.floor(Date.now() / 1000); // Aktuelles Datum in Sekunden
        if (decoded.exp < currentDate) {
            return res.status(403).send("Link ist abgelaufen.");
        }

        // Wenn gültig, zur Zielseite weiterleiten
        res.redirect(decoded.url); // Ziel-URL aus dem Token
    } catch (err) {
        console.error("Fehler beim Verifizieren des Tokens:", err.message);
        res.status(400).send("Ungültiger Token.");
    }
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
