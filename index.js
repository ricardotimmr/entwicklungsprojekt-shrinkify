require("dotenv").config(); // Node.js-Projekt CommonJS verwendet, aber es wird versucht, ES Modules (import) zu nutzen
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const fs = require("fs");
const archiver = require("archiver");

const axios = require("axios");
const cors = require("cors");

const jwt = require("jsonwebtoken");
const SECRET_KEY = "your-secret-key";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/src/styles", express.static(path.join(__dirname, "/src/styles")));
app.use("/src/scripts", express.static(path.join(__dirname, "/src/scripts")));
app.use("/src/fonts", express.static(path.join(__dirname, "/src/fonts")));
app.use("/src/html", express.static(path.join(__dirname, "/src/html")));
app.use("/compressed", express.static(path.join(__dirname, "../compressed")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/src/index.html"));
});

// Verbindung mit der SQLite-Datenbank
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Fehler beim Verbinden mit der Datenbank:", err.message);
  } else {
    console.log("Mit der SQLite-Datenbank verbunden.");
  }
});

// Initialisierung der Tabellen
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
    )`,
    (err) => {
      if (err) {
        console.error("Error creating customers table:", err.message);
      } else {
        console.log("Customers table initialized.");
      }
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS customer_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        file_format TEXT,
        max_file_size TEXT,
        compression_level TEXT,
        expiration_date DATE NOT NULL,
        credits INTEGER DEFAULT 0,  -- Add this line
        url TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) {
        console.error("Error creating customer_links table:", err.message);
      } else {
        console.log("Customer links table initialized.");
      }
    }
  );

  db.run(`
        CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        card_id INTEGER NOT NULL,
        FOREIGN KEY (card_id) REFERENCES customer_links(id) ON DELETE CASCADE
        );
    `);

  db.run(`CREATE TABLE IF NOT EXISTS credit_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (card_id) REFERENCES customer_links(id) ON DELETE CASCADE
  )`);
});

//Gültigkeit des Tokens überprüfen
app.get("/validate-token", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ valid: false, message: "Token fehlt." });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.status(200).json({ valid: true, data: decoded });
  } catch (err) {
    res
      .status(401)
      .json({ valid: false, message: "Ungültiger oder abgelaufener Token." });
  }
});

// Ordner für Uploads und komprimierte Bilder sicherstellen
const uploadDir = path.resolve(__dirname, "../uploads");
const compressedDir = path.resolve(__dirname, "../compressed");

// Speicherung eines Bildes in Datenbank
const saveImage = (filePath, cardId) => {
  const sql = "INSERT INTO images (file_path, card_id) VALUES (?, ?)";
  db.run(sql, [filePath, cardId], (err) => {
    if (err) {
      console.error("Fehler beim Speichern des Bildes:", err.message);
    } else {
      console.log(
        "Bild erfolgreich in der Datenbank gespeichert für cardId:",
        cardId
      );
    }
  });
};

// Löschung eines Bildes aus Datenbank
const deleteImage = (filePath) => {
  const sql = "DELETE FROM images WHERE file_path = ?";
  db.run(sql, [filePath], (err) => {
    if (err) {
      console.error(
        "Fehler beim Löschen des Bildes aus der Datenbank:",
        err.message
      );
    } else {
      console.log("Bild erfolgreich aus der Datenbank gelöscht:", filePath);
    }
  });
};

// Abrufen aller Bilder aus Datenbank
const getImages = (callback) => {
  const sql = "SELECT * FROM images";
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Fehler beim Abrufen der Bilder:", err.message);
    } else {
      callback(rows);
    }
  });
};

// Sicherstellen, dass die Upload- und komprimierten Ordner vorhanden sind
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(compressedDir))
  fs.mkdirSync(compressedDir, { recursive: true });

// Multer-Konfiguration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExt);
    const timestamp = Date.now();
    cb(null, `${timestamp}-${baseName}${fileExt}`);
  },
});

// Multer-Upload-Optionen
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    allowedTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Nur JPEG und PNG erlaubt."));
  },
});

// Erstellung eines neuen Kunden
app.post("/customers", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name und Email sind erforderlich." });
  }

  db.run(
    `INSERT INTO customers (name, email) VALUES (?, ?)`,
    [name, email],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get(
        `SELECT * FROM customers WHERE id = ?`,
        [this.lastID],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(row);
        }
      );
    }
  );
});

// Abrufen aller Kunden
app.get("/customers", (req, res) => {
  db.all(`SELECT * FROM customers`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Abrufen eines bestimmten Upload-Links
app.post("/cards", (req, res) => {
  const {
    customerId,
    name,
    fileFormat,
    maxFileSize,
    compressionLevel,
    expirationDate,
    credits = 0,
  } = req.body;

  if (!customerId || !name || !expirationDate) {
    return res.status(400).json({
      success: false,
      message: "Kunden-ID, Name und Ablaufdatum sind erforderlich.",
    });
  }

  const query = `INSERT INTO customer_links (customer_id, name, file_format, max_file_size, compression_level, expiration_date, credits, url) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`;

  db.run(
    query,
    [
      customerId,
      name,
      fileFormat,
      maxFileSize,
      compressionLevel,
      expirationDate,
      credits,
    ],
    function (err) {
      if (err) {
        console.error("Fehler beim Hinzufügen der Karte:", err.message);
        return res.status(500).json({
          success: false,
          message: "Fehler beim Hinzufügen der Karte.",
        });
      }

      const cardId = this.lastID;
      const payload = { cardId, customerId, projectName: name };
      const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });
      const personalizedLink = `http://localhost:3000/assetowner.html?token=${token}`;

      db.run(
        `UPDATE customer_links SET url = ? WHERE id = ?`,
        [personalizedLink, cardId],
        (updateErr) => {
          if (updateErr) {
            console.error(
              "Fehler beim Speichern des Links:",
              updateErr.message
            );
            return res.status(500).json({
              success: false,
              message: "Fehler beim Speichern des Links.",
            });
          }

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
              credits,
              url: personalizedLink,
            },
          });
        }
      );
    }
  );
});

// Abruf aller Upload-Links eines bestimmten Kunden
app.get("/customers/:customerId/cards", (req, res) => {
  const { customerId } = req.params;

  const query = `SELECT * FROM customer_links WHERE customer_id = ?`;
  db.all(query, [customerId], (err, rows) => {
    if (err) {
      console.error("Fehler beim Abrufen der Karten:", err.message);
      return res
        .status(500)
        .json({ success: false, message: "Fehler beim Abrufen der Karten." });
    }
    res.status(200).json({ success: true, cards: rows });
  });
});

// Aktuallisierung der Einstellungen eines Upload-Links
app.patch("/cards/:cardId", (req, res) => {
  const { cardId } = req.params;
  const {
    file_format,
    max_file_size,
    compression_level,
    expiration_date,
    credits,
  } = req.body;

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
  if (credits !== undefined) {
    updateFields.push("credits = ?");
    values.push(credits);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Keine gültigen Felder zum Aktualisieren.",
    });
  }

  values.push(cardId); // Card ID am Ende des Arrays hinzufügen

  const query = `UPDATE customer_links SET ${updateFields.join(
    ", "
  )} WHERE id = ?`;

  db.run(query, values, function (err) {
    if (err) {
      console.error("Fehler beim Aktualisieren der Karte:", err.message);
      return res.status(500).json({
        success: false,
        message: "Fehler beim Aktualisieren der Karte.",
      });
    }

    db.get(
      `SELECT * FROM customer_links WHERE id = ?`,
      [cardId],
      (err, row) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Fehler beim Abrufen der Karte.",
          });
        }
        res.status(200).json({ success: true, card: row });
      }
    );
  });
});

// Löschung eines bestimmten Upload-Links
app.delete("/cards/:cardId", (req, res) => {
  const { cardId } = req.params;

  db.run(`DELETE FROM customer_links WHERE id = ?`, [cardId], function (err) {
    if (err) {
      console.error("Fehler beim Löschen der Karte:", err.message);
      return res
        .status(500)
        .json({ success: false, message: "Fehler beim Löschen der Karte." });
    }
    res
      .status(200)
      .json({ success: true, message: "Karte erfolgreich gelöscht." });
  });
});

app.use(express.static(path.join(__dirname, "src")));

//Verarbeitung des Uploads
app.post("/upload", upload.single("file"), async (req, res) => {
  const { cardId } = req.body;

  if (!req.file) {
    console.error("Keine Datei hochgeladen.");
    return res.status(400).json({ message: "Keine Datei hochgeladen." });
  }

  if (!cardId) {
    console.error("Fehlende cardId.");
    return res.status(400).json({ message: "Fehlende cardId." });
  }

  // Überprüfung der Karteneinstellungen
  const sql = "SELECT * FROM customer_links WHERE id = ?";
  db.get(sql, [cardId], async (err, card) => {
    if (err) {
      console.error(
        "SQL-Fehler beim Abrufen der Karteneinstellungen:",
        err.message
      );
      return res
        .status(500)
        .json({
          message: "Fehler beim Abrufen der Karteneinstellungen.",
          error: err.message,
        });
    }
    if (!card) {
      console.error(
        "Keine Karteneinstellungen gefunden für cardId:",
        cardId
      );
      return res
        .status(404)
        .json({ message: "Keine Karteneinstellungen gefunden." });
    }

    const maxFileSizeBytes = parseInt(card.max_file_size) * 1024 * 1024;
    const compressionLevel = parseInt(card.compression_level) || 75;
    const outputFormat = card.file_format.replace(".", "") || "jpeg";
    const expDate = new Date(card.expiration_date);
    const today = new Date();

    if (today > expDate) {
      console.error("Der Link ist abgelaufen.");
      return res.status(400).json({ message: "Der Link ist abgelaufen." });
    }

    if (req.file.size > maxFileSizeBytes) {
      console.error("Datei überschreitet die maximale Größe.");
      return res
        .status(400)
        .json({ message: "Datei überschreitet die maximale Größe." });
    }

    const inputFile = req.file.path;
    const outputFileName = `${Date.now()}-${
      req.file.originalname.split(".")[0]
    }.${outputFormat}`;
    const outputFilePath = path.resolve(compressedDir, outputFileName);

    try {
      const metadata = await sharp(inputFile).metadata();
      const newWidth = Math.round(metadata.width * 0.8);
      const newHeight = Math.round(metadata.height * 0.8);

      await sharp(inputFile)
        .resize(newWidth, newHeight)
        .toFormat(outputFormat, { quality: compressionLevel })
        .toFile(outputFilePath);

      // Abzug von Credits
      db.run(
        `UPDATE customer_links SET credits = credits - 1 WHERE id = ?`,
        [cardId],
        (err) => {
          if (err) {
            console.error(
              "Fehler beim Aktualisieren der Credits:",
              err.message
            );
          }
        }
      );

      // Speicherung des Bildes in der Datenbank
      db.run(
        "INSERT INTO images (file_path, card_id) VALUES (?, ?)",
        [`/compressed/${outputFileName}`, cardId],
        (err) => {
          if (err) {
            console.error(
              "Fehler beim Speichern des Bildes in der DB:",
              err.message
            );
            return res
              .status(500)
              .json({ message: "Fehler beim Speichern des Bildes." });
          }

          if (fs.existsSync(outputFilePath)) {
            console.log("Datei erfolgreich gespeichert:", outputFilePath);
          } else {
            console.error(
              "Datei wurde nicht gefunden nach Speicherung:",
              outputFilePath
            );
          }

          res.status(200).json({
            message: "Datei erfolgreich hochgeladen und komprimiert.",
            compressed: {
              name: outputFileName,
              path: `/compressed/${outputFileName}`,
              size: fs.statSync(outputFilePath).size,
            },
          });
        }
      );
    } catch (error) {
      console.error("Fehler bei der Bildverarbeitung:", error);
      res.status(500).json({ message: "Fehler bei der Komprimierung." });
    }
  });
});

// Löschen eines Bildes
app.delete("/delete", express.json(), (req, res) => {
  if (!req.body || !req.body.filename) {
    console.error("req.body ist undefined oder 'filename' fehlt!", req.body);
    return res
      .status(400)
      .json({ message: "Fehlender Dateiname in der Anfrage." });
  }

  const { filename } = req.body;
  const filePath = path.join(__dirname, "../compressed", filename);

  // Bild aus dem Dateisystem löschen
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Fehler beim Löschen der Datei:", err);
      return res.status(500).json({
        message: "Fehler beim Löschen der Datei.",
        error: err.message,
      });
    }

    // Pfad des Bildes aus der Datenbank löschen
    deleteImage(`/compressed/${filename}`);
    res.json({ message: "Datei erfolgreich gelöscht." });
  });
});

// Abrufen aller Bilder zu einem Upload-Link
app.get("/images/:cardId", (req, res) => {
  const { cardId } = req.params;

  const sql = "SELECT * FROM images WHERE card_id = ?";
  db.all(sql, [cardId], (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Fehler beim Abrufen der Bilder." });
    }
    res.json(rows);
  });
});

// Abrufen aller Bilder
app.get("/images", (req, res) => {
  getImages((images) => {
    res.json(images);
  });
});

// Eigenschaften eines Upload-Links abrufen
app.get("/cards/:cardId", (req, res) => {
  const { cardId } = req.params;
  const query = `SELECT * FROM customer_links WHERE id = ?`;
  db.get(query, [cardId], (err, row) => {
    if (err) {
      console.error("Fehler beim Abrufen der Karte:", err.message);
      return res
        .status(500)
        .json({ success: false, message: "Fehler beim Abrufen der Karte." });
    }
    if (!row) {
      console.error("Keine Karte mit dieser ID gefunden.");
      return res
        .status(404)
        .json({ success: false, message: "Karte nicht gefunden." });
    }
    res.status(200).json({ success: true, card: row });
  });
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Download aller Bilder als ZIP-Datei
app.get("/download-all/:cardId", (req, res) => {
  const { cardId } = req.params;
  const zipFileName = `compressed_files_${cardId}.zip`;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename=${zipFileName}`);

  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(res);

  db.all(
    "SELECT file_path FROM images WHERE card_id = ?",
    [cardId],
    (err, rows) => {
      if (err) {
        console.error("Fehler beim Abrufen der Bilder:", err.message);
        return res
          .status(500)
          .json({ message: "Fehler beim Abrufen der Bilder." });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: "Keine Bilder gefunden." });
      }

      rows.forEach((row) => {
        const filePath = path.join(__dirname, "..", row.file_path);
        archive.file(filePath, { name: path.basename(filePath) });
      });

      archive.finalize();
    }
  );
});

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASS:",
  process.env.EMAIL_PASS ? "Vorhanden" : "Fehlt"
);

// E-Mail versenden
app.post("/send-email", async (req, res) => {
  const { email, cardId } = req.body;

  if (!email || !cardId) {
    return res.status(400).json({
      message:
        "Bitte geben Sie eine gültige E-Mail-Adresse und eine Karten-ID an.",
    });
  }

  const downloadLink = `http://localhost:3000/download-all/${cardId}`;

  try {
    const info = await transporter.sendMail({
      from: `"Shrinkify" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Download-Link für Ihre Dateien",
      html: `<p>Hallo,</p>
                   <p>Hier ist Ihr angefragter <b>Download-Link</b>.</p>
                   <p><a href="${downloadLink}" target="_blank">Hier klicken, um alle Dateien herunterzuladen</a></p>
                   <p>Viel Spaß wünscht Ihnen das Shrinkify Team!</p>`,
    });

    res.status(200).json({ message: "E-Mail erfolgreich gesendet.", info });
  } catch (error) {
    console.error("Fehler beim Senden der E-Mail:", error);
    res.status(500).json({ message: "Fehler beim Senden der E-Mail.", error });
  }
});

// Anfrage zusätzlicher Credits
app.post("/request-credits", (req, res) => {
  const { cardId } = req.body;

  if (!cardId) {
    return res
      .status(400)
      .json({ success: false, message: "cardId is required" });
  }

  db.run(
    `INSERT INTO credit_requests (card_id) VALUES (?)`,
    [cardId],
    function (err) {
      if (err) {
        console.error("Error requesting credits:", err.message);
        return res
          .status(500)
          .json({ success: false, message: "Error processing request" });
      }

      res.status(200).json({ success: true, message: "Credit request sent" });
    }
  );
});

// Abrufen aller Anfragen für zusätzliche Credits
app.get("/credit-requests", (req, res) => {
  db.all(
    `SELECT cr.id, cl.name AS link_name, cu.name AS customer_name 
          FROM credit_requests cr
          JOIN customer_links cl ON cr.card_id = cl.id
          JOIN customers cu ON cl.customer_id = cu.id
          WHERE cr.status = 'pending'`,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error fetching credit requests:", err.message);
        return res
          .status(500)
          .json({ success: false, message: "Error fetching requests" });
      }

      res.status(200).json({ success: true, requests: rows });
    }
  );
});

// Server starten
app.listen(port, () => {
  console.log(`Server läuft unter http://localhost:${port}`);
});
