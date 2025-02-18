// Needed for overall functionality of the server
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 3000;

app.use("/src/styles", express.static(path.join(__dirname, "/src/styles")));
app.use("/src/scripts", express.static(path.join(__dirname, "/src/scripts")));
app.use("/src/fonts", express.static(path.join(__dirname, "/src/fonts")));
app.use("/src/html", express.static(path.join(__dirname, "/src/html")));

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/src/index.html"));
});

// Database SQLite3
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');
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

    const query = `INSERT INTO customer_links (customer_id, name, file_format, max_file_size, compression_level, expiration_date, url) 
                   VALUES (?, ?, ?, ?, ?, ?, NULL)`;

    db.run(query, [customerId, name, fileFormat, maxFileSize, compressionLevel, expirationDate], function (err) {
        if (err) {
            console.error("Fehler beim Hinzufügen der Karte:", err.message);
            return res.status(500).json({ success: false, message: "Fehler beim Hinzufügen der Karte." });
        }

        db.get(`SELECT * FROM customer_links WHERE id = ?`, [this.lastID], (err, row) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Fehler beim Abrufen der Karte." });
            }
            res.status(201).json({ success: true, card: row });
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
    const { name, fileFormat, maxFileSize, compressionLevel, expirationDate, url } = req.body;

    const query = `UPDATE customer_links SET 
                   name = COALESCE(?, name),
                   file_format = COALESCE(?, file_format),
                   max_file_size = COALESCE(?, max_file_size),
                   compression_level = COALESCE(?, compressionLevel),
                   expiration_date = COALESCE(?, expiration_date),
                   url = COALESCE(?, url)
                   WHERE id = ?`;

    db.run(query, [name, fileFormat, maxFileSize, compressionLevel, expirationDate, url, cardId], function (err) {
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

// Server starten
app.listen(port, () => {
  console.log(`Server läuft unter http://localhost:${port}`);
});
