const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

// Sicherstellen, dass die Ordner 'uploads' und 'compressed' existieren
const uploadDir = path.join(__dirname, "uploads");
const compressedDir = path.join(__dirname, "compressed");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log("'uploads'-Ordner erstellt.");
}
if (!fs.existsSync(compressedDir)) {
    fs.mkdirSync(compressedDir);
    console.log("'compressed'-Ordner erstellt.");
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Ungültiger Dateityp. Nur JPEG und PNG erlaubt."));
        }
    },
});

// Route für den Upload und die Verarbeitung mit Sharp
app.post("/upload", upload.single("file"), async (req, res) => {
    const { file } = req;
    const { format } = req.query; // Optional: Format aus der URL

    if (!file) {
        return res.status(400).json({ message: "Keine Datei hochgeladen." });
    }

    // Standardformat: JPEG
    const targetFormat = format || "jpeg";
    const outputFileName = `${Date.now()}-${file.originalname.split('.')[0]}.${targetFormat}`;
    const outputFilePath = path.join(compressedDir, outputFileName);

    try {
        const metadata = await sharp(file.path).metadata();
        const targetWidth = Math.round(metadata.width * 0.8);
        const targetHeight = Math.round(metadata.height * 0.8);

        let quality = metadata.width > 1000 ? 80 : 90; // Verwende höhere Qualität für kleinere Bilder

        await sharp(file.path)
            .resize(targetWidth, targetHeight)
            .toFormat(targetFormat, { quality })
            .toFile(outputFilePath);


        fs.unlinkSync(file.path);

        res.status(200).json({
            message: "Datei erfolgreich verarbeitet und komprimiert.",
            original: {
                name: file.originalname,
                size: file.size,
            },
            compressed: {
                name: outputFileName, // Dateiname der komprimierten Datei
                path: `/compressed/${outputFileName}`, // Korrigierter relativer Pfad
                size: fs.statSync(outputFilePath).size,
            },
        });
    } catch (err) {
        console.error("Fehler bei der Bildverarbeitung:", err);
        res.status(500).json({ message: "Fehler bei der Bildkomprimierung." });
    }
});

// Fehlerbehandlung für Multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ message: "Die Datei ist zu groß. Maximal 50 MB erlaubt." });
        }
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, "public")));
app.use("/compressed", express.static(compressedDir));
app.use("/uploads", express.static(compressedDir));

// Server starten
app.listen(port, () => {
    console.log(`Server läuft unter http://localhost:${port}`);
});

