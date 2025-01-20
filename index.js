// Needed for overall functionality of the server
const express = require("express");
const multer = require("multer");
const path = require("path");

// Needed for secure link generation
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const ip = require("ip");

//
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
        project_name TEXT NOT NULL,
        file_format TEXT NOT NULL,
        max_file_size TEXT NOT NULL,
        compression_level TEXT NOT NULL,
        expiration_date DATE NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error('Error creating customer_links table:', err.message);
        } else {
            console.log('Customer links table initialized.');
        }
    });
});

//Customer Routed

// Create a new customer
app.post('/customers', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
      return res.status(400).json({ error: "Name und Email sind erforderlich." });
  }

  console.log("Received new customer:", { name, email }); // Debugging

  db.run(`INSERT INTO customers (name, email) VALUES (?, ?)`, [name, email], function (err) {
      if (err) {
          return res.status(500).json({ error: err.message });
      }

      // Fetch the newly inserted customer
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

// Create a new customer link
app.post('/customer_links', (req, res) => {
  const { customer_id, project_name, file_format, max_file_size, compression_level, expiration_date } = req.body;

  if (!customer_id || !project_name || !file_format || !max_file_size || !compression_level || !expiration_date) {
      return res.status(400).json({ error: "Alle Felder sind erforderlich." });
  }

  db.run(
      `INSERT INTO customer_links (customer_id, project_name, file_format, max_file_size, compression_level, expiration_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_id, project_name, file_format, max_file_size, compression_level, expiration_date],
      function (err) {
          if (err) {
              return res.status(500).json({ error: err.message });
          }

          // Fetch the newly inserted link
          db.get(`SELECT * FROM customer_links WHERE id = ?`, [this.lastID], (err, row) => {
              if (err) {
                  return res.status(500).json({ error: err.message });
              }
              res.json(row);
          });
      }
  );
});



// Server starten
app.listen(port, () => {
  console.log(`Server läuft unter http://localhost:${port}`);
});