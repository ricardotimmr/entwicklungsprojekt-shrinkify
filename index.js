// Needed for overall functionality of the server
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const jwt = require("jsonwebtoken");
const SECRET_KEY = "your-secret-key";

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

// Verbindet mit der SQLite-Datenbank (die Datei wird automatisch erstellt, wenn sie nicht existiert)
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Fehler beim Verbinden mit der Datenbank:", err.message);
  } else {
    console.log("Mit der SQLite-Datenbank verbunden.");
  }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
    )`, (err) => {
        if (err) {
            console.error('Error creating customers table:', err.message);
        } else {
            console.log('Customers table initialized.');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS customer_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        file_format TEXT,
        max_file_size TEXT,
        compression_level TEXT,
        expiration_date DATE NOT NULL,
        url TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error('Error creating customer_links table:', err.message);
        } else {
            console.log('Customer links table initialized.');
        }
    });
    
    db.run(`
        CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        card_id INTEGER NOT NULL,
        FOREIGN KEY (card_id) REFERENCES customer_links(id) ON DELETE CASCADE
        );
    `);
});

app.get("/validate-token", (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ valid: false, message: "Token fehlt." });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        res.status(200).json({ valid: true, data: decoded });
    } catch (err) {
        res.status(401).json({ valid: false, message: "Ungültiger oder abgelaufener Token." });
    }
});

// Ordner für Uploads und komprimierte Bilder sicherstellen
const uploadDir = path.resolve(__dirname, "../uploads");
const compressedDir = path.resolve(__dirname, "../compressed");

// Beispiel zum Speichern eines Bildpfads in der SQLite-Datenbank
const saveImage = (filePath, cardId) => {
    const sql = "INSERT INTO images (file_path, card_id) VALUES (?, ?)";
    db.run(sql, [filePath, cardId], (err) => {
      if (err) {
        console.error("Fehler beim Speichern des Bildes:", err.message);
      } else {
        console.log("Bild erfolgreich in der Datenbank gespeichert für cardId:", cardId);
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

// Customer Routes
// Create a new customer
app.post('/customers', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
      return res.status(400).json({ error: "Name und Email sind erforderlich." });
  }

  console.log("Received new customer:", { name, email });

  db.run(`INSERT INTO customers (name, email) VALUES (?, ?)`, [name, email], function (err) {
      if (err) {
          return res.status(500).json({ error: err.message });
      }

      db.get(`SELECT * FROM customers WHERE id = ?`, [this.lastID], (err, row) => {
          if (err) {
              return res.status(500).json({ error: err.message });
          }
          res.json(row);
      });
  });
});

// Fetch all customers
app.get('/customers', (req, res) => {
  db.all(`SELECT * FROM customers`, [], (err, rows) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(rows);
  });
});

// Card Routes
// Create a new card
app.post('/cards', (req, res) => {
    const { customerId, name, fileFormat, maxFileSize, compressionLevel, expirationDate } = req.body;

    if (!customerId || !name || !expirationDate) {
        return res.status(400).json({
            success: false,
            message: "Kunden-ID, Name und Ablaufdatum sind erforderlich."
        });
    }

    // Zuerst die Karte ohne URL erstellen
    const query = `INSERT INTO customer_links (customer_id, name, file_format, max_file_size, compression_level, expiration_date, url) 
                   VALUES (?, ?, ?, ?, ?, ?, NULL)`;

    db.run(query, [customerId, name, fileFormat, maxFileSize, compressionLevel, expirationDate], function (err) {
        if (err) {
            console.error("Fehler beim Hinzufügen der Karte:", err.message);
            return res.status(500).json({ success: false, message: "Fehler beim Hinzufügen der Karte." });
        }

        const cardId = this.lastID;

        // Token generieren
        const payload = { cardId, customerId };
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' }); // Token läuft in 7 Tagen ab

        // Erstelle personalisierten Link
        const personalizedLink = `http://localhost:3000/assetowner.html?token=${token}`;

        // Update der Karte mit dem Link
        db.run(`UPDATE customer_links SET url = ? WHERE id = ?`, [personalizedLink, cardId], (updateErr) => {
            if (updateErr) {
                console.error("Fehler beim Speichern des Links:", updateErr.message);
                return res.status(500).json({ success: false, message: "Fehler beim Speichern des Links." });
            }

            // Rückgabe der Karte mit dem Link
            res.status(201).json({
                success: true,
                card: {
                    id: cardId,
                    customer_id: customerId,
                    name,
                    file_format: fileFormat,
                    max_file_size: maxFileSize,
                    compression_level: compressionLevel,
                    expiration_date: expirationDate,
                    url: personalizedLink
                }
            });
        });
    });
});

// Fetch all cards for a specific customer
app.get('/customers/:customerId/cards', (req, res) => {
    const { customerId } = req.params;

    const query = `SELECT * FROM customer_links WHERE customer_id = ?`;
    db.all(query, [customerId], (err, rows) => {
        if (err) {
            console.error("Fehler beim Abrufen der Karten:", err.message);
            return res.status(500).json({ success: false, message: "Fehler beim Abrufen der Karten." });
        }
        res.status(200).json({ success: true, cards: rows });
    });
});

// Update card details
app.patch('/cards/:cardId', (req, res) => {
    const { cardId } = req.params;
    const { file_format, max_file_size, compression_level, expiration_date } = req.body;

    let updateFields = [];
    let values = [];

    if (file_format !== undefined) {
        updateFields.push("file_format = ?");
        values.push(file_format);
    }
    if (max_file_size !== undefined) {
        updateFields.push("max_file_size = ?");
        values.push(max_file_size);
    }
    if (compression_level !== undefined) {
        updateFields.push("compression_level = ?");
        values.push(compression_level);
    }
    if (expiration_date !== undefined) {
        updateFields.push("expiration_date = ?");
        values.push(expiration_date);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: "Keine gültigen Felder zum Aktualisieren." });
    }

    values.push(cardId); // Card ID als letztes Argument für das WHERE-Statement

    const query = `UPDATE customer_links SET ${updateFields.join(", ")} WHERE id = ?`;

    db.run(query, values, function (err) {
        if (err) {
            console.error("Fehler beim Aktualisieren der Karte:", err.message);
            return res.status(500).json({ success: false, message: "Fehler beim Aktualisieren der Karte." });
        }

        db.get(`SELECT * FROM customer_links WHERE id = ?`, [cardId], (err, row) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Fehler beim Abrufen der Karte." });
            }
            res.status(200).json({ success: true, card: row });
        });
    });
});


// Delete a card
app.delete('/cards/:cardId', (req, res) => {
    const { cardId } = req.params;

    db.run(`DELETE FROM customer_links WHERE id = ?`, [cardId], function (err) {
        if (err) {
            console.error("Fehler beim Löschen der Karte:", err.message);
            return res.status(500).json({ success: false, message: "Fehler beim Löschen der Karte." });
        }
        res.status(200).json({ success: true, message: "Karte erfolgreich gelöscht." });
    });
});

app.use(express.static(path.join(__dirname, "src")));

app.post("/upload", upload.single("file"), async (req, res) => {
    console.log("Upload gestartet...");
  
    const { cardId } = req.body;
  
    if (!req.file) {
      console.error("Keine Datei hochgeladen.");
      return res.status(400).json({ message: "Keine Datei hochgeladen." });
    }
  
    if (!cardId) {
      console.error("Fehlende cardId.");
      return res.status(400).json({ message: "Fehlende cardId." });
    }
  
    // Fetch card settings
    const sql = "SELECT * FROM customer_links WHERE id = ?";
    db.get(sql, [cardId], async (err, card) => {
      if (err || !card) {
        console.error("Fehler beim Abrufen der Karteneinstellungen:", err);
        return res.status(500).json({ message: "Fehler beim Abrufen der Karteneinstellungen." });
      }
  
      const maxFileSizeBytes = parseInt(card.max_file_size) * 1024 * 1024;
      const compressionLevel = parseInt(card.compression_level) || 75;
      const outputFormat = card.file_format.replace('.', '') || 'jpeg';
      const expDate = new Date(card.expiration_date);
      const today = new Date();
  
      if (today > expDate) {
        console.error("Der Link ist abgelaufen.");
        return res.status(400).json({ message: "Der Link ist abgelaufen." });
      }
  
      if (req.file.size > maxFileSizeBytes) {
        console.error("Datei überschreitet die maximale Größe.");
        return res.status(400).json({ message: "Datei überschreitet die maximale Größe." });
      }
  
      const inputFile = req.file.path;
      const outputFileName = `${Date.now()}-${req.file.originalname.split(".")[0]}.${outputFormat}`;
      const outputFilePath = path.resolve(compressedDir, outputFileName);
  
      console.log("Hochgeladene Datei:", inputFile);
      console.log("Speicherort der komprimierten Datei:", outputFilePath);
  
      try {
        // Get metadata for resizing
        const metadata = await sharp(inputFile).metadata();
        console.log("Bild-Metadaten:", metadata);
  
        // Example logic: Resize the image to 80% of original dimensions
        const newWidth = Math.round(metadata.width * 0.8);
        const newHeight = Math.round(metadata.height * 0.8);
        console.log(`Neue Größe: ${newWidth}x${newHeight}`);
  
        // Resize, apply compression, and convert format
        await sharp(inputFile)
          .resize(newWidth, newHeight) // Resizing based on metadata
          .toFormat(outputFormat, { quality: compressionLevel }) // Apply compression and format
          .toFile(outputFilePath);
  
        console.log("✅ Bild gespeichert:", outputFilePath);
  
        // Save image path with cardId in the DB
        db.run("INSERT INTO images (file_path, card_id) VALUES (?, ?)", [`/compressed/${outputFileName}`, cardId], (err) => {
          if (err) {
            console.error("❌ Fehler beim Speichern des Bildes in der DB:", err.message);
            return res.status(500).json({ message: "Fehler beim Speichern des Bildes." });
          }
  
          // Verify file exists after saving
          if (fs.existsSync(outputFilePath)) {
            console.log("✅ Datei erfolgreich gespeichert:", outputFilePath);
          } else {
            console.error("❌ Datei wurde nicht gefunden nach Speicherung:", outputFilePath);
          }
  
          // Respond with success and file details
          res.status(200).json({
            message: "Datei erfolgreich hochgeladen und komprimiert.",
            compressed: {
              name: outputFileName,
              path: `/compressed/${outputFileName}`,
              size: fs.statSync(outputFilePath).size,
            }
          });
        });
      } catch (error) {
        console.error("Fehler bei der Bildverarbeitung:", error);
        res.status(500).json({ message: "Fehler bei der Komprimierung." });
      }
    });
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


app.get("/images/:cardId", (req, res) => {
    const { cardId } = req.params;
  
    const sql = "SELECT * FROM images WHERE card_id = ?";
    db.all(sql, [cardId], (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Fehler beim Abrufen der Bilder." });
      }
      res.json(rows);
    });
  });

  app.get("/images", (req, res) => {
    getImages((images) => {
      res.json(images);
    });
  });

  // Fetch specific card by cardId
app.get('/cards/:cardId', (req, res) => {
    const { cardId } = req.params;

    const query = `SELECT * FROM customer_links WHERE id = ?`;
    db.get(query, [cardId], (err, row) => {
        if (err) {
            console.error("Fehler beim Abrufen der Karte:", err.message);
            return res.status(500).json({ success: false, message: "Fehler beim Abrufen der Karte." });
        }
        if (!row) {
            return res.status(404).json({ success: false, message: "Karte nicht gefunden." });
        }
        res.status(200).json({ success: true, card: row });
    });
});


// Statische Dateien bereitstellen
app.use("/compressed", express.static(compressedDir));
app.use("/uploads", express.static(uploadDir));

// Server starten
app.listen(port, () =>
  console.log(`Server läuft auf http://localhost:${port}`)
);
