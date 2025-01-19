const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 3000;

app.use(express.json()); // JSON-Body Parser aktivieren
app.use(express.urlencoded({ extended: true })); // Falls Form-Daten gesendet werden

app.use("/src/styles", express.static(path.join(__dirname, "/src/styles")));
app.use("/src/scripts", express.static(path.join(__dirname, "/src/scripts")));
app.use("/src/fonts", express.static(path.join(__dirname, "/src/fonts")));
app.use("/src/html", express.static(path.join(__dirname, "/src/html")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/src/index.html"));
});

const fs = require("fs");

// Verbindet mit der SQLite-Datenbank (die Datei wird automatisch erstellt, wenn sie nicht existiert)
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Fehler beim Verbinden mit der Datenbank:", err.message);
  } else {
    console.log("Mit der SQLite-Datenbank verbunden.");
  }
});

// Tabelle erstellen, falls sie noch nicht existiert
db.run(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);


// Ordner für Uploads und komprimierte Bilder sicherstellen
const uploadDir = path.resolve(__dirname, "../uploads");
const compressedDir = path.resolve(__dirname, "../compressed");

// Beispiel zum Speichern eines Bildpfads in der SQLite-Datenbank
const saveImage = (filePath) => {
  const sql = "INSERT INTO images (file_path) VALUES (?)";
  db.run(sql, [filePath], (err) => {
    if (err) {
      console.error("Fehler beim Speichern des Bildes:", err.message);
    } else {
      console.log("Bild erfolgreich in der Datenbank gespeichert.");
    }
  });
};

const deleteImage = (filePath) => {
  const sql = "DELETE FROM images WHERE file_path = ?";
  db.run(sql, [filePath], (err) => {
    if (err) {
      console.error("Fehler beim Löschen des Bildes aus der Datenbank:", err.message);
    } else {
      console.log("Bild erfolgreich aus der Datenbank gelöscht:", filePath);
    }
  });
};

// Beispiel zum Abrufen aller Bilder
const getImages = (callback) => {
  const sql = "SELECT * FROM images";
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Fehler beim Abrufen der Bilder:", err.message);
    } else {
      callback(rows); // Hiermit werden alle Bilder als Array zurückgegeben
    }
  });
};

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(compressedDir))
  fs.mkdirSync(compressedDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    allowedTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Nur JPEG und PNG erlaubt."));
  },
});

app.use(express.static(path.join(__dirname, "src")));

app.post("/upload", upload.single("file"), async (req, res) => {
  console.log("Upload gestartet...");

  if (!req.file) {
    console.error("Keine Datei hochgeladen.");
    return res.status(400).json({ message: "Keine Datei hochgeladen." });
  }

  const inputFile = req.file.path;
  const outputFileName = `${req.file.originalname.split(".")[0]}.jpeg`; // Originalname ohne zufällige Zahl
  const outputFilePath = path.resolve(compressedDir, outputFileName);

  console.log("Hochgeladene Datei:", inputFile);
  console.log("Speicherort der komprimierten Datei:", outputFilePath);

  try {
    const metadata = await sharp(inputFile).metadata();
    console.log("Bild-Metadaten:", metadata);

    const newWidth = Math.round(metadata.width * 0.8);
    const newHeight = Math.round(metadata.height * 0.8);
    console.log(`Neue Größe: ${newWidth}x${newHeight}`);

    await sharp(inputFile)
      .resize(newWidth, newHeight)
      .jpeg({ quality: 80 })
      .toFile(outputFilePath)
      .then(() => {
        console.log("✅ Bild gespeichert:", outputFilePath);

        // Bildpfad in der DB speichern
        saveImage(`/compressed/${outputFileName}`);

        // Überprüfen, ob die Datei existiert
        if (fs.existsSync(outputFilePath)) {
          console.log("✅ Datei erfolgreich gespeichert:", outputFilePath);
        } else {
          console.error("❌ Datei wurde nicht gefunden nach Speicherung:", outputFilePath);
        }
      })
      .catch((err) => console.error("❌ Fehler beim Speichern:", err));

    console.log("Bild erfolgreich gespeichert:", outputFilePath);

    res.status(200).json({
      message: "Datei erfolgreich komprimiert.",
      compressed: {
        name: outputFileName,
        path: `/compressed/${outputFileName}`, // Der Pfad zur komprimierten Datei
        size: fs.statSync(outputFilePath).size,
      },
    });
  } catch (error) {
    console.error("Fehler bei der Bildverarbeitung:", error);
    res.status(500).json({ message: "Fehler bei der Komprimierung." });
  }
});


app.delete("/delete", express.json(), (req, res) => {
  console.log("🚨 DELETE-Anfrage erhalten:", req.body);

  if (!req.body || !req.body.filename) {
    console.error("❌ req.body ist undefined oder 'filename' fehlt!", req.body);
    return res.status(400).json({ message: "Fehlender Dateiname in der Anfrage." });
  }

  const { filename } = req.body;
  const filePath = path.join(__dirname, "../compressed", filename);

  console.log("🗑️ Versuche Datei zu löschen:", filePath);

  // Datei aus dem Dateisystem löschen
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("❌ Fehler beim Löschen der Datei:", err);
      return res.status(500).json({ message: "Fehler beim Löschen der Datei.", error: err.message });
    }

    console.log("✅ Datei erfolgreich gelöscht:", filename);

    // Jetzt den Pfad der Datei aus der Datenbank löschen
    deleteImage(`/compressed/${filename}`); // Hier den Pfad der Datei übergeben, der in der DB gespeichert wurde

    res.json({ message: "Datei erfolgreich gelöscht." });
  });
});


app.get("/images", (req, res) => {
  getImages((images) => {
    res.json(images);
  });
});



// Statische Dateien bereitstellen
app.use("/compressed", express.static(compressedDir));
app.use("/uploads", express.static(uploadDir));

// Server starten
app.listen(port, () =>
  console.log(`Server läuft auf http://localhost:${port}`)
);
